const express = require('express');
const { supabase } = require('../supabase');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/me
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user, profile: req.profile });
});

// PATCH /api/me
router.patch('/me', requireAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { name, phone } = req.body || {};
  const payload = {};
  if (name !== undefined) payload.name = name;
  if (phone !== undefined) payload.phone = phone;

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', req.profile.id)
    .select('id, email, name, phone, role')
    .single();

  if (error || !data) return res.status(500).json({ error: error?.message || 'Update failed' });
  return res.json({ profile: data });
});

module.exports = router;
