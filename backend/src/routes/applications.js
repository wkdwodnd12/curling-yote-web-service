const express = require('express');
const { supabase } = require('../supabase');
const { adminAuth } = require('../middleware/adminAuth');
const { requireAuth } = require('../middleware/requireAuth');
const { sendAdminNotification } = require('../lib/mailer');

const router = express.Router();

// GET /api/applications/me (user)
router.get('/me', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { data, error } = await supabase
    .from('applications')
    .select('id, section_id, status, cancel_reason, cancelled_at, created_at, sections(sport, title, apply_start_at, apply_end_at, status)')
    .eq('user_id', req.profile.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// GET /api/applications?section_id=&q= (admin)
router.get('/', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { section_id, q } = req.query;
  let query = supabase
    .from('applications')
    .select('id, section_id, user_id, name, phone, participants, request_note, memo, status, cancel_reason, cancelled_at, created_at, sections(sport, title, apply_start_at, apply_end_at, status)')
    .order('created_at', { ascending: false });

  if (section_id) query = query.eq('section_id', section_id);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// POST /api/applications (user)
router.post('/', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { section_id, name, phone, participants, request_note, memo } = req.body || {};
  if (!section_id || !name || !phone) {
    return res.status(400).json({ error: 'section_id, name, phone are required' });
  }

  const normalizedPhone = String(phone).replace(/\D/g, '');
  if (!/^01\d{8,9}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: 'Invalid phone format' });
  }

  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id, sport, status, apply_start_at, apply_end_at')
    .eq('id', section_id)
    .single();
  if (sectionError || !section) return res.status(404).json({ error: 'Section not found' });

  const now = new Date();
  if (section.apply_start_at && now < new Date(section.apply_start_at)) {
    return res.status(409).json({ error: 'Application not started' });
  }
  if (section.apply_end_at && now > new Date(section.apply_end_at)) {
    return res.status(409).json({ error: 'Application closed' });
  }
  if (section.status === '마감') {
    return res.status(409).json({ error: 'Sold out' });
  }

  const { data: duplicate } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', req.profile.id)
    .eq('section_id', section_id)
    .maybeSingle();
  if (duplicate) return res.status(409).json({ error: 'Already applied' });

  const { data: inserted, error: insertError } = await supabase
    .from('applications')
    .insert({
      section_id,
      user_id: req.profile.id,
      name,
      phone: normalizedPhone,
      participants: participants ?? null,
      request_note: request_note ?? null,
      memo: memo ?? null,
      status: 'APPLIED'
    })
    .select('*')
    .single();
  if (insertError) {
    if (insertError.message && insertError.message.toLowerCase().includes('full')) {
      return res.status(409).json({ error: 'Sold out' });
    }
    return res.status(500).json({ error: insertError.message });
  }

  try {
    await sendAdminNotification({ application: inserted, section });
  } catch (err) {
    console.error('[applications:notify] error', err);
  }

  return res.status(201).json(inserted);
});

// PATCH /api/applications/:id/cancel (user/admin)
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { cancel_reason } = req.body || {};
  let query = supabase
    .from('applications')
    .update({
      status: 'CANCELLED',
      cancel_reason: cancel_reason || null
    })
    .eq('id', id)
    .select('*')
    .single();

  if (req.profile.role !== 'admin') {
    query = query.eq('user_id', req.profile.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Application not found' });
  return res.json(data);
});

// DELETE is not allowed (soft cancel only)
router.delete('/:id', (_req, res) => {
  return res.status(405).json({ error: 'Delete not allowed' });
});

module.exports = router;
