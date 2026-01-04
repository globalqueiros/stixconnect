'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, Select } from '@/components/ui';
import { consultasCriarService } from '@/lib/api/consultas-criar';
import { 
  ScheduleData, 
  CriarConsultaData, 
  ConsultaResponse, 
  Patient, 
  ProfissionalDisponivel 
} from '@/lib/types/consultas-criar';

interface AppointmentFormProps {
  paciente?: Patient;
  profissionalId?: number;
  onSubmit?: (response: ConsultaResponse) => void;
  onCancel?: () => void;
}

export default function AppointmentForm({ paciente, profissionalId, onSubmit, onCancel }: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(paciente || null);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<Patient[]>([]);
  const [buscando, setBuscando] = useState(false);
  
  // Estado para profissionais e agendamento
  const [profissionais, setProfissionais] = useState<ProfissionalDisponivel[]>([]);
  const [carregandoProfissionais, setCarregandoProfissionais] = useState(false);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<number | null>(profissionalId || null);
  const [slotsDisponiveis, setSlotsDisponiveis] = useState<any[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horaSelecionada, setHoraSelecionada] = useState('');
  
  // Dados do formulário
  const [formData, setFormData] = useState<Partial<ScheduleData>>({
    duracaoMinutos: 30
  });

  // Carregar médicos disponíveis
  useEffect(() => {
    carregarMedicosDisponiveis();
  }, []);

  // Carregar slots quando profissional e data são selecionados
  useEffect(() => {
    if (profissionalSelecionado && dataSelecionada) {
      carregarSlotsDisponiveis();
    } else {
      setSlotsDisponiveis([]);
      setHoraSelecionada('');
    }
  }, [profissionalSelecionado, dataSelecionada]);

  // Buscar pacientes
  useEffect(() => {
    if (termoBusca.length >= 3) {
      buscarPacientes();
    } else {
      setResultadosBusca([]);
    }
  }, [termoBusca]);

  const carregarMedicosDisponiveis = async () => {
    try {
      setCarregandoProfissionais(true);
      const medicos = await consultasCriarService.getProfissionaisDisponiveis('medico');
      setProfissionais(medicos);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    } finally {
      setCarregandoProfissionais(false);
    }
  };

  const carregarSlotsDisponiveis = async () => {
    if (!profissionalSelecionado || !dataSelecionada) return;
    
    try {
      setCarregandoSlots(true);
      const slots = await consultasCriarService.getSlotsDisponiveis(profissionalSelecionado, dataSelecionada);
      setSlotsDisponiveis(slots);
    } catch (error) {
      console.error('Erro ao carregar slots:', error);
    } finally {
      setCarregandoSlots(false);
    }
  };

  const buscarPacientes = async () => {
    try {
      setBuscando(true);
      const resultados = await consultasCriarService.buscarPacientes(termoBusca);
      setResultadosBusca(resultados);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setBuscando(false);
    }
  };

  const selecionarPaciente = (paciente: Patient) => {
    setPacienteSelecionado(paciente);
    setTermoBusca('');
    setResultadosBusca([]);
  };

  const selecionarProfissional = (profissionalId: number) => {
    setProfissionalSelecionado(profissionalId);
    const profissional = profissionais.find(p => p.id === profissionalId);
    if (profissional?.especialidade) {
      setFormData(prev => ({ ...prev, especialidade: profissional.especialidade }));
    }
  };

  const validarFormulario = (): string[] => {
    const novosErros: string[] = [];

    if (!pacienteSelecionado) {
      novosErros.push('Selecione um paciente');
    }

    if (!profissionalSelecionado) {
      novosErros.push('Selecione um profissional');
    }

    if (!dataSelecionada) {
      novosErros.push('Selecione uma data');
    }

    if (!horaSelecionada) {
      novosErros.push('Selecione um horário');
    }

    if (!formData.motivo?.trim()) {
      novosErros.push('Informe o motivo da consulta');
    }

    if (!formData.duracaoMinutos || formData.duracaoMinutos < 15 || formData.duracaoMinutos > 180) {
      novosErros.push('Duração deve ser entre 15 e 180 minutos');
    }

    return novosErros;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const novosErros = validarFormulario();
    if (novosErros.length > 0) {
      setErrors(novosErros);
      return;
    }

    if (!pacienteSelecionado || !profissionalSelecionado || !dataSelecionada || !horaSelecionada) return;

    setLoading(true);
    setErrors([]);

    try {
      const dataHora = new Date(`${dataSelecionada}T${horaSelecionada}:00`);
      
      const dadosAgendamento: ScheduleData = {
        profissionalId: profissionalSelecionado,
        dataHora: dataHora.toISOString(),
        duracaoMinutos: formData.duracaoMinutos!,
        especialidade: formData.especialidade,
        motivo: formData.motivo!
      };

      const dadosConsulta: CriarConsultaData = {
        tipo: 'agendada',
        pacienteId: pacienteSelecionado.id,
        dadosAgendamento
      };

      const response = await consultasCriarService.criarConsulta(dadosConsulta);
      
      if (onSubmit) {
        onSubmit(response);
      }

    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      
      if (error.response?.data?.details) {
        setErrors(error.response.data.details.map((d: any) => d.message));
      } else {
        setErrors([error.response?.data?.message || 'Erro ao agendar consulta']);
      }
    } finally {
      setLoading(false);
    }
  };

  // Gerar opções de horário
  const gerarOpcoesHorario = () => {
    const opcoes = [];
    for (let hora = 8; hora <= 19; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        const slotDisponivel = slotsDisponiveis.find(slot => 
          slot.hora_inicio === horario || 
          (slot.disponivel && new Date(`${dataSelecionada}T${horario}:00`) >= new Date(slot.data + 'T' + slot.hora_inicio) &&
           new Date(`${dataSelecionada}T${horario}:00`) < new Date(slot.data + 'T' + slot.hora_fim))
        );
        
        if (!slotDisponivel?.reservado) {
          opcoes.push(horario);
        }
      }
    }
    return opcoes;
  };

  // Obter data mínima (hoje)
  const getDataMinima = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };

  if (!pacienteSelecionado) {
    return (
      <Card className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Selecionar Paciente</h2>
            <p className="mt-2 text-gray-600">
              Busque o paciente por nome, CPF ou email para agendar a consulta
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Digite nome, CPF ou email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            
            {buscando && (
              <div className="absolute right-3 top-3">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {resultadosBusca.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {resultadosBusca.map((paciente) => (
                <div
                  key={paciente.id}
                  onClick={() => selecionarPaciente(paciente)}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="font-medium text-gray-900">{paciente.nome}</div>
                  <div className="text-sm text-gray-500">CPF: {paciente.cpf}</div>
                  {paciente.telefone && (
                    <div className="text-sm text-gray-500">Tel: {paciente.telefone}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agendar Consulta</h2>
            <p className="mt-1 text-gray-600">
              Paciente: <span className="font-medium">{pacienteSelecionado.nome}</span>
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setPacienteSelecionado(null)}
            size="sm"
          >
            Trocar Paciente
          </Button>
        </div>

        {/* Erros */}
        {errors.length > 0 && (
          <Alert type="error">
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </Alert>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Profissional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profissional *
            </label>
            {carregandoProfissionais ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <select
                value={profissionalSelecionado || ''}
                onChange={(e) => selecionarProfissional(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um profissional...</option>
                {profissionais.map((profissional) => (
                  <option key={profissional.id} value={profissional.id}>
                    Dr(a). {profissional.nome} 
                    {profissional.especialidade && ` - ${profissional.especialidade}`}
                    {profissional.consultas_ativas > 0 && ` (${profissional.consultas_ativas} ativas)`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                min={getDataMinima()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário *
              </label>
              {carregandoSlots ? (
                <div className="flex items-center justify-center py-2">
                  <Spinner size="sm" />
                </div>
              ) : (
                <select
                  value={horaSelecionada}
                  onChange={(e) => setHoraSelecionada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!dataSelecionada || !profissionalSelecionado}
                >
                  <option value="">Selecione um horário...</option>
                  {gerarOpcoesHorario().map((horario) => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Duração e Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (minutos) *
              </label>
              <select
                value={formData.duracaoMinutos || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duracaoMinutos: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidade
              </label>
              <input
                type="text"
                value={formData.especialidade || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, especialidade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Cardiologia, Pediatria..."
                readOnly={!!profissionalSelecionado && profissionais.find(p => p.id === profissionalSelecionado)?.especialidade}
              />
            </div>
          </div>

          {/* Motivo da Consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Consulta *
            </label>
            <textarea
              value={formData.motivo || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva o motivo da consulta..."
              required
            />
          </div>

          {/* Resumo do Agendamento */}
          {profissionalSelecionado && dataSelecionada && horaSelecionada && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Resumo do Agendamento</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• <strong>Paciente:</strong> {pacienteSelecionado.nome}</div>
                <div>• <strong>Profissional:</strong> {profissionais.find(p => p.id === profissionalSelecionado)?.nome}</div>
                <div>• <strong>Data:</strong> {new Date(dataSelecionada).toLocaleDateString('pt-BR')}</div>
                <div>• <strong>Horário:</strong> {horaSelecionada}</div>
                <div>• <strong>Duração:</strong> {formData.duracaoMinutos} minutos</div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}