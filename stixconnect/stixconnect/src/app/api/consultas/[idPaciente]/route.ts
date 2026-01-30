import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET(
  req: Request,
  { params }: { params: { idPaciente: string } }
) {
  const { idPaciente } = params;

  const [rows] = await db.query(
    `
    SELECT idConsulta, data_consulta, hora_consulta
    FROM tb_consultas
    WHERE idPaciente = ?
      AND status = '0'
    `,
    [idPaciente]
  );

  return NextResponse.json(rows);
}
