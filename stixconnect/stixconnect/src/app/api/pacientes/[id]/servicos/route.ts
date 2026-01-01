import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const pacienteId = params.id;

  if (!pacienteId) {
    return NextResponse.json(
      { error: "ID do paciente não informado" },
      { status: 400 }
    );
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      "SELECT * FROM servicos WHERE paciente_id = ? AND tipo = 'avulso'",
      [pacienteId]
    );

    return NextResponse.json({ servicos: rows });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { servicos: [], error: "Erro ao buscar serviços" },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}