import { NextResponse } from "next/server";
import db from "../../../../lib/database";
import { rateLimit } from "../../../../lib/rateLimit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = rateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 5 // 5 requests per minute
  })(req);
  
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { id } = await params;
    const triageData = await req.json();

    // Validate required fields
    if (!triageData) {
      return NextResponse.json(
        { error: "Triage data is required" },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update consultation with triage data
      await connection.execute(
        `UPDATE tb_consultas 
         SET dados_triagem = ?,
             classificacao_urgencia = ?,
             sintomas_principais = ?,
             pressao_arterial = ?,
             frequencia_cardiaca = ?,
             frequencia_respiratoria = ?,
             temperatura = ?,
             saturacao_oxigenio = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          JSON.stringify(triageData),
          triageData.classificacaoUrgencia || null,
          triageData.sintomasPrincipais || null,
          triageData.pressaoArterial || null,
          triageData.frequenciaCardiaca || null,
          triageData.frequenciaRespiratoria || null,
          triageData.temperatura || null,
          triageData.saturacaoOxigenio || null,
          id
        ]
      );

      // Get current status
      const [currentRows] = await connection.execute(
        `SELECT status FROM tb_consultas WHERE id = ?`,
        [id]
      );

      const currentStatus = (currentRows as Array<{status: string}>)[0]?.status || 'triagem';

      // Update status to completed if not already in progress
      if (currentStatus === 'triagem' || currentStatus === 'atendimento_enfermagem') {
        await connection.execute(
          `UPDATE tb_consultas 
           SET status = 'aguardando_medico',
               updated_at = NOW()
           WHERE id = ?`,
          [id]
        );

        // Add to status history
        await connection.execute(
          `INSERT INTO tb_consulta_status_history 
           (id_consulta, status_anterior, status_novo, data_alteracao, alterado_por)
           VALUES (?, ?, ?, NOW(), 'nurse')`,
          [id, currentStatus, 'aguardando_medico']
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Triage data saved successfully",
        consultationId: id
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error saving triage data:', error);
    return NextResponse.json(
      { 
        error: "Erro ao salvar dados da triagem",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = rateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 20 // 20 requests per minute
  })(req);
  
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { id } = await params;

    // Get triage data for consultation
    const [rows] = await db.execute(
      `SELECT 
        dados_triagem,
        classificacao_urgencia,
        sintomas_principais,
        pressao_arterial,
        frequencia_cardiaca,
        frequencia_respiratoria,
        temperatura,
        saturacao_oxigenio
       FROM tb_consultas 
       WHERE id = ?`,
      [id]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    const consultation = rows[0] as {
      dados_triagem: string | null;
      classificacao_urgencia: string | null;
      sintomas_principais: string | null;
      pressao_arterial: string | null;
      frequencia_cardiaca: string | null;
      frequencia_respiratoria: string | null;
      temperatura: string | null;
      saturacao_oxigenio: string | null;
    };

    return NextResponse.json({
      success: true,
      data: {
        dadosTriagem: consultation.dados_triagem ? JSON.parse(consultation.dados_triagem) : null,
        classificacaoUrgencia: consultation.classificacao_urgencia,
        sintomasPrincipais: consultation.sintomas_principais,
        pressaoArterial: consultation.pressao_arterial,
        frequenciaCardiaca: consultation.frequencia_cardiaca,
        frequenciaRespiratoria: consultation.frequencia_respiratoria,
        temperatura: consultation.temperatura,
        saturacaoOxigenio: consultation.saturacao_oxigenio
      }
    });

  } catch (error) {
    console.error('Error fetching triage data:', error);
    return NextResponse.json(
      { 
        error: "Erro ao buscar dados da triagem",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}