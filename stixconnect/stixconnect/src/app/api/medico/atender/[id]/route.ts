import { NextResponse } from "next/server";

// POST /api/medico/atender/{id}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { profissionalId } = body;

    // Usar endpoint de teste do backend (sem autenticação para compatibilidade)
    const response = await fetch(`http://localhost:3001/api/test/atender/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'doctor',
        profissionalId
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao atender consulta:', error);
      return NextResponse.json(
        { error: 'Erro ao iniciar atendimento' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro no POST /api/medico/atender:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/medico/atender/{id}
export async function GET_ATTENDER(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar detalhes completos da consulta para médico
    const response = await fetch(`http://localhost:3001/api/test/consulta/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro ao buscar consulta:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    const result = await response.json();
    
    // Formatar para médico
    if (result.success && result.data) {
      const consulta = result.data;
      return NextResponse.json({
        success: true,
        data: {
          id: consulta.id.toString(),
          paciente: {
            id: consulta.paciente_id,
            nome: consulta.paciente_nome,
            cpf: consulta.paciente_cpf,
            email: consulta.paciente_email,
            telefone: consulta.paciente_telefone
          },
          status: consulta.status,
          tipo: consulta.tipo,
          dados_triagem: consulta.dados_triagem,
          dados_anamnese: consulta.dados_anamnese || {},
          dados_prescricao: consulta.dados_prescricao || {},
          dados_atestado: consulta.dados_atestado || {},
          data_hora_inicio: consulta.data_hora_inicio,
          observacoes: consulta.observacoes || '',
          enfermeira_id: consulta.enfermeira_id,
          medico_id: consulta.medico_id,
          enfermeira_nome: consulta.enfermeira_nome || '',
          historico_completo: {
            sintomas: consulta.dados_triagem?.sintomas || '',
            duracao: consulta.dados_triagem?.duracaoSintomas || '',
            intensidade: consulta.dados_triagem?.intensidadeDor || '',
            sinais_vitais: {
              pressao_arterial: consulta.dados_triagem?.pressaoArterial,
              frequencia_cardiaca: consulta.dados_triagem?.frequenciaCardiaca,
              temperatura: consulta.dados_triagem?.temperatura,
              saturacao_oxigenio: consulta.dados_triagem?.saturacaoOxigenio
            },
            historico: consulta.dados_triagem?.historicoDoencas || '',
            medicamentos: consulta.dados_triagem?.medicamentosUso || '',
            alergias: consulta.dados_triagem?.alergias || '',
            observacoes_triagem: consulta.dados_triagem?.observacoes || ''
          }
        }
      });
    }

    return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('Erro no GET /api/medico/atender:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}