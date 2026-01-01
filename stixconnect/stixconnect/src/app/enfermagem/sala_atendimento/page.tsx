'use client';

import React, { useState, useEffect, useRef } from 'react';
import VideoCall from '@/components/VideoCall';
import DeviceTest from '@/components/DeviceTest';

interface WaitingPatient {
  id: string;
  pacienteId: string;
  nome: string;
  tipo: 'urgente' | 'agendada';
  dataChegada: string;
  dadosTriagem?: any;
  status: string;
}

interface ConsultationRoom {
  consultationId: string;
  patientInfo: WaitingPatient;
}

export default function SalaAtendimento() {
  const [currentView, setCurrentView] = useState<'queue' | 'devices' | 'consultation'>('queue');
  const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<WaitingPatient | null>(null);
  const [currentConsultation, setCurrentConsultation] = useState<ConsultationRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devicesTested, setDevicesTested] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWaitingPatients();
    
    // Start polling for updates
    pollIntervalRef.current = setInterval(fetchWaitingPatients, 10000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchWaitingPatients = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/consultas/aguardando?role=nurse');
      
      if (response.status === 429 && retryCount < 3) {
        // Rate limited, retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchWaitingPatients(retryCount + 1), delay);
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setWaitingPatients(data.patients || []);
        setError(null);
      } else if (response.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setError(data.error || 'Erro ao carregar fila de pacientes');
      }
      setLoading(false);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: WaitingPatient) => {
    try {
      const response = await fetch(`/api/consultas/${patient.id}/atender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'nurse' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSelectedPatient(patient);
        setCurrentView('devices');
      } else if (response.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setError(data.error || 'Erro ao selecionar paciente');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleDevicesTestComplete = (success: boolean) => {
    setDevicesTested(success);
    if (success && selectedPatient) {
      setCurrentConsultation({
        consultationId: selectedPatient.id,
        patientInfo: selectedPatient
      });
      setCurrentView('consultation');
    }
  };

  const handleEndCall = () => {
    setCurrentConsultation(null);
    setSelectedPatient(null);
    setCurrentView('queue');
    fetchWaitingPatients(); // Refresh the queue
  };

  const handleForwardToDoctor = async (patientId: string) => {
    try {
      const response = await fetch(`/api/consultas/${patientId}/encaminhar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: 'doctor',
          role: 'nurse'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        handleEndCall();
      } else if (response.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setError(data.error || 'Erro ao encaminhar paciente');
      }
    } catch (err) {
      setError('Erro ao encaminhar paciente');
    }
  };

  const handleTriageComplete = async (triageData: any) => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/triagem/${selectedPatient.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triageData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        handleForwardToDoctor(selectedPatient.id);
      } else if (response.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setError(data.error || 'Erro ao salvar triagem');
      }
    } catch (err) {
      setError('Erro ao salvar triagem');
    }
  };

  // Queue view
  if (currentView === 'queue') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">StixConnect</h1>
                <span className="ml-4 text-gray-600">Sala de Atendimento - Enfermagem</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('devices')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Testar Dispositivos
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Statistics */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Aguardando</span>
                    <span className="text-2xl font-bold text-blue-600">{waitingPatients.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Urgentes</span>
                    <span className="text-xl font-bold text-red-600">
                      {waitingPatients.filter(p => p.tipo === 'urgente').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Agendadas</span>
                    <span className="text-xl font-bold text-green-600">
                      {waitingPatients.filter(p => p.tipo === 'agendada').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-blue-900 mb-2">Prioridade de Atendimento</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Urgência Vermelha</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span>Urgência Laranja</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Urgência Amarela</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Urgência Verde</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Queue */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Fila de Pacientes</h2>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando fila de pacientes...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                    <button 
                      onClick={fetchWaitingPatients}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : waitingPatients.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>Nenhum paciente aguardando no momento</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {waitingPatients.map((patient) => (
                      <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">{patient.nome}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                patient.tipo === 'urgente' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {patient.tipo === 'urgente' ? 'Urgente' : 'Agendada'}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Chegada: {new Date(patient.dataChegada).toLocaleString('pt-BR')}
                            </div>
                            {patient.dadosTriagem?.classificacaoUrgencia && (
                              <div className="mt-2 flex items-center">
                                <span className="text-sm text-gray-600 mr-2">Classificação:</span>
                                <div className={`w-4 h-4 rounded-full mr-2 ${
                                  patient.dadosTriagem.classificacaoUrgencia === 'vermelho' ? 'bg-red-500' :
                                  patient.dadosTriagem.classificacaoUrgencia === 'laranja' ? 'bg-orange-500' :
                                  patient.dadosTriagem.classificacaoUrgencia === 'amarelo' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}></div>
                                <span className="text-sm font-medium capitalize">
                                  {patient.dadosTriagem.classificacaoUrgencia}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleSelectPatient(patient)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                              Atender
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Device test view
  if (currentView === 'devices') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">StixConnect</h1>
                <span className="ml-4 text-gray-600">Teste de Dispositivos</span>
              </div>
              <button
                onClick={() => setCurrentView('queue')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Paciente Selecionado</h3>
            <p className="text-blue-800">
              {selectedPatient?.nome} - {selectedPatient?.tipo === 'urgente' ? 'Consulta Urgente' : 'Consulta Agendada'}
            </p>
          </div>

          <DeviceTest 
            onTestComplete={handleDevicesTestComplete}
            className="mb-8"
          />
          
          {devicesTested && (
            <div className="text-center">
              <button
                onClick={() => {
                  if (selectedPatient) {
                    setCurrentConsultation({
                      consultationId: selectedPatient.id,
                      patientInfo: selectedPatient
                    });
                    setCurrentView('consultation');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Iniciar Atendimento
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Video consultation view
  return (
    <div className="relative">
      <VideoCall
        consultationId={currentConsultation!.consultationId}
        userRole="nurse"
        userName="Enfermeiro" // TODO: Obter nome do usuário logado
        onEndCall={handleEndCall}
        className="h-screen"
      />
      
      {/* Action buttons overlay */}
      <div className="absolute top-20 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
          <button
            onClick={() => {
              // Open triage form modal
              console.log('Abrir formulário de triagem');
            }}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ficha de Triagem
          </button>
          <button
            onClick={() => handleForwardToDoctor(currentConsultation!.consultationId)}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Encaminhar para Médico
          </button>
        </div>
      </div>
    </div>
  );
}