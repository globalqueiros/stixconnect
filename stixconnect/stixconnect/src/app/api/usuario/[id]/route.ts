import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json((rows as any[])[0]);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar usuário:', error);
    }

    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
