import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '../../../lib/db';

const SECRET_KEY = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  try {
    console.log('Recebendo requisição');

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Token ausente');
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    const decoded: any = jwt.verify(token, SECRET_KEY!);
    if (!decoded.id) {
      console.error('ID do usuário ausente no token');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const [rows] = await db.query('SELECT * FROM representante WHERE id = ?', [decoded.id]);
    const users = rows as any[];

    if (!users || users.length === 0) {
      console.error('Usuário não encontrado');
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] }, { status: 200 });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json({ error: 'Erro no servidor', details: String(error) }, { status: 500 });
  }
}