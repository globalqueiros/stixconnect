'use client';

import React, { useState, useEffect, useRef } from 'react';
import VideoCall from '@/components/VideoCall';
import DeviceTest from '@/components/DeviceTest';

interface ReferredPatient {
  id: string;
  pacienteId: string;
  nome: string;
  idade?: number;
  tipo: 'urgente' | 'agendada';
  dataEncaminhamento: string;
  enfermeiro: string;
  dadosTriagem?: any;
  anamnese?: any;
  status: string;
}

interface ConsultationRoom {
  consultationId: string;
  patientInfo: ReferredPatient;
}

interface PrescriptionData {
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}

interface MedicalCertificateData {
  type: 'work_leave' | 'medical_certificate' | 'other';
  duration?: number;
  reason: string;
  observations?: string;
}

export default function ConsultorioOnline() {
  const [currentView, setCurrentView] = useState<'queue' | 'devices' | 'consultation' | 'prescription' | 'certificate'>('queue');
  const [referredPatients, setReferredPatients] = useState<ReferredPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ReferredPatient | null>(null);
  const [currentConsultation, setCurrentConsultation] = useState<ConsultationRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devicesTested, setDevicesTested] = useState(false);
  const [anamneseData, setAnamneseData] = useState<any>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    medications: []
  });
  const [certificateData, setCertificateData] = useState<MedicalCertificateData>({
    type: 'medical_certificate',
    reason: ''
  });
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchReferredPatients();
    
    // Start polling for updates
    pollIntervalRef.current = setInterval(fetchReferredPatients, 15000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchReferredPatients = async () => {
    try {
      const response = await fetch('/api/consultas/encaminhados?role=doctor');
      const data = await response.json();
      
      if (response.ok) {
        setReferredPatients(data.patients || []);
        setError(null);
      } else {
        setError(data.error || 'Erro ao carregar pacientes encaminhados');
      }
      setLoading(false);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: ReferredPatient) => {
    try {
      const response = await fetch(`/api/consultas/${patient.id}/iniciar-consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'doctor' })
      });
      
      if (response.ok) {
        setSelectedPatient(patient);
        setCurrentView('devices');
      } else {
        setError('Erro ao iniciar consulta');
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
    if (currentView === 'consultation') {
      setCurrentView('prescription');
    } else {
      setCurrentConsultation(null);
      setSelectedPatient(null);
      setCurrentView('queue');
      fetchReferredPatients();
    }
  };

  const handleSaveAnamnese = async (anamnese: any) => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/consultas/${selectedPatient.id}/anamnese`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anamnese)
      });
      
      if (response.ok) {
        setAnamneseData(anamnese);
      } else {
        setError('Erro ao salvar anamnese');
      }
    } catch (err) {
      setError('Erro ao salvar anamnese');
    }
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/consultas/${selectedPatient.id}/prescricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      });
      
      if (response.ok) {
        setCurrentView('certificate');
      } else {
        setError('Erro ao salvar prescrição');
      }
    } catch (err) {
      setError('Erro ao salvar prescrição');
    }
  };

  const handleSaveCertificate = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/consultas/${selectedPatient.id}/atestado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateData)
      });
      
      if (response.ok) {
        await handleFinalizeConsultation();
      } else {
        setError('Erro ao salvar atestado');
      }
    } catch (err) {
      setError('Erro ao salvar atestado');
    }
  };

  const handleFinalizeConsultation = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/consultas/${selectedPatient.id}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'doctor' })
      });
      
      if (response.ok) {
        setCurrentConsultation(null);
        setSelectedPatient(null);
        setAnamneseData(null);
        setPrescriptionData({ medications: [] });
        setCertificateData({ type: 'medical_certificate', reason: '' });
        setCurrentView('queue');
        fetchReferredPatients();
      } else {
        setError('Erro ao finalizar consulta');
      }
    } catch (err) {
      setError('Erro ao finalizar consulta');
    }
  };

  const addMedication = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]
    }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
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
                <span className="ml-4 text-gray-600">Consultório Online</span>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Aguardando</span>
                    <span className="text-2xl font-bold text-blue-600">{referredPatients.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Urgentes</span>
                    <span className="text-xl font-bold text-red-600">
                      {referredPatients.filter(p => p.tipo === 'urgente').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Agendadas</span>
                    <span className="text-xl font-bold text-green-600">
                      {referredPatients.filter(p => p.tipo === 'agendada').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-green-900 mb-2">Classificação por Triagem</h3>
                <div className="space-y-2 text-sm text-green-800">
                  {['vermelho', 'laranja', 'amarelo', 'verde'].map((color) => (
                    <div key={color} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 bg-${color}-500 rounded-full mr-2`}></div>
                        <span className="capitalize">{color}</span>
                      </div>
                      <span className="font-semibold">
                        {referredPatients.filter(p => 
                          p.dadosTriagem?.classificacaoUrgencia === color
                        ).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Pacientes Encaminhados</h2>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando pacientes...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                    <button 
                      onClick={fetchReferredPatients}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : referredPatients.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>Nenhum paciente encaminhado no momento</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {referredPatients.map((patient) => (
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
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Encaminhado por: {patient.enfermeiro}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Encaminhamento: {new Date(patient.dataEncaminhamento).toLocaleString('pt-BR')}
                              </div>
                              {patient.dadosTriagem?.classificacaoUrgencia && (
                                <div className="flex items-center mt-2">
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
                              {patient.dadosTriagem?.sintomas && (
                                <div className="mt-2">
                                  <span className="text-sm text-gray-600">Sintomas: </span>
                                  <span className="text-sm text-gray-800">{patient.dadosTriagem.sintomas.substring(0, 100)}...</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleSelectPatient(patient)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                              Iniciar Consulta
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
                Iniciar Consulta
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Video consultation view
  if (currentView === 'consultation') {
    return (
      <div className="relative">
        <VideoCall
          consultationId={currentConsultation!.consultationId}
          userRole="doctor"
          userName="Médico" // TODO: Obter nome do usuário logado
          onEndCall={handleEndCall}
          className="h-screen"
        />
        
        {/* Action buttons overlay */}
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
            <button
              onClick={() => {
                // Open anamnese form modal
                console.log('Abrir anamnese');
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Anamnese
            </button>
            <button
              onClick={() => setCurrentView('prescription')}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Prescrição
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prescription view
  if (currentView === 'prescription') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">StixConnect</h1>
                <span className="ml-4 text-gray-600">Prescrição Médica</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('consultation')}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Voltar para Consulta
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Paciente: {selectedPatient?.nome}</h2>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Medicamentos</h3>
              
              {prescriptionData.medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome do medicamento"
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Dosagem (ex: 500mg)"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Frequência (ex: 8/8h)"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Duração (ex: 7 dias)"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="Instruções adicionais (opcional)"
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                  {prescriptionData.medications.length > 1 && (
                    <button
                      onClick={() => removeMedication(index)}
                      className="mt-3 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remover medicamento
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addMedication}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Adicionar Medicamento
              </button>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentView('certificate')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Pular Prescrição
              </button>
              <button
                onClick={handleSavePrescription}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Salvar e Continuar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Medical certificate view
  if (currentView === 'certificate') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">StixConnect</h1>
                <span className="ml-4 text-gray-600">Atestado Médico</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Paciente: {selectedPatient?.nome}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={certificateData.type}
                  onChange={(e) => setCertificateData(prev => ({ 
                    ...prev, 
                    type: e.target.value as MedicalCertificateData['type'] 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="medical_certificate">Atestado Médico</option>
                  <option value="work_leave">Atestado para Trabalho</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              {certificateData.type === 'work_leave' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Afastamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={certificateData.duration || ''}
                    onChange={(e) => setCertificateData(prev => ({ 
                      ...prev, 
                      duration: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de dias"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <textarea
                  value={certificateData.reason}
                  onChange={(e) => setCertificateData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Descreva o motivo do atestado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={certificateData.observations || ''}
                  onChange={(e) => setCertificateData(prev => ({ ...prev, observations: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleFinalizeConsultation}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Pular Atestado
              </button>
              <button
                onClick={handleSaveCertificate}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Finalizar Consulta
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}