import express from 'express';
import multer from 'multer';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
import { supabase } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import AIModel from '../utils/ai.js';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const { SUPABASE_BUCKET = 'documents' } = process.env;

// --- UPLOAD DOKUMEN ---
router.post(
  '/upload',
  requireAuth,
  requireRole(['admin', 'manager', 'uploader']),
  upload.single('file'),
  body('tags').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!req.file) return res.status(400).json({ error: 'File diperlukan' });

    try {
      const { tags = '', categories = '[]' } = req.body;
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      
      let categoryArray = [];
      try {
        categoryArray = JSON.parse(categories);
      } catch (e) {
        if (typeof categories === 'string') categoryArray = [categories];
      }

      // 1. Upload ke Storage
      const ext = (req.file.originalname || '').split('.').pop();
      const path = `${uuidv4()}.${ext || 'bin'}`;
      
      const { error: storageErr } = await supabase
        .storage
        .from(SUPABASE_BUCKET)
        .upload(path, req.file.buffer, { contentType: req.file.mimetype });
      if (storageErr) throw new Error(storageErr.message);

      // Tentukan judul dari nama file (tanpa ekstensi)
      const originalName = req.file.originalname || 'Dokumen';
      const title = originalName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();

      // 2. Ekstraksi Teks
      let extractedText = '';
      const mime = req.file.mimetype;

      try {
        if (mime === 'application/pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          extractedText = pdfData.text;
        } else if (
          mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          ext.toLowerCase() === 'docx'
        ) {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          extractedText = result.value;
        }
        extractedText = extractedText.replace(/\s+/g, ' ').trim();
      } catch (err) {
        console.error('Gagal ekstrak teks:', err);
      }

      // 3. Embedding
      const contentToEmbed = `${title} ${tagArray.join(' ')} ${categoryArray.join(' ')} ${extractedText}`;
      let embedding = null;
      try {
        embedding = await AIModel.generateEmbedding(contentToEmbed);
      } catch (err) {
        console.error('Embedding failed:', err);
      }

      // 4. Insert DB
      // Semua upload masuk sebagai pending, butuh Acc/Reject oleh admin/manager
      const status = 'pending';

      const { data: doc, error: insertErr } = await supabase
        .from('documents')
        .insert([{
          title,
          tags: tagArray,
          category: categoryArray,
          file_path: path,
          file_type: req.file.mimetype,
          file_size: req.file.size,
          uploaded_by: req.user.id,
          status: status,
          approved_by: null,
          content: extractedText.substring(0, 10000), 
          embedding: embedding
        }])
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);

      // 5. Log History
      await supabase.from('document_history').insert([{
        document_id: doc.id,
        changed_by: req.user.id,
        action: 'uploaded',
        notes: `Dokumen diupload (${status})`
      }]);

      // 6. Notifications Logic
      const notifRecipients = new Map();

      // A) Notify Admin & Manager (New Upload Pending)
      const { data: approvers } = await supabase
        .from('users')
        .select('id, role')
        .in('role', ['admin', 'manager']);

      if (approvers) {
        approvers.forEach(u => {
          notifRecipients.set(u.id, {
            message: `Dokumen baru menunggu persetujuan: ${title} (oleh ${req.user.name})`,
            type: 'upload_request'
          });
        });
      }

      // B) Notify Uploader (Confirmation)
      // Note: If uploader is admin/manager, this will overwrite the message above, which is fine/better.
      notifRecipients.set(req.user.id, {
        message: `Berhasil upload "${title}". Menunggu persetujuan.`,
        type: 'upload_confirmation'
      });

      // Convert Map to Array & Insert
      const notifs = Array.from(notifRecipients.entries()).map(([uid, data]) => ({
        user_id: uid,
        message: data.message,
        type: data.type
      }));

      if (notifs.length > 0) {
        await supabase.from('notifications').insert(notifs);
      }

      return res.json({ document: doc, message: `Upload Berhasil ${status === 'pending' ? '(Menunggu Persetujuan)' : ''}` });
    } catch (error) {
      console.error('Upload Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// --- UPDATE STATUS (APPROVE/REJECT) ---
router.put(
  '/:id/status',
  requireAuth,
  requireRole(['admin', 'manager']),
  body('status').isIn(['approved', 'rejected']),
  body('rejection_note').optional().isString(),
  async (req, res) => {
    const { id } = req.params;
    const { status, rejection_note } = req.body;

    try {
      const { data: doc, error: findErr } = await supabase
        .from('documents')
        .select('id, title, uploaded_by')
        .eq('id', id)
        .single();
      if (findErr || !doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

      const updateData = {
        status,
        rejection_note: status === 'rejected' ? rejection_note : null,
        approved_by: status === 'approved' ? req.user.id : null,
        rejected_by: status === 'rejected' ? req.user.id : null
      };

      const { error: updErr } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id);

      if (updErr) throw updErr;

      // Log History
      await supabase.from('document_history').insert([{
        document_id: id,
        changed_by: req.user.id,
        action: status,
        notes: status === 'rejected' ? `Ditolak: ${rejection_note}` : 'Disetujui'
      }]);

      // NOTIFICATIONS LOGIC
      const notifs = [];

      // 1. Notify Uploader (Status Change: Approved/Rejected)
      if (doc.uploaded_by && doc.uploaded_by !== req.user.id) {
        notifs.push({
          user_id: doc.uploaded_by,
          message: `Dokumen Anda "${doc.title}" telah ${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}${status === 'rejected' ? '. Alasan: ' + (rejection_note || '-') : '.'}`,
          type: 'document_status_uploader'
        });
      }

      // 2. Notify Admin & Manager (Info: Document Processed)
      const { data: approvers } = await supabase
        .from('users')
        .select('id, role')
        .in('role', ['admin', 'manager']);

      if (approvers) {
        approvers.forEach((u) => {
          const isSelf = u.id === req.user.id;
          notifs.push({
            user_id: u.id,
            message: isSelf
              ? `Anda berhasil ${status === 'approved' ? 'menyetujui' : 'menolak'} dokumen "${doc.title}"`
              : (status === 'approved'
                  ? `Dokumen "${doc.title}" disetujui oleh ${req.user.name}`
                  : `Dokumen "${doc.title}" ditolak oleh ${req.user.name}. Alasan: ${rejection_note || '-'}`),
            type: 'document_status_manager'
          });
        });
      }

      // 3. Notify ALL USERS (Viewer, Uploader, Manager, Admin) if APPROVED
      //    "Dokumen baru terbit"
      if (status === 'approved') {
        const { data: allUsers } = await supabase
          .from('users')
          .select('id')
          .eq('is_active', true); // Hanya user aktif

        if (allUsers) {
          allUsers.forEach((u) => {
            // Optional: Don't notify the approver again if you want to avoid duplicate "New Document" notif.
            // But requirement says "Viewer gets notif... Uploader gets notif... Manager gets notif...".
            // To be safe and simple, everyone gets "Dokumen Baru Terbit" notification.
            // Exception: Maybe exclude the Uploader if they already got "Your document approved"?
            // Let's keep it additive as per "seperti user view tetapi ada tambahan"
            
            // To avoid spamming the approver (self), we might skip them for this specific message 
            // since they just got "Anda berhasil menyetujui..."
            if (u.id !== req.user.id) {
               notifs.push({
                user_id: u.id,
                message: `Dokumen baru terbit: "${doc.title}"`,
                type: 'document_new_release'
              });
            }
          });
        }
      }

      if (notifs.length > 0) {
        await supabase.from('notifications').insert(notifs);
      }

      return res.json({ message: `Dokumen berhasil di-${status}` });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// --- SEARCH DOKUMEN ---
router.get(
  '/search',
  requireAuth,
  query('q').isString().trim().isLength({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
      const { q } = req.query;
      const { role } = req.user;

      let queryEmbedding = null;
      try {
        queryEmbedding = await AIModel.generateEmbedding(q);
      } catch (err) {
        console.error('Embedding query failed:', err);
      }

      let results = [];

      // Vector Search
      if (queryEmbedding) {
        const { data: vectorData, error: vectorError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 50
        });

        if (!vectorError && vectorData) {
          // Filter soft-deleted documents manually
          const ids = vectorData.map(d => d.id);
          if (ids.length > 0) {
            const { data: validDocs } = await supabase
              .from('documents')
              .select('id, title, file_path, file_type, status, created_at, tags, content') // Fetch details
              .in('id', ids)
              .is('deleted_at', null);
            
            const validDocsMap = new Map(validDocs?.map(d => [d.id, d]) || []);
            results = vectorData
              .filter(d => validDocsMap.has(d.id))
              .map(d => ({ ...d, ...validDocsMap.get(d.id) })); // Merge details
          }
        }
      }

      // Fallback Search
      if (results.length < 5) {
        const base = supabase
          .from('documents')
          .select('id,title,tags,file_path,file_type,status,created_at,content')
          .is('deleted_at', null)
          .textSearch('fts', q, { type: 'websearch' })
          .order('created_at', { ascending: false })
          .limit(20);
        
        // Hanya tampilkan yang approved di pencarian umum
        const queryExec = base.eq('status', 'approved');
        const { data: keywordData } = await queryExec;

        if (keywordData) {
          const existingIds = new Set(results.map(r => r.id));
          keywordData.forEach(doc => {
            if (!existingIds.has(doc.id)) {
              results.push({ ...doc, similarity: 0 });
            }
          });
        }
      }

      // Tambahkan File URL untuk setiap hasil (Signed URL agar aman & pasti bisa dibuka)
      const resultsWithUrl = await Promise.all(results.map(async (doc) => {
        if (!doc.file_path) {
          console.warn(`[SEARCH] Document ${doc.id} missing file_path`);
          return doc;
        }
        try {
          // Gunakan signed URL dengan durasi 1 jam
          const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(doc.file_path, 3600);
          if (error) {
            console.error(`[SEARCH] Create Signed URL error for ${doc.file_path}:`, error.message);
            return doc;
          }
          return { ...doc, file_url: data?.signedUrl };
        } catch (e) {
          console.error(`[SEARCH] Exception generating URL for ${doc.file_path}:`, e.message);
          return doc;
        }
      }));

      return res.json({ results: resultsWithUrl.slice(0, 20) });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// --- DELETE DOKUMEN (SOFT DELETE) ---
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin', 'manager']), // Manager can also delete
  async (req, res) => {
    const { id } = req.params;

    try {
      // Cek dokumen ada
      const { data: doc, error: findErr } = await supabase
        .from('documents')
        .select('id, title, uploaded_by')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      
      if (findErr || !doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

      // Soft Delete
      const { error: updErr } = await supabase
        .from('documents')
        .update({ 
          deleted_at: new Date(),
          deleted_by: req.user.id // Track who deleted
        })
        .eq('id', id);

      if (updErr) throw updErr;

      // Log History
      await supabase.from('document_history').insert([{
        document_id: id,
        changed_by: req.user.id,
        action: 'deleted',
        notes: `Dokumen "${doc.title}" dihapus`
      }]);

      const recipients = new Set();

      if (doc.uploaded_by) {
        recipients.add(doc.uploaded_by);
      }

      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
      if (admins) {
        admins.forEach(a => {
          recipients.add(a.id);
        });
      }

      const { data: managers } = await supabase.from('users').select('id').eq('role', 'manager');
      if (managers) {
        managers.forEach(m => {
          recipients.add(m.id);
        });
      }

      const notifs = Array.from(recipients).map(uid => {
        const isSelf = uid === req.user.id;
        return {
          user_id: uid,
          message: isSelf 
            ? `Anda berhasil menghapus dokumen "${doc.title}"`
            : `Dokumen "${doc.title}" dihapus oleh ${req.user.name}`,
          type: 'deletion'
        };
      });

      if (notifs.length > 0) {
        await supabase.from('notifications').insert(notifs);
      }

      return res.json({ message: 'Dokumen berhasil dihapus' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// --- RIWAYAT DOKUMEN ---
router.get(
  '/history',
  requireAuth,
  async (req, res) => {
    try {
      // Ambil semua dokumen (termasuk yang soft deleted)
      const { data: docs, error: docsErr } = await supabase
        .from('documents')
        .select('id, title, file_type, file_path, status, created_at, deleted_at, uploaded_by, approved_by, deleted_by, rejected_by, rejection_note')
        .order('created_at', { ascending: false })
        .limit(100);
      if (docsErr) return res.status(500).json({ error: docsErr.message });

      // Kumpulkan semua user ID yang perlu di-resolve namanya
      const userIds = new Set();
      docs.forEach(d => {
        if (d.uploaded_by) userIds.add(d.uploaded_by);
        if (d.approved_by) userIds.add(d.approved_by);
        if (d.deleted_by) userIds.add(d.deleted_by);
        if (d.rejected_by) userIds.add(d.rejected_by);
      });

      const uniqueUserIds = Array.from(userIds);
      let userMap = {};
      
      if (uniqueUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', uniqueUserIds);
        userMap = Object.fromEntries((usersData || []).map(u => [u.id, u.name]));
      }

      const history = [];

      for (const doc of docs || []) {
        let fileUrl = null;
        if (doc.file_path) {
          try {
            const { data: urlData } = await supabase.storage
              .from(SUPABASE_BUCKET)
              .createSignedUrl(doc.file_path, 3600);
            fileUrl = urlData?.signedUrl || null;
          } catch {
            fileUrl = null;
          }
        }

        history.push({
          id: doc.id,
          title: doc.title,
          type: doc.file_type,
          status: doc.deleted_at ? 'deleted' : (doc.status || 'active'),
          uploaded_at: doc.created_at,
          deleted_at: doc.deleted_at,
          uploader: userMap[doc.uploaded_by] || 'Unknown',
          uploaded_by: doc.uploaded_by,
          approved_by_name: userMap[doc.approved_by] || '-',
          deleted_by_name: userMap[doc.deleted_by] || '-',
          rejected_by_name: userMap[doc.rejected_by] || '-',
          rejection_note: doc.rejection_note,
          file_url: fileUrl
        });
      }

      return res.json({ history });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- LIST DOKUMEN (untuk halaman daftar/hapus) ---
router.get(
  '/',
  requireAuth,
  async (req, res) => {
    try {
      const role = String(req.user.role || '').toLowerCase();
      let query = supabase
        .from('documents')
        .select('id,title,file_type,status,created_at,file_path,uploaded_by,deleted_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (role === 'viewer') {
        query = query.eq('status', 'approved');
      } else if (role === 'uploader') {
        // Uploader: lihat approved + dokumen sendiri (pending/approved)
        query = query.or(`status.eq.approved,uploaded_by.eq.${req.user.id}`);
      } // admin/manager: lihat semua yang belum dihapus

      const { data: docs, error } = await query;
      if (error) throw error;

      const withUrl = await Promise.all((docs || []).map(async (doc) => {
        if (!doc.file_path) return doc;
        try {
          const { data: urlData } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(doc.file_path, 3600);
          return { ...doc, file_url: urlData?.signedUrl || null };
        } catch {
          return { ...doc, file_url: null };
        }
      }));

      return res.json({ documents: withUrl });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- FAVORITES: GET daftar favorit user (detail dokumen) ---
router.get(
  '/favorites',
  requireAuth,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('document_id, created_at, documents(id, title, file_type, tags, status, created_at, deleted_at, file_path)')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });

      const items = (data || [])
        .map((row) => {
          const d = row.documents;
          if (!d) return null;
          return {
            id: d.id,
            title: d.title,
            file_type: d.file_type,
            tags: d.tags,
            status: d.deleted_at ? 'deleted' : d.status,
            created_at: d.created_at,
            favorite_at: row.created_at,
            file_path: d.file_path
          };
        })
        .filter(Boolean);

      return res.json({ favorites: items });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- FAVORITES: GET hanya ID favorit user (untuk penandaan bintang cepat) ---
router.get(
  '/favorites/ids',
  requireAuth,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('document_id')
        .eq('user_id', req.user.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ids: (data || []).map((r) => r.document_id) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- FAVORITES: Tambah favorit ---
router.post(
  '/:id/favorite',
  requireAuth,
  async (req, res) => {
    const { id } = req.params;
    try {
      // Pastikan dokumen ada dan tidak soft-deleted
      const { data: doc, error: findErr } = await supabase
        .from('documents')
        .select('id, deleted_at')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      if (findErr) return res.status(500).json({ error: findErr.message });
      if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

      // Upsert favorit
      const { error: insErr } = await supabase
        .from('favorites')
        .insert([{ user_id: req.user.id, document_id: id }], { upsert: true });
      if (insErr) return res.status(500).json({ error: insErr.message });

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- FAVORITES: Hapus favorit ---
router.delete(
  '/:id/favorite',
  requireAuth,
  async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', req.user.id)
        .eq('document_id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

 

// --- APPROVED LIST (Latest approved documents) ---
router.get(
  '/approved',
  requireAuth,
  async (req, res) => {
    try {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('id,title,tags,file_path,file_type,status,created_at')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const resultsWithUrl = await Promise.all((docs || []).map(async (doc) => {
        if (!doc.file_path) return doc;
        try {
          const { data, error: urlErr } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(doc.file_path, 3600);
          if (urlErr) return doc;
          return { ...doc, file_url: data?.signedUrl };
        } catch {
          return doc;
        }
      }));
      return res.json({ results: resultsWithUrl });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

export default router;
