import { NextResponse } from 'next/server';
import pool from '../../../lib/dbs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const usuarioId = url.searchParams.get('usuarioId');

  if (!usuarioId) return NextResponse.json({ error: 'Usuário não informado' }, { status: 400 });

  try {
    const [rows] = await pool.query(
      `SELECT bu.id as buId, b.id as beneficioId, b.nome, b.descricao, bu.status
       FROM user_benefits bu
       JOIN benefits b ON bu.beneficio_id = b.id
       WHERE bu.usuario_id = '1`,
      [usuarioId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar benefícios' }, { status: 500 });
  }
}
