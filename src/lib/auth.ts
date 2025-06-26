import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';

export interface TokenPayload {
  id: number;
  email: string;
  nome: string;
  tipo: string;
}

export function extractUserFromToken(req: Request): TokenPayload | null {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/auth-token=([^;]+)/);
    if (!match) return null;
    
    const token = match[1];
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
} 