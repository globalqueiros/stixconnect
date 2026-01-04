import { NextResponse } from "next/server";

// Redirecionar para o endpoint correto
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar detalhes completos da consulta para médico
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
    
    // Formatar para médico
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
          dados_anamnese: consulta.dados_anamnese || consulta.dadosAnamnese,
          dados_prescricao: consulta.dados_prescricao || consulta.dadosPrescricao,
          dados_atestado: consulta.dados_atestado || consulta.dadosAtestado,
          data_hora_inicio: consulta.data_hora_inicio || consulta.data_hora_inicio,
          observacoes: consulta.observacoes,
          enfermeira_id: consulta.enfermeira_id,
          medico_id: consulta.medico_id,
          enfermeira_nome: consulta.enfermeira_nome,
          // Adicionar informações específicas para médico
          classificacao_urgencia: consulta.dados_triagem?.classificacaoUrgencia || 'verde',
          sintomas: consulta.dados_triagem?.sintomas || '',
          avaliacao_enfermagem: consulta.observacoes || '',
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
    console.error('Erro no GET /api/medico/consulta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}