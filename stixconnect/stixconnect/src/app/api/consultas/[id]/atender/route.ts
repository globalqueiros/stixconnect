import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { rateLimit } from "../../../../lib/rateLimit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResult = rateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 10 // 10 requests per minute
  })(req);
  
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { id } = params;
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    // Update consultation status based on role
    let newStatus;
    if (role === 'nurse') {
      newStatus = 'atendimento_enfermagem';
    } else if (role === 'doctor') {
      newStatus = 'atendimento_medico';
    } else {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update consultation status
      await connection.execute(
        `UPDATE tb_consultas 
         SET status = ?, 
             data_hora_inicio_atendimento = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, id]
      );

      // Add to status history
      await connection.execute(
        `INSERT INTO tb_consulta_status_history 
         (id_consulta, status_anterior, status_novo, data_alteracao, alterado_por)
         SELECT id, status, ?, NOW(), ?
         FROM tb_consultas 
         WHERE id = ?`,
        [newStatus, role, id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Patient attendance started successfully",
        newStatus
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error starting patient attendance:', error);
    return NextResponse.json(
      { 
        error: "Erro ao iniciar atendimento do paciente",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}