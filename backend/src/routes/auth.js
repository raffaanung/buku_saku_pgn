import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const { JWT_SECRET = 'change-me', ADMIN_LOGIN_ENFORCE_NAME = 'true' } = process.env;

function sign(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendMail } from '../utils/mailer.js';

// ... existing code ...

// --- REGISTER (Request Access) ---
const gmailOnly = body('email')
  .isEmail()
  .normalizeEmail({ gmail_remove_dots: false })
  .custom((value) => {
    if (!value.toLowerCase().endsWith('@gmail.com')) {
      throw new Error('Hanya email @gmail.com yang diperbolehkan');
    }
    return true;
  });

router.post(
  '/register',
  body('name').isString().trim().isLength({ min: 2 }),
  gmailOnly,
  body('password').isString().isLength({ min: 6 }),
  body('instansi').optional().isString().trim(),
  body('position').optional().isString().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, instansi, position } = req.body;

    try {
      const { data: existing, error: findErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (findErr) return res.status(500).json({ error: findErr.message });
      if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

      // Create user minimal dengan is_active = false (pending approval)
      // Default role = viewer
      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .insert([{ 
          name, 
          email, 
          password,
          role: 'viewer',
          instansi,
          position,
          is_active: false // Menunggu approval admin
        }])
        .select()
        .single();
      if (insertErr) throw new Error(insertErr.message);

      // Notify Admin (ada user pending baru)
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');
      
      if (admins && admins.length > 0) {
        const notifs = admins.map(a => ({
          user_id: a.id,
          message: `User baru mendaftar (pending): ${name} (${email}). Menunggu persetujuan pembuatan akun.`,
          type: 'registration_request'
        }));
        await supabase.from('notifications').insert(notifs);
      }

      // Notify User (status pending)
      if (inserted && inserted.id) {
        await supabase.from('notifications').insert([{
          user_id: inserted.id,
          message: 'Registrasi berhasil dikirim. Akun Anda menunggu persetujuan Admin QAQC.',
          type: 'registration_pending'
        }]);
      }

      // We do NOT return a token. User must wait.
      return res.json({ message: 'Registrasi berhasil. Data dikirim ke Admin. Silakan tunggu persetujuan.' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- ADMIN: REJECT USER REGISTRATION ---
router.post(
  '/admin/users/reject',
  requireAuth,
  requireRole('admin'),
  gmailOnly,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;

    try {
      // Hanya boleh menolak yang belum aktif
      const { data: pendingUser } = await supabase
        .from('users')
        .select('id, name, is_active')
        .eq('email', email)
        .maybeSingle();

      if (!pendingUser) return res.status(404).json({ error: 'User tidak ditemukan' });
      if (pendingUser.is_active) return res.status(400).json({ error: 'User sudah aktif, tidak bisa di-reject' });

      // Log rejection via notifications (actor = admin doing rejection)
      await supabase.from('notifications').insert([{
        user_id: req.user.id,
        message: `Menolak registrasi: ${email}`
      }]);

      // 0. Delete Notifications related to User (recipient) first
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', pendingUser.id);

      // Reject = hapus user pending (tanpa menyisakan akun)
      const { error: delErr } = await supabase
        .from('users')
        .delete()
        .eq('id', pendingUser.id);
      if (delErr) throw delErr;

      await sendMail({
        to: email,
        subject: 'Registrasi Ditolak',
        text: 'Mohon maaf, registrasi Anda ditolak oleh QAQC.',
        html: `<p>Mohon maaf, registrasi Anda ditolak oleh QAQC.</p>`
      });

      return res.json({ message: 'Registrasi user ditolak dan data pending dihapus.' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- ADMIN: CREATE USER ---
router.post(
  '/admin/users',
  requireAuth,
  requireRole('admin'),
  body('name').isString().trim().isLength({ min: 2 }),
  gmailOnly,
  body('password').optional().isString().isLength({ min: 6 }), // Optional saat update/approve jika user sudah punya password
  body('role').isIn(['admin', 'manager', 'uploader', 'viewer']),
  body('position').optional({ nullable: true, checkFalsy: true }).isString(),
  body('instansi').optional({ nullable: true, checkFalsy: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, role, position, instansi } = req.body;

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id, is_active, password')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        if (!existing.is_active) {
          let finalPassword = existing.password;
          if (password && password !== 'unchanged') {
            finalPassword = password;
          }
          if (!finalPassword) {
            finalPassword = Math.random().toString(36).slice(-8);
          }

          const { error: updErr } = await supabase
            .from('users')
            .update({ name, role, position, instansi, is_active: true, password: finalPassword })
            .eq('id', existing.id);
          if (updErr) throw updErr;

          await supabase.from('notifications').insert([{
            user_id: req.user.id,
            message: `Menyetujui registrasi: ${email}`,
            type: 'registration_approved'
          }]);

          return res.json({ message: 'User pending berhasil di-approve dan diaktifkan.' });
        }

        const updateData = { name, role, position, instansi, is_active: true };
        if (password && password !== 'unchanged') {
          updateData.password = password;
        }

        const { error: updErr } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', existing.id);
        if (updErr) throw updErr;

        return res.json({ message: 'User aktif berhasil diupdate.' });
      } else {
        // CASE: CREATE NEW USER MANUALLY
        if (!password) return res.status(400).json({ error: 'Password wajib diisi untuk user baru' });
        
        const { error: insErr } = await supabase
          .from('users')
          .insert([{ name, email, password, role, position, instansi, is_active: true }]);
        if (insErr) throw insErr;

        return res.json({ message: 'User baru berhasil dibuat.' });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- ADMIN: RESET PASSWORD ---
router.post(
  '/admin/reset-password',
  requireAuth,
  requireRole('admin'),
  gmailOnly,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;

    try {
      const { data: user } = await supabase.from('users').select('id, name').eq('email', email).maybeSingle();
      if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

      const newPassword = Math.random().toString(36).slice(-8);
      
      const { error: updErr } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);
      
      if (updErr) throw updErr;

      await sendMail({
        to: email,
        subject: 'Reset Password',
        text: `Password Baru Anda: ${newPassword}`,
        html: `<p>Password baru Anda: <b>${newPassword}</b></p>`
      });

      return res.json({ message: `Password berhasil direset. Email telah dikirim ke ${email}` });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- ADMIN: LIST USERS ---
router.get(
  '/admin/users',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, position, instansi, password, is_active, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.json({ users });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  '/login/user',
  body('name').isString().trim().isLength({ min: 2 }),
  gmailOnly,
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password } = req.body;

    // Ambil kolom password (plain)
    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,password,role,is_active')
      .eq('email', email)
      .neq('role', 'admin') // Allow all roles except admin
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!user) return res.status(401).json({ error: 'Kredensial salah' });

    // Cek status aktif
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Akun Anda belum diaktifkan oleh Admin. Silakan tunggu persetujuan.' });
    }

    // BANDINGKAN PLAIN TEXT
    if (password !== user.password) return res.status(401).json({ error: 'Kredensial salah' });

    if (String(ADMIN_LOGIN_ENFORCE_NAME) === 'true' && user.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      return res.status(401).json({ error: 'Nama tidak sesuai' });
    }

    const token = sign(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }
);

router.post(
  '/login/admin',
  body('name').isString().trim().isLength({ min: 2 }),
  gmailOnly,
  body('passkey').isString().isLength({ min: 4 }),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    // DEBUG LOG
    console.log('📝 Login Admin Attempt:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, passkey, password } = req.body;

    // Ambil kolom password dan passkey (plain)
    const { data: admin, error } = await supabase
      .from('users')
      .select('id,name,email,password,passkey,role')
      .eq('email', email)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (error) {
        console.error('❌ DB Error:', error);
        return res.status(500).json({ error: error.message });
    }
    if (!admin) {
        console.log('❌ Admin not found or role mismatch');
        return res.status(401).json({ error: 'Kredensial salah' });
    }

    if (String(ADMIN_LOGIN_ENFORCE_NAME) === 'true' && admin.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      console.log(`❌ Name mismatch: DB '${admin.name}' vs Input '${name}'`);
      return res.status(401).json({ error: 'Nama tidak sesuai' });
    }

    // BANDINGKAN PLAIN TEXT
    if (password !== admin.password) {
        console.log(`❌ Password mismatch: DB '${admin.password}' vs Input '${password}'`);
        return res.status(401).json({ error: 'Kredensial salah' });
    }
    if (!admin.passkey) {
        console.log('❌ Admin has no passkey');
        return res.status(401).json({ error: 'Akun admin belum memiliki passkey' });
    }
    if (passkey !== admin.passkey) {
        console.log(`❌ Passkey mismatch: DB '${admin.passkey}' vs Input '${passkey}'`);
        return res.status(401).json({ error: 'Passkey salah' });
    }

    console.log('✅ Login Admin Success');
    const token = sign(admin);
    return res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  }
);

// --- NEW ROUTES ---

// 1. Request Registration
router.post(
  '/request-registration',
  body('name').isString().trim().notEmpty(),
  gmailOnly,
  body('position').isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { name, email, position } = req.body;

    // Cari semua admin untuk dikirim notifikasi
    const { data: admins, error: adminErr } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');
    
    if (adminErr) return res.status(500).json({ error: adminErr.message });

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        message: `Permintaan registrasi baru: ${name} (${email}) - ${position}`,
        type: 'registration_request'
      }));

      const { error: notifErr } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (notifErr) console.error('Gagal kirim notif admin:', notifErr);
    }

    // Return success (mock email sending)
    return res.json({ message: 'Permintaan terkirim. Admin akan memproses akun Anda.' });
  }
);

// 2. Create User (Admin Only)
router.post(
  '/users',
  requireAuth,
  requireRole('admin'),
  body('name').isString().trim().notEmpty(),
  gmailOnly,
  body('password').isString().isLength({ min: 6 }),
  body('role').isIn(['manager', 'uploader', 'viewer', 'admin']),
  body('position').isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, position } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ name, email, password, role, position }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Mock sending email to user
    return res.json({ message: 'User berhasil dibuat', user: newUser });
  }
);

// 3. Reset Password (Admin Only)
router.post(
  '/reset-password',
  requireAuth,
  requireRole('admin'),
  gmailOnly,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    // Generate random password
    const newPassword = Math.random().toString(36).slice(-8);

    const { data: user, error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('email', email)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    // Mock sending email
    return res.json({ 
      message: `Password berhasil direset untuk ${email}.`, 
      newPassword // In production, do not return this, send via email!
    });
  }
);

// --- ADMIN: SUMMARY (Pending / Approvals / Rejections) ---
router.get(
  '/admin/summary',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const now = Date.now();
      const cutoff30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      const cutoff1d = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const h7Ms = 23 * 24 * 60 * 60 * 1000;

      // Pending users
      const { data: pendingUsers, error: pendErr } = await supabase
        .from('users')
        .select('id, name, email, is_active, created_at')
        .or('is_active.is.null,is_active.eq.false');
      if (pendErr) throw pendErr;
      const pendingRecent = (pendingUsers || []).filter(u => new Date(u.created_at).getTime() >= new Date(cutoff30).getTime());

      const { data: activeUsers, error: actErr } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('is_active', true)
        .gte('created_at', cutoff30)
        .order('created_at', { ascending: false })
        .limit(100);
      if (actErr) throw actErr;

      // Rejections
      const { data: rejectionLogs, error: rejErr } = await supabase
        .from('notifications')
        .select('id, user_id, message, created_at')
        .ilike('message', '%Menolak registrasi:%')
        .gte('created_at', cutoff30)
        .order('created_at', { ascending: false })
        .limit(100);
      if (rejErr) throw rejErr;

      const actorIds = Array.from(new Set([
        ...((rejectionLogs || []).map(r => r.user_id))
      ].filter(Boolean)));

      let actorMap = {};
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', actorIds);
        actorMap = Object.fromEntries((actors || []).map(a => [a.id, { name: a.name, email: a.email }]));
      }

      const active = (activeUsers || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        created_at: u.created_at
      }));

      const rejections = (rejectionLogs || []).map(l => ({
        id: l.id,
        actor_id: l.user_id,
        actor_name: actorMap[l.user_id]?.name || 'Admin',
        message: l.message,
        created_at: l.created_at
      }));

      for (const u of pendingRecent) {
        const ageMs = now - new Date(u.created_at).getTime();
        if (ageMs >= h7Ms && ageMs < 30 * 24 * 60 * 60 * 1000) {
          const msg = `H-7: Pending ${u.email} akan dihapus dari tampilan jika tidak di-approve`;
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('message', msg)
            .gte('created_at', cutoff1d)
            .limit(1);
          if (!existing || existing.length === 0) {
            await supabase.from('notifications').insert([{ user_id: req.user.id, message: msg }]);
          }
        }
      }

      return res.json({
        pending: pendingRecent || [],
        active,
        rejections
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

// --- ADMIN: DELETE USER ---
router.delete(
  '/admin/users/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const { id } = req.params;
    try {
      // Jangan izinkan hapus diri sendiri atau super admin default
      if (req.user.id === id) {
        return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
      }
      const { data: target } = await supabase
        .from('users')
        .select('id,email')
        .eq('id', id)
        .maybeSingle();
      if (!target) return res.status(404).json({ error: 'User tidak ditemukan' });
      if (target.email === 'admin.qaqc@gmail.com') {
        return res.status(400).json({ error: 'Tidak dapat menghapus Super Admin.' });
      }

      // 1. Reassign Documents (uploaded_by) to Admin
      await supabase
        .from('documents')
        .update({ uploaded_by: req.user.id })
        .eq('uploaded_by', id);

      // 2. Reassign Documents (deleted_by) to Admin
      await supabase
        .from('documents')
        .update({ deleted_by: req.user.id })
        .eq('deleted_by', id);

      // 3. Reassign History (changed_by) to Admin
      await supabase
        .from('document_history')
        .update({ changed_by: req.user.id })
        .eq('changed_by', id);

      // 4. Delete Notifications related to User (recipient)
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', id);

      // 5. Akhirnya Hapus User
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return res.json({ message: 'User dan data terkait berhasil dibersihkan/dipindahkan.' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

router.delete(
  '/admin/cleanup-test-logs',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { error, count } = await supabase
        .from('notifications')
        .delete()
        .ilike('message', '%test.pending.%')
        .select('id', { count: 'exact' });
      if (error) throw error;
      return res.json({ deleted: count || 0 });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

export default router;
