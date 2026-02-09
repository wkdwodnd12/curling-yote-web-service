const express = require('express');
const { supabase } = require('../supabase');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();
const ALLOWED_SIZES = ['600x800', '800x600'];

// GET /api/popups?active=1
router.get('/', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const activeOnly = req.query.active === '1';
  let query = supabase.from('popups').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// POST /api/popups (admin only)
router.post('/', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { image_url, size, start_at, end_at } = req.body || {};
  if (!image_url || !size) {
    return res.status(400).json({ error: 'image_url and size are required' });
  }
  if (!ALLOWED_SIZES.includes(size)) {
    return res.status(400).json({ error: 'Invalid size' });
  }

  const payload = {
    image_url,
    size,
    start_at: start_at || null,
    end_at: end_at || null,
    is_active: true
  };

  const { data, error } = await supabase.from('popups').insert(payload).select('*');
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data?.[0] || null);
});

// PATCH /api/popups/:id (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { id } = req.params;
  const { is_active } = req.body || {};

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active is required' });
  }

  const { data, error } = await supabase
    .from('popups')
    .update({ is_active: !!is_active })
    .eq('id', id)
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Popup not found' });
  return res.json(data[0]);
});

// DELETE /api/popups/:id (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { id } = req.params;
  const { data, error } = await supabase.from('popups').delete().eq('id', id).select('id');
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Popup not found' });
  return res.json({ ok: true });
});

module.exports = router;
