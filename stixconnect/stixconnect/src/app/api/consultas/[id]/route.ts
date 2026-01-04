import { NextResponse } from "next/server";
import db from "../../../../lib/database";
import type { RowDataPacket } from 'mysql2';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID da consulta é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar consulta completa com dados do paciente
    const [consultaRows] = await db.query(
      `SELECT 
        c.idConsulta,
        c.idPaciente,
        c.data_consulta,
        c.hora_consulta,
        c.status,
        p.nome as paciente_nome,
        p.cpf as paciente_cpf,
        p.email as paciente_email,
        p.wappNumber as paciente_whatsapp
      FROM tb_consultas c
      LEFT JOIN tb_paciente p ON c.idPaciente = p.idPaciente
      WHERE c.idConsulta = ?`,
      [id]
    );

    const rows = consultaRows as RowDataPacket[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    const consulta = rows[0];

    // Formatar dados para resposta
    const response = {
      success: true,
      data: {
        id: consulta.idConsulta,
        tipo: 'agendada', // Padrão já que não existe campo tipo
        status: consulta.status,
        data_consulta: consulta.data_consulta,
        hora_consulta: consulta.hora_consulta,
        paciente: {
          id: consulta.idPaciente,
          nome: consulta.paciente_nome,
          cpf: consulta.paciente_cpf,
          email: consulta.paciente_email,
          whatsapp: consulta.paciente_whatsapp
        },
        enfermeira: null,
        medico: null,
        zoom_meeting: null
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json(
      { 
        error: "Erro ao buscar consulta",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}