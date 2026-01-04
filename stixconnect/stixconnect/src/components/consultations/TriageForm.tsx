'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, Tabs, Tab } from '@/components/ui';
import { consultasCriarService } from '@/lib/api/consultas-criar';
import { 
  TriageData, 
  CriarConsultaData, 
  ConsultaResponse, 
  Patient, 
  ProfissionalDisponivel,
  INTENSIDADE_DOR_OPTIONS,
  CLASSIFICACAO_URGENCIA_OPTIONS 
} from '@/lib/types/consultas-criar';

interface TriageFormProps {
  paciente?: Patient;
  onSubmit?: (response: ConsultaResponse) => void;
  onCancel?: () => void;
}

export default function TriageForm({ paciente, onSubmit, onCancel }: TriageFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(paciente || null);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<Patient[]>([]);
  const [buscando, setBuscando] = useState(false);
  
  // Dados do formulário
  const [formData, setFormData] = useState<Partial<TriageData>>({
    intensidadeDor: 'leve',
    classificacaoUrgencia: 'verde'
  });

  const [sinaisVitais, setSinaisVitais] = useState({
    pressaoArterial: '',
    frequenciaCardiaca: '',
    temperatura: '',
    saturacaoOxigenio: ''
  });

  // Buscar pacientes
  useEffect(() => {
    if (termoBusca.length >= 3) {
      buscarPacientes();
    } else {
      setResultadosBusca([]);
    }
  }, [termoBusca]);

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

  const validarFormulario = (): string[] => {
    const novosErros: string[] = [];

    if (!pacienteSelecionado) {
      novosErros.push('Selecione um paciente');
    }

    if (!formData.sintomas?.trim()) {
      novosErros.push('Descreva os sintomas');
    }

    if (!formData.duracaoSintomas?.trim()) {
      novosErros.push('Informe a duração dos sintomas');
    }

    const fc = parseInt(sinaisVitais.frequenciaCardiaca);
    if (fc && (fc < 30 || fc > 200)) {
      novosErros.push('Frequência cardíaca inválida (30-200 bpm)');
    }

    const temp = parseFloat(sinaisVitais.temperatura);
    if (temp && (temp < 35 || temp > 42)) {
      novosErros.push('Temperatura inválida (35-42°C)');
    }

    const saturacao = parseInt(sinaisVitais.saturacaoOxigenio);
    if (saturacao && (saturacao < 0 || saturacao > 100)) {
      novosErros.push('Saturação de oxigênio inválida (0-100%)');
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

    if (!pacienteSelecionado) return;

    setLoading(true);
    setErrors([]);

    try {
      const dadosTriagem: TriageData = {
        pacienteId: pacienteSelecionado.id,
        sintomas: formData.sintomas!,
        duracaoSintomas: formData.duracaoSintomas!,
        intensidadeDor: formData.intensidadeDor!,
        classificacaoUrgencia: formData.classificacaoUrgencia!,
        historicoDoencas: formData.historicoDoencas,
        medicamentosUso: formData.medicamentosUso,
        alergias: formData.alergias,
        pressaoArterial: sinaisVitais.pressaoArterial || undefined,
        frequenciaCardiaca: sinaisVitais.frequenciaCardiaca ? parseInt(sinaisVitais.frequenciaCardiaca) : undefined,
        temperatura: sinaisVitais.temperatura ? parseFloat(sinaisVitais.temperatura) : undefined,
        saturacaoOxigenio: sinaisVitais.saturacaoOxigenio ? parseInt(sinaisVitais.saturacaoOxigenio) : undefined,
        observacoes: formData.observacoes
      };

      const dadosConsulta: CriarConsultaData = {
        tipo: 'urgente',
        pacienteId: pacienteSelecionado.id,
        dadosTriagem
      };

      const response = await consultasCriarService.criarConsulta(dadosConsulta);
      
      if (onSubmit) {
        onSubmit(response);
      }

    } catch (error: any) {
      console.error('Erro ao criar consulta:', error);
      
      if (error.response?.data?.details) {
        setErrors(error.response.data.details.map((d: any) => d.message));
      } else {
        setErrors([error.response?.data?.message || 'Erro ao criar consulta']);
      }
    } finally {
      setLoading(false);
    }
  };

  const atualizarSinaisVitais = (campo: string, valor: string) => {
    // Permitir apenas números para campos específicos
    if (campo === 'frequenciaCardiaca' || campo === 'temperatura' || campo === 'saturacaoOxigenio') {
      if (valor && !/^\d*\.?\d*$/.test(valor)) return;
    }
    
    setSinaisVitais(prev => ({ ...prev, [campo]: valor }));
  };

  if (!pacienteSelecionado) {
    return (
      <Card className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Selecionar Paciente</h2>
            <p className="mt-2 text-gray-600">
              Busque o paciente por nome, CPF ou email para iniciar a triagem
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
            <h2 className="text-2xl font-bold text-gray-900">Triagem de Urgência</h2>
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
          {/* Sintomas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição dos Sintomas *
            </label>
            <textarea
              value={formData.sintomas || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, sintomas: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva detalhadamente os sintomas que o paciente está apresentando..."
              required
            />
          </div>

          {/* Duração e Intensidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração dos Sintomas *
              </label>
              <input
                type="text"
                value={formData.duracaoSintomas || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duracaoSintomas: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 2 horas, 3 dias, 1 semana..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intensidade da Dor *
              </label>
              <select
                value={formData.intensidadeDor}
                onChange={(e) => setFormData(prev => ({ ...prev, intensidadeDor: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {INTENSIDADE_DOR_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Classificação de Urgência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classificação de Urgência *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {CLASSIFICACAO_URGENCIA_OPTIONS.map(option => (
                <div
                  key={option.value}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.classificacaoUrgencia === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, classificacaoUrgencia: option.value as any }))}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="classificacao"
                      value={option.value}
                      checked={formData.classificacaoUrgencia === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, classificacaoUrgencia: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.classificacaoUrgencia === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.classificacaoUrgencia === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Tempo máx: {option.maxWaitTime}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sinais Vitais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sinais Vitais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pressão Arterial
                </label>
                <input
                  type="text"
                  value={sinaisVitais.pressaoArterial}
                  onChange={(e) => atualizarSinaisVitais('pressaoArterial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="120/80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência Cardíaca (bpm)
                </label>
                <input
                  type="text"
                  value={sinaisVitais.frequenciaCardiaca}
                  onChange={(e) => atualizarSinaisVitais('frequenciaCardiaca', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura (°C)
                </label>
                <input
                  type="text"
                  value={sinaisVitais.temperatura}
                  onChange={(e) => atualizarSinaisVitais('temperatura', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="36.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturação O₂ (%)
                </label>
                <input
                  type="text"
                  value={sinaisVitais.saturacaoOxigenio}
                  onChange={(e) => atualizarSinaisVitais('saturacaoOxigenio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="96"
                />
              </div>
            </div>
          </div>

          {/* Histórico Médico */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico Médico</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doenças Prévias
                </label>
                <textarea
                  value={formData.historicoDoencas || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, historicoDoencas: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Hipertensão, diabetes, problemas cardíacos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicamentos em Uso
                </label>
                <textarea
                  value={formData.medicamentosUso || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicamentosUso: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Liste todos os medicamentos que o paciente está tomando..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alergias
                </label>
                <textarea
                  value={formData.alergias || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, alergias: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Medicamentos, alimentos, latex..."
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações Adicionais
            </label>
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Qualquer informação adicional relevante..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {loading ? 'Criando Consulta...' : 'Criar Consulta de Urgência'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}