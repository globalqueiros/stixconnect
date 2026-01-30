import { NextResponse } from 'next/server';
import pool from '../../../../lib/dbs';

export async function POST(req: Request) {
  const { usuarioId, beneficioId } = await req.json();

  if (!usuarioId || !beneficioId) {
    return NextResponse.json({ error: 'Dados faltando' }, { status: 400 });
  }

  try {
    await pool.query(
      `UPDATE 	user_benefits
       SET status = 'ativo', ativado_em = NOW()
       WHERE usuario_id = ? AND beneficio_id = ?`,
      [usuarioId, beneficioId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao ativar benefício' }, { status: 500 });
  }
}
