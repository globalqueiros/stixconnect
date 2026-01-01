import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numProntuario: string }> }
) {
  try {
    const { numProntuario } = await params;

    const [rows] = await db.query<any[]>(
      `
        SELECT
          p.*,
          c.historico_clinico AS clinicoHistorico,
          c.alergias        AS clinicoAlergias,
          c.medicacoes     AS clinicoMedicacoes,
          c.condicoes_especiais    AS clinicoCondicoes,
          c.habitos        AS clinicoHabitos,
          c.saude_mental     AS clinicoSaudeMental,
          c.vacinacao      AS clinicoVacinacao,
          c.observacoes    AS clinicoObservacoes
        FROM tb_paciente p
        LEFT JOIN tb_clinico c
          ON c.paciente_id = p.idPaciente
        WHERE p.numProntuario = ?
      `,
      [numProntuario]
    );

    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar paciente" },
      { status: 500 }
    );
  }
}
