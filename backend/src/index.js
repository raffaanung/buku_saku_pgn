import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import notificationRoutes from './routes/notifications.js';
import categoryRoutes from './routes/categories.js';
import { supabase } from './config/supabase.js';

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

async function ensureStorageBucket() {
  const name = process.env.SUPABASE_BUCKET || 'documents';
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === name);
    if (!exists) {
      await supabase.storage.createBucket(name, { public: false });
    }
  } catch (e) {
    console.warn('Bucket check/create failed:', e.message);
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  ensureStorageBucket();
  console.log(`Backend listening on http://localhost:${PORT}`);
});
