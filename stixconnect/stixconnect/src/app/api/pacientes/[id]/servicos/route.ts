import { NextResponse } from "next/server";
import db from "../../../../../lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pacienteId = (await params).id;

  if (!pacienteId) {
    return NextResponse.json(
      { error: "ID do paciente não informado" },
      { status: 400 }
    );
  }

  let conn;
  try {
    conn = await db.getConnection();

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