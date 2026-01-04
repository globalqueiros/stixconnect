import { NextResponse } from "next/server";

// POST /api/enfermagem/atender/{consultaId}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { profissionalId } = body;

    // Chamar endpoint do backend para iniciar atendimento
    const response = await fetch(`http://localhost:3001/api/consultas/${id}/atender`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'nurse',
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
    console.error('Erro no POST /api/enfermagem/atender:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/enfermagem/atender/{consultaId} - Obter detalhes da consulta
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar detalhes completos da consulta
    const response = await fetch(`http://localhost:3001/api/consultas/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    const result = await response.json();
    
    // Formatar para enfermeira
    if (result.success && result.data) {
      const consulta = result.data;
      return NextResponse.json({
        success: true,
        data: {
          id: consulta.id,
          paciente: consulta.paciente,
          status: consulta.status,
          tipo: consulta.tipo,
          dados_triagem: consulta.dados_triagem || consulta.dadosTriagem,
          data_hora_inicio: consulta.data_hora_inicio || consulta.data_hora_inicio,
          observacoes: consulta.observacoes,
          enfermeira_id: consulta.enfermeira_id,
          medico_id: consulta.medico_id,
          // Adicionar informações adicionais para enfermeira
          classificacao_urgencia: consulta.dados_triagem?.classificacaoUrgencia || 
                                 consulta.dados_triagem?.classificacaoUrgencia || 'verde',
          sintomas: consulta.dados_triagem?.sintomas || '',
          duracao_sintomas: consulta.dados_triagem?.duracaoSintomas || '',
          intensidade_dor: consulta.dados_triagem?.intensidadeDor || '',
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
      });
    }

    return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('Erro no GET /api/enfermagem/atender:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}