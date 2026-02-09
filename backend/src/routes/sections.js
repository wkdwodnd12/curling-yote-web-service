const express = require('express');
const { supabase } = require('../supabase');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/sections?status=모집중|마감|전체
router.get('/', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const status = req.query.status || '모집중';
  // We sort by apply_start_at ascending so users see the soonest window first.
  // If your business prefers newest entries, switch to created_at DESC.
  let query = supabase.from('sections').select('*').order('apply_start_at', { ascending: true });
  if (status && status !== '전체') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const now = new Date();
  const normalized = (data || []).map((s) => {
    if (s.apply_end_at && new Date(s.apply_end_at) < now) {
      return { ...s, status: '마감' };
    }
    return s;
  });

  return res.json(normalized);
});

// GET /api/sections/:id
router.get('/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { data, error } = await supabase.from('sections').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Section not found' });
  return res.json(data);
});

// POST /api/sections (admin only)
router.post('/', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { sport, title, apply_start_at, apply_end_at, capacity, remaining, status, image_url } = req.body || {};
  if (!sport || !title || !apply_start_at || !apply_end_at || !capacity || !status) {
    return res.status(400).json({ error: 'sport, title, apply_start_at, apply_end_at, capacity, status are required' });
  }

  const payload = {
    sport,
    title,
    apply_start_at,
    apply_end_at,
    capacity: Number(capacity),
    remaining: remaining !== undefined ? Number(remaining) : Number(capacity),
    status,
    image_url: image_url || null
  };

  const { data, error } = await supabase.from('sections').insert(payload).select('*');
  if (error) {
    console.error('[sections:create] error', error);
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data?.[0] || null);
});

// PUT /api/sections/:id (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { id } = req.params;
  const {
    sport,
    title,
    apply_start_at,
    apply_end_at,
    capacity,
    remaining,
    status,
    image_url
  } = req.body || {};

  const payload = {};
  if (sport !== undefined) payload.sport = sport;
  if (title !== undefined) payload.title = title;
  if (apply_start_at !== undefined) payload.apply_start_at = apply_start_at;
  if (apply_end_at !== undefined) payload.apply_end_at = apply_end_at;
  if (capacity !== undefined) payload.capacity = Number(capacity);
  if (remaining !== undefined) payload.remaining = Number(remaining);
  if (status !== undefined) payload.status = status;
  if (image_url !== undefined) payload.image_url = image_url;

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const { data, error } = await supabase.from('sections').update(payload).eq('id', id).select('*');
  if (error) {
    console.error('[sections:update] error', error);
    return res.status(500).json({ error: error.message });
  }
  if (!data || data.length === 0) return res.status(404).json({ error: 'Section not found' });
  return res.json(data[0]);
});

// DELETE /api/sections/:id (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { id } = req.params;
  const { data, error } = await supabase.from('sections').delete().eq('id', id).select('id');
  if (error) {
    console.error('[sections:delete] error', error);
    return res.status(500).json({ error: error.message });
  }
  if (!data || data.length === 0) return res.status(404).json({ error: 'Section not found' });
  return res.json({ ok: true });
});

module.exports = router;
