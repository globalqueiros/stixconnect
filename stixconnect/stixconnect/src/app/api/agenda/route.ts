import { NextResponse } from 'next/server';
import pool from "../../lib/dbs";

export async function GET() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const [rows]: any = await pool.query(
      `SELECT c.*, p.*
       FROM consultation c
       JOIN patients p ON c.paciente = p.id
       WHERE DATE(c.data_hora) >= ?
       ORDER BY c.data_hora ASC`,
      [hoje]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Erro ao buscar agenda:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consultas no banco de dados' },
      { status: 500 }
    );
  }
}
