const { supabase } = require('../supabase');

const requireAuth = async (req, res, next) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const authHeader = req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, phone, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profile not found' });
  }

  req.user = data.user;
  req.profile = profile;
  return next();
};

module.exports = { requireAuth };
