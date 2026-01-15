import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const { JWT_SECRET = 'change-me' } = process.env;

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Fetch latest role from DB to avoid stale token issues
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, email, name, is_active')
      .eq('id', payload.id)
      .single();

    if (!error && user) {
      req.user = { 
        ...payload, 
        role: user.role,
        is_active: user.is_active
      };
    } else {
      req.user = payload;
    }
    
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const normalizedAllowed = allowedRoles.map((r) => String(r).trim().toLowerCase());
    const userRole = String(req.user.role || '').trim().toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      console.warn(`[AUTH] Forbidden Access: User ${req.user.email} (Role: "${req.user.role}") tried to access protected route. Allowed: ${normalizedAllowed.join(', ')}`);
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
