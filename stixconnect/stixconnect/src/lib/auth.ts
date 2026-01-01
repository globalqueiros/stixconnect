import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  tipo: string;
  codPerfil: number;
}

export function verifyToken(req: NextRequest): AuthUser | null {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  req.cookies.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      name: string;
      email: string;
      tipo?: string;
      nomePerfil?: string;
      codPerfil: number;
    };
    
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      tipo: decoded.tipo || decoded.nomePerfil,
      codPerfil: decoded.codPerfil
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function createAuthMiddleware(requiredRole?: string) {
  return (req: NextRequest): { user: AuthUser } | NextResponse => {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Check role if required
    if (requiredRole) {
      const roleMap: Record<string, string> = {
        'nurse': 'enfermeira',
        'doctor': 'medico',
        'admin': 'administrador'
      };

      const expectedRole = roleMap[requiredRole] || requiredRole;
      
      if (user.tipo !== expectedRole && user.codPerfil !== getRoleCode(expectedRole)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return { user };
  };
}

function getRoleCode(role: string): number {
  const codes: Record<string, number> = {
    'medico': 4,
    'enfermeira': 5,
    'administrador': 1
  };
  return codes[role] || 0;
}