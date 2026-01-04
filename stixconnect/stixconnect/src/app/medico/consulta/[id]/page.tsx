"use client";
import { useRouter, useParams, useState, useEffect } from "next/navigation";
import VideoCall from "@/components/VideoCall";
import { User, Clock, AlertTriangle, FileText, Stethoscope, CheckCircle, ArrowLeft } from "lucide-react";

interface ConsultaData {
  id: number;
  paciente: {
    id: number;
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
  };
  status: string;
  tipo: string;
  dados_triagem: {
    classificacaoUrgencia: string;
    sintomas: string;
    duracaoSintomas: string;
    intensidadeDor: string;
  };
  dados_anamnese?: any;
  dados_prescricao?: any;
  dados_atestado?: any;
  data_hora_inicio: string;
  observacoes: string;
  enfermeira_nome: string;
  historico_completo: {
    sintomas: string;
    duracao: string;
    intensidade: string;
    sinais_vitais: {
      pressao_arterial?: string;
      frequencia_cardiaca?: number;
      temperatura?: number;
      saturacao_oxigenio?: number;
    };
    historico: string;
    medicamentos: string;
    alergias: string;
    observacoes_triagem: string;
  };
}

export default function ConsultaMedicaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [consulta, setConsulta] = useState<ConsultaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [atendendo, setAtendendo] = useState(false);
  const [currentView, setCurrentView] = useState<'waiting' | 'consulta' | 'forms' | 'finalizado'>('waiting');
  
  // Estados para formulários
  const [anamnese, setAnamnese] = useState('');
  const [prescricao, setPrescricao] = useState({
    medicamentos: '',
    dosagem: '',
    frequencia: '',
    duracao: '',
    instrucoes: ''
  });
  const [atestado, setAtestado] = useState({
    tipo: '',
    dias_afastamento: 0,
    descricao: '',
    recomendacoes: ''
  });
  const [observacoesFinais, setObservacoesFinais] = useState('');

  // Carregar dados da consulta
  useEffect(() => {
    if (id) {
      carregarConsulta();
    }
  }, [id]);

  const carregarConsulta = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/medico/consulta/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setConsulta(result.data);
      } else {
        console.error('Erro ao carregar consulta:', result.error);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarAtendimento = async () => {
    try {
      setAtendendo(true);
      const response = await fetch(`/api/medico/atender/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profissionalId: 1 // ID do médico (obter do auth)
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setConsulta(prev => prev ? {...prev, status: 'atendimento_medico'} : null);
        setCurrentView('consulta');
        console.log('Atendimento médico iniciado com sucesso');
      } else {
        console.error('Erro ao iniciar atendimento:', result.error);
      }
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
    } finally {
      setAtendendo(false);
    }
  };

  const finalizarConsulta = async () => {
    if (!anamnese.trim()) {
      alert('Preencha a anamnese antes de finalizar');
      return;
    }

    try {
      const response = await fetch(`/api/medico/finalizar/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dadosAnamnese: {
            queixa_principal: consulta?.historico_completo.sintomas || '',
            historia_doenca_atual: anamnese,
            antecedentes_pessoais: '',
            antecedentes_familiares: '',
            exame_fisico: '',
            hipotese_diagnostica: ''
          },
          dadosPrescricao: prescricao,
          dadosAtestado: atestado,
          observacoesFinais
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Consulta finalizada com sucesso!');
        router.push('/medico/dashboard');
      } else {
        alert('Erro ao finalizar consulta: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao finalizar consulta:', error);
      alert('Erro ao finalizar consulta');
    }
  };

  const getClassificacaoCor = (classificacao: string) => {
    switch (classificacao) {
      case 'verde': return 'bg-green-100 text-green-800 border-green-300';
      case 'amarelo': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'laranja': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'vermelho': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Consulta não encontrada</div>
      </div>
    );
  }

  if (currentView === 'forms') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('consulta')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold">Formulários Médicos</h1>
                <span className="text-sm text-gray-600">Consulta #{consulta.id}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Anamnese */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Anamnese
                </h2>
                <textarea
                  value={anamnese}
                  onChange={(e) => setAnamnese(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva a anamnese completa do paciente..."
                />
              </div>
            </div>

            {/* Prescrição */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Prescrição Médica</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos</label>
                    <textarea
                      value={prescricao.medicamentos}
                      onChange={(e) => setPrescricao(prev => ({...prev, medicamentos: e.target.value}))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome dos medicamentos"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem</label>
                    <input
                      type="text"
                      value={prescricao.dosagem}
                      onChange={(e) => setPrescricao(prev => ({...prev, dosagem: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 500mg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                    <input
                      type="text"
                      value={prescricao.frequencia}
                      onChange={(e) => setPrescricao(prev => ({...prev, frequencia: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 8/8 horas"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                    <input
                      type="text"
                      value={prescricao.duracao}
                      onChange={(e) => setPrescricao(prev => ({...prev, duracao: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 7 dias"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instruções</label>
                    <textarea
                      value={prescricao.instrucoes}
                      onChange={(e) => setPrescricao(prev => ({...prev, instrucoes: e.target.value}))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Instruções de uso"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Atestado */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Atestado Médico</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={atestado.tipo}
                      onChange={(e) => setAtestado(prev => ({...prev, tipo: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="comparecimento">Comparecimento</option>
                      <option value="afastamento">Afastamento</option>
                      <option value="repouso">Repouso</option>
                    </select>
                  </div>
                  
                  {atestado.tipo === 'afastamento' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Afastamento</label>
                      <input
                        type="number"
                        value={atestado.dias_afastamento}
                        onChange={(e) => setAtestado(prev => ({...prev, dias_afastamento: parseInt(e.target.value) || 0}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Número de dias"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={atestado.descricao}
                      onChange={(e) => setAtestado(prev => ({...prev, descricao: e.target.value}))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrição do atestado"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recomendações</label>
                    <textarea
                      value={atestado.recomendacoes}
                      onChange={(e) => setAtestado(prev => ({...prev, recomendacoes: e.target.value}))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Recomendações médicas"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações Finais */}
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Observações Finais</h2>
              <textarea
                value={observacoesFinais}
                onChange={(e) => setObservacoesFinais(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Observações gerais sobre a consulta..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={() => setCurrentView('consulta')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Voltar para Consulta
            </button>
            <button
              onClick={finalizarConsulta}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalizar Consulta</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold flex items-center">
                <Stethoscope className="w-6 h-6 mr-2 text-blue-600" />
                Consulta Médica
              </h1>
              <span className="text-sm text-gray-600">#{consulta.id}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getClassificacaoCor(consulta.dados_triagem?.classificacaoUrgencia)}`}>
                {consulta.dados_triagem?.classificacaoUrgencia?.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600">
                {consulta.tipo === 'urgente' ? 'Urgência' : 'Agendada'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dados do Paciente e Triagem */}
          <div className="lg:col-span-1 space-y-4">
            {/* Dados do Paciente */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Dados do Paciente</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-medium">{consulta.paciente.nome}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">CPF:</span>
                  <p className="font-medium">{consulta.paciente.cpf}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <p className="font-medium">{consulta.paciente.telefone}</p>
                </div>
                {consulta.enfermeira_nome && (
                  <div>
                    <span className="text-sm text-gray-600">Encaminhado por:</span>
                    <p className="font-medium">{consulta.enfermeira_nome}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dados da Triagem */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-semibold">Triagem Realizada</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Sintomas:</span>
                  <p className="font-medium text-sm">{consulta.historico_completo.sintomas}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-gray-600">Duração:</span>
                    <p className="font-medium text-sm">{consulta.historico_completo.duracao}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Intensidade:</span>
                    <p className="font-medium text-sm">{consulta.historico_completo.intensidade}</p>
                  </div>
                </div>

                {/* Sinais Vitais */}
                <div className="border-t pt-3">
                  <h3 className="font-medium text-sm mb-2">Sinais Vitais</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">PA:</span>
                      <p className="font-medium">{consulta.historico_completo.sinais_vitais?.pressao_arterial || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">FC:</span>
                      <p className="font-medium">{consulta.historico_completo.sinais_vitais?.frequencia_cardiaca || 'N/A'} bpm</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Temp:</span>
                      <p className="font-medium">{consulta.historico_completo.sinais_vitais?.temperatura || 'N/A'} °C</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Sat O₂:</span>
                      <p className="font-medium">{consulta.historico_completo.sinais_vitais?.saturacao_oxigenio || 'N/A'} %</p>
                    </div>
                  </div>
                </div>

                {/* Histórico Médico */}
                <div className="border-t pt-3">
                  <h3 className="font-medium text-sm mb-2">Histórico Médico</h3>
                  <div className="space-y-1 text-xs">
                    {consulta.historico_completo.historico && (
                      <div>
                        <span className="text-gray-600">Doenças Prévias:</span>
                        <p className="text-xs">{consulta.historico_completo.historico}</p>
                      </div>
                    )}
                    {consulta.historico_completo.medicamentos && (
                      <div>
                        <span className="text-gray-600">Medicamentos:</span>
                        <p className="text-xs">{consulta.historico_completo.medicamentos}</p>
                      </div>
                    )}
                    {consulta.historico_completo.alergias && (
                      <div>
                        <span className="text-gray-600">Alergias:</span>
                        <p className="text-xs">{consulta.historico_completo.alergias}</p>
                      </div>
                    )}
                  </div>
                </div>

                {consulta.historico_completo.observacoes_triagem && (
                  <div className="border-t pt-3">
                    <span className="text-sm text-gray-600">Observações da Triagem:</span>
                    <p className="text-xs">{consulta.historico_completo.observacoes_triagem}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Área Principal - Video ou Conteúdo */}
          <div className="lg:col-span-2">
            {currentView === 'waiting' && (
              <div className="bg-white rounded-lg shadow-sm border p-8">
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Stethoscope className="w-12 h-12 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Sala de Consulta Médica
                    </h2>
                    
                    <div className="mb-6">
                      <p className="text-gray-600 mb-2">Paciente:</p>
                      <p className="text-lg font-semibold text-gray-900">{consulta.paciente.nome}</p>
                    </div>

                    <div className={`mb-6 p-4 rounded-lg border ${getClassificacaoCor(consulta.dados_triagem?.classificacaoUrgencia)}`}>
                      <div className="flex items-center justify-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">
                          Classificação: {consulta.dados_triagem?.classificacaoUrgencia?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {consulta.status === 'aguardando_medico' && (
                      <div className="mb-6">
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                          <Clock className="w-4 h-4 mr-2" />
                          Aguardando início da consulta
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setCurrentView('forms')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Preencher Formulários
                    </button>
                    <button
                      onClick={iniciarAtendimento}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      disabled={atendendo || consulta.status === 'atendimento_medico'}
                    >
                      <Video className="w-4 h-4" />
                      <span>{atendendo ? 'Iniciando...' : 'Iniciar Videoconsulta'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'consulta' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Consulta em Andamento</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentView('forms')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Preencher Formulários
                    </button>
                    <button
                      onClick={finalizarConsulta}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Finalizar Consulta
                    </button>
                  </div>
                </div>
                
                <VideoCall
                  consultationId={id}
                  userRole="doctor"
                  userName={`Dr. ${consulta.paciente.nome.split(' ')[0]}`}
                  onEndCall={() => setCurrentView('waiting')}
                  className="h-96"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}