import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

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
    const payload = jwt.verify(token, JWT_SECRET!) as unknown as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function createToken(payload: Omit<TokenPayload, 'id'> & { id: number }): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: '1d' });
} 