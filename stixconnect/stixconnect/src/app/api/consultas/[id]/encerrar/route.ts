import { NextResponse } from "next/server";
import db from "../../../../../lib/database";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = await request.json();

    if (!id || !role) {
      return NextResponse.json(
        { error: "ID and role are required" },
        { status: 400 }
      );
    }

    // Get current consultation status
    const [consultationRows] = await db.query(
      `SELECT status FROM consultas WHERE id = ?`,
      [id]
    );

    if (!Array.isArray(consultationRows) || consultationRows.length === 0) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    const currentStatus = (consultationRows as any[])[0]?.status;
    
    // Determine new status based on current status and role
    let newStatus;
    if (currentStatus === 'atendimento_enfermagem' && role === 'nurse') {
      newStatus = 'aguardando_medico';
    } else if (currentStatus === 'atendimento_medico' && role === 'doctor') {
      newStatus = 'finalizada';
    } else if (currentStatus === 'triagem' && role === 'nurse') {
      newStatus = 'finalizada';
    } else {
      return NextResponse.json(
        { error: "Cannot end consultation from current status" },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update consultation status
      await connection.execute(
        `UPDATE consultas 
         SET status = ?, 
             data_hora_fim = CASE WHEN ? = 'finalizada' THEN NOW() ELSE data_hora_fim END,
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, newStatus, id]
      );

      // Add to status history
      await connection.execute(
        `INSERT INTO consulta_status_history 
         (id_consulta, status_anterior, status_novo, data_alteracao, alterado_por)
         VALUES (?, ?, ?, NOW(), ?)`,
        [id, currentStatus, newStatus, role]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Consulta atualizada com sucesso",
        newStatus,
        ended: newStatus === 'finalizada'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error ending consultation:', error);
    return NextResponse.json(
      { 
        error: "Erro ao encerrar consulta",
        message: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}