"use client";
import { useRouter, useParams, useState, useEffect } from "next/navigation";
import Teste from "../../components/TesteDispositivos";
import Image from "next/image";
import { User, Clock, AlertTriangle, Video, Phone, Send } from "lucide-react";

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
    pressaoArterial?: string;
    frequenciaCardiaca?: number;
    temperatura?: number;
    saturacaoOxigenio?: number;
    historicoDoencas?: string;
    medicamentosUso?: string;
    alergias?: string;
    observacoes?: string;
  };
  sinais_vitais: {
    pressao_arterial?: string;
    frequencia_cardiaca?: number;
    temperatura?: number;
    saturacao_oxigenio?: number;
  };
  observacoes_triagem?: string;
}

export default function SalaAtendimentoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [consulta, setConsulta] = useState<ConsultaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [atendendo, setAtendendo] = useState(false);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState('');
  const [observacoesEncaminhamento, setObservacoesEncaminhamento] = useState('');
  const [showModalEncaminhamento, setShowModalEncaminhamento] = useState(false);

  // Carregar dados da consulta
  useEffect(() => {
    if (id) {
      carregarConsulta();
      carregarMedicosDisponiveis();
    }
  }, [id]);

  const carregarConsulta = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enfermagem/atender/${id}`);
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

  const carregarMedicosDisponiveis = async () => {
    try {
      const response = await fetch('/api/enfermagem/medicos-disponiveis');
      const result = await response.json();
      setMedicos(result);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  };

  const iniciarAtendimento = async () => {
    try {
      setAtendendo(true);
      const response = await fetch(`/api/enfermagem/atender/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profissionalId: 1 // ID do enfermeiro (obter do auth)
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar status local
        setConsulta(prev => prev ? {...prev, status: 'atendimento_enfermagem'} : null);
        console.log('Atendimento iniciado com sucesso');
      } else {
        console.error('Erro ao iniciar atendimento:', result.error);
      }
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
    } finally {
      setAtendendo(false);
    }
  };

  const encaminharParaMedico = async () => {
    if (!medicoSelecionado) {
      alert('Selecione um médico');
      return;
    }

    try {
      const response = await fetch(`/api/enfermagem/encaminhar/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicoId: parseInt(medicoSelecionado),
          observacoes: observacoesEncaminhamento
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Paciente encaminhado para médico com sucesso!');
        router.push('/enfermagem/dashboard');
      } else {
        alert('Erro ao encaminhar paciente: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao encaminhar:', error);
      alert('Erro ao encaminhar paciente');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">Sala de Atendimento - #{consulta.id}</h1>
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

      <div className="container-fluid px-4 mt-4">
        <div className="flex justify-between items-start gap-6">
          {/* Lado Esquerdo - Dados do Paciente e Triagem */}
          <div className="flex-1 space-y-4">
            {/* Dados do Paciente */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold">Dados do Paciente</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium text-sm">{consulta.paciente.email}</p>
                </div>
              </div>
            </div>

            {/* Dados da Triagem */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h2 className="text-lg font-semibold">Dados da Triagem</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Sintomas:</span>
                  <p className="font-medium">{consulta.dados_triagem?.sintomas}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Duração:</span>
                    <p className="font-medium">{consulta.dados_triagem?.duracaoSintomas}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Intensidade da Dor:</span>
                    <p className="font-medium capitalize">{consulta.dados_triagem?.intensidadeDor}</p>
                  </div>
                </div>

                {/* Sinais Vitais */}
                <div className="border-t pt-3">
                  <h3 className="font-medium mb-2">Sinais Vitais</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-gray-600">Pressão Arterial:</span>
                      <p className="font-medium">{consulta.sinais_vitais?.pressao_arterial || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Frequência Cardíaca:</span>
                      <p className="font-medium">{consulta.sinais_vitais?.frequencia_cardiaca || 'N/A'} bpm</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Temperatura:</span>
                      <p className="font-medium">{consulta.sinais_vitais?.temperatura || 'N/A'} °C</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Saturação O₂:</span>
                      <p className="font-medium">{consulta.sinais_vitais?.saturacao_oxigenio || 'N/A'} %</p>
                    </div>
                  </div>
                </div>

                {/* Histórico Médico */}
                <div className="border-t pt-3">
                  <h3 className="font-medium mb-2">Histórico Médico</h3>
                  <div className="space-y-2">
                    {consulta.dados_triagem?.historicoDoencas && (
                      <div>
                        <span className="text-sm text-gray-600">Doenças Prévias:</span>
                        <p className="text-sm">{consulta.dados_triagem.historicoDoencas}</p>
                      </div>
                    )}
                    {consulta.dados_triagem?.medicamentosUso && (
                      <div>
                        <span className="text-sm text-gray-600">Medicamentos em Uso:</span>
                        <p className="text-sm">{consulta.dados_triagem.medicamentosUso}</p>
                      </div>
                    )}
                    {consulta.dados_triagem?.alergias && (
                      <div>
                        <span className="text-sm text-gray-600">Alergias:</span>
                        <p className="text-sm">{consulta.dados_triagem.alergias}</p>
                      </div>
                    )}
                  </div>
                </div>

                {consulta.observacoes_triagem && (
                  <div className="border-t pt-3">
                    <span className="text-sm text-gray-600">Observações da Triagem:</span>
                    <p className="text-sm">{consulta.observacoes_triagem}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito - Ações do Atendimento */}
          <div className="w-96 space-y-4">
            {/* Status do Atendimento */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Status do Atendimento</h2>
              
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${
                  consulta.status === 'triagem' || consulta.status === 'aguardando_enfermeira' 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                    : consulta.status === 'atendimento_enfermagem'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium capitalize">
                      {consulta.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {!atendendo && (consulta.status === 'triagem' || consulta.status === 'aguardando_enfermeira') && (
                  <button
                    onClick={iniciarAtendimento}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                    disabled={atendendo}
                  >
                    <Video className="w-4 h-4" />
                    <span>{atendendo ? 'Iniciando...' : 'Iniciar Atendimento'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Ações Disponíveis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Ações do Atendimento</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowModalEncaminhamento(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                  disabled={consulta.status !== 'atendimento_enfermagem'}
                >
                  <Send className="w-4 h-4" />
                  <span>Encaminhar para Médico</span>
                </button>

                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Chamar Paciente</span>
                </button>
              </div>
            </div>

            {/* Teste de Dispositivos */}
            <Teste />
          </div>
        </div>
      </div>

      {/* Modal de Encaminhamento */}
      {showModalEncaminhamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Encaminhar para Médico</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Médico:
                </label>
                <select
                  value={medicoSelecionado}
                  onChange={(e) => setMedicoSelecionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {medicos.map((medico) => (
                    <option key={medico.id} value={medico.id}>
                      {medico.nome} {medico.especialidade && `- ${medico.especialidade}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações do Encaminhamento:
                </label>
                <textarea
                  value={observacoesEncaminhamento}
                  onChange={(e) => setObservacoesEncaminhamento(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações importantes para o médico..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={encaminharParaMedico}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Encaminhar
                </button>
                <button
                  onClick={() => setShowModalEncaminhamento(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
