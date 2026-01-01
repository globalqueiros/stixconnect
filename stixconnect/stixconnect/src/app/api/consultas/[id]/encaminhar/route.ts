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
    const { to, role } = await req.json();

    if (!to || !role) {
      return NextResponse.json(
        { error: "Destination and role are required" },
        { status: 400 }
      );
    }

    // Determine new status based on destination
    let newStatus;
    if (to === 'doctor') {
      newStatus = 'aguardando_medico';
    } else if (to === 'nurse') {
      newStatus = 'aguardando_enfermeira';
    } else {
      return NextResponse.json(
        { error: "Invalid destination" },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current status first
      const [currentRows] = await connection.execute(
        `SELECT status FROM tb_consultas WHERE id = ?`,
        [id]
      );

      if (Array.isArray(currentRows) && currentRows.length === 0) {
        return NextResponse.json(
          { error: "Consulta não encontrada" },
          { status: 404 }
        );
      }

      const currentStatus = (currentRows as Array<{status: string}>)[0]?.status;

      // Update consultation status
      await connection.execute(
        `UPDATE tb_consultas 
         SET status = ?, 
             updated_at = NOW()
         WHERE id = ?`,
        [newStatus, id]
      );

      // Add to status history
      await connection.execute(
        `INSERT INTO tb_consulta_status_history 
         (id_consulta, status_anterior, status_novo, data_alteracao, alterado_por)
         VALUES (?, ?, ?, NOW(), ?)`,
        [id, currentStatus, newStatus, role]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: `Patient forwarded to ${to} successfully`,
        newStatus,
        forwardedTo: to
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error forwarding patient:', error);
    return NextResponse.json(
      { 
        error: "Erro ao encaminhar paciente",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}