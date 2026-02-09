const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { supabase } = require('./supabase');
const sectionsRoutes = require('./routes/sections');
const applicationsRoutes = require('./routes/applications');
const popupsRoutes = require('./routes/popups');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: [FRONTEND_ORIGIN, 'http://127.0.0.1:5173'],
    credentials: false
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Supabase 연결 확인용 임시 라우트 (테이블명은 존재하는 것으로 교체)
app.get('/supabase/health', async (_req, res) => {
  if (!supabase) {
    return res.status(500).json({ ok: false, error: 'Supabase client not initialized' });
  }
  try {
    const { data, error } = await supabase.from('applications').select('id').limit(1);
    if (error) {
      console.error('[supabase/health] query error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.json({ ok: true, rows: data.length });
  } catch (err) {
    console.error('[supabase/health] fetch failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/sections', sectionsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/popups', popupsRoutes);
app.use('/api', profileRoutes);

app.get('/', (_req, res) => {
  res.send('Backend running');
});

app.listen(PORT, () => {
  // Helpful logs for local development
  if (!supabase) {
    console.log('Supabase client not initialized (missing URL or key). Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env');
  }
  console.log(`Backend listening on http://localhost:${PORT}`);
});
