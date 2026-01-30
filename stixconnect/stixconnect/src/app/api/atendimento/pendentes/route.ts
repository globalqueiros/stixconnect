import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  const [rows] = await db.query<any[]>(`
    SELECT 
      a.id,
      a.classificacao,
      a.tempo_espera,
      p.nome
    FROM tb_atendimento a
    JOIN tb_paciente p ON p.idPaciente = a.idPaciente
    WHERE a.status = 0
    ORDER BY a.created_at ASC
  `);

  return NextResponse.json(rows);
}
