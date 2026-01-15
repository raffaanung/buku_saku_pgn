import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id,message,is_read,created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return res.json({ notifications: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mark one as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id); // Ensure ownership
    
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
