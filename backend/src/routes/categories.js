
import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all categories
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Error fetching categories (table might be missing), returning defaults:', error.message);
      // Return defaults to prevent frontend crash/error
      return res.json([
        { name: 'Prosedur' },
        { name: 'Instruksi Kerja' },
        { name: 'Materi' }
      ]);
    }
    res.json(data);
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    // Return defaults here too
    res.json([
      { name: 'Prosedur' },
      { name: 'Instruksi Kerja' },
      { name: 'Materi' }
    ]);
  }
});

// CREATE new category
router.post(
  '/',
  requireAuth,
  requireRole(['admin', 'manager', 'uploader']),
  body('name').isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name } = req.body;
      
      // Check if exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', name)
        .single();
        
      if (existing) {
        return res.status(400).json({ error: 'Kategori sudah ada' });
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name, 
          created_by: req.user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating category:', error);
      if (error.message && error.message.includes('does not exist')) {
         return res.status(500).json({ error: 'Tabel kategori belum dibuat. Hubungi administrator.' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE category
router.delete(
  '/:name',
  requireAuth,
  requireRole(['admin', 'manager', 'uploader', 'viewer']),
  async (req, res) => {
    try {
      const { name } = req.params;
      
      const { error, count } = await supabase
        .from('categories')
        .delete({ count: 'exact' })
        .eq('name', name);

      if (error) throw error;
      
      if (count === 0) {
        // Cek apakah kategori ada tapi tidak bisa dihapus (RLS) atau memang tidak ada
        return res.status(404).json({ error: 'Kategori tidak ditemukan atau Anda tidak memiliki izin menghapusnya.' });
      }

      res.json({ message: 'Category deleted' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
