import { NextResponse } from "next/server";
import db from "../../../../lib/database";
import { rateLimit } from "../../../../lib/rateLimit";

export async function GET(req: Request) {
  // Apply rate limiting
  const rateLimitResult = rateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 30 // 30 requests per minute
  })(req);
  
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Skip authentication for development - remove this in production
  // const authResult = createAuthMiddleware()(req as any);
  // if (authResult instanceof NextResponse) {
  //   return authResult;
  // }
  // const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    // Get waiting patients based on role
    let query = '';
    let params: any[] = [];

    if (role === 'nurse') {
      // Patients waiting for nurse triage
      query = `
        SELECT 
          c.id as id,
          c.idPaciente as pacienteId,
          p.nome,
          CASE 
            WHEN c.tipo_consulta = 'U' THEN 'urgente'
            ELSE 'agendada'
          END as tipo,
          DATE_FORMAT(c.data_hora_chegada, '%Y-%m-%d %H:%i:%s') as dataChegada,
          c.dados_triagem,
          c.status
        FROM consultas c
        INNER JOIN pacientes p ON c.idPaciente = p.id
        WHERE c.status IN ('triagem', 'aguardando_enfermeira')
        ORDER BY 
          CASE 
            WHEN c.tipo_consulta = 'U' THEN 1
            ELSE 2
          END,
          c.data_hora_chegada ASC
      `;
    } else if (role === 'doctor') {
      // Patients waiting for doctor
      query = `
        SELECT 
          c.id as id,
          c.idPaciente as pacienteId,
          p.nome,
          CASE 
            WHEN c.tipo_consulta = 'U' THEN 'urgente'
            ELSE 'agendada'
          END as tipo,
          DATE_FORMAT(c.data_hora_chegada, '%Y-%m-%d %H:%i:%s') as dataChegada,
          c.dados_triagem,
          c.status
        FROM consultas c
        INNER JOIN pacientes p ON c.idPaciente = p.id
        WHERE c.status = 'aguardando_medico'
        ORDER BY 
          CASE 
            WHEN c.tipo_consulta = 'U' THEN 1
            ELSE 2
          END,
          c.data_hora_chegada ASC
      `;
    } else {
      // All waiting patients
      query = `
        SELECT 
          c.id as id,
          c.idPaciente as pacienteId,
          p.nome,
          CASE 
            WHEN c.tipo_consulta = 'U' THEN 'urgente'
            ELSE 'agendada'
          END as tipo,
          DATE_FORMAT(c.data_hora_chegada, '%Y-%m-%d %H:%i:%s') as dataChegada,
          c.dados_triagem,
          c.status
        FROM consultas c
        INNER JOIN pacientes p ON c.idPaciente = p.id
        WHERE c.status IN ('triagem', 'aguardando_enfermeira', 'aguardando_medico')
        ORDER BY 
          CASE 
            WHEN c.tipo_consulta = 'U' THEN 1
            ELSE 2
          END,
          c.data_hora_chegada ASC
      `;
    }

    const [rows] = await db.query(query);

    return NextResponse.json({
      success: true,
      patients: rows
    });

  } catch (error) {
    console.error('Error fetching waiting patients:', error);
    return NextResponse.json(
      { 
        error: "Erro ao buscar pacientes aguardando",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}