'use client';

import React, { useState } from 'react';
import VideoCall from '@/components/VideoCall';
import DeviceTest from '@/components/DeviceTest';

interface ConsultationData {
  id: string;
  tipo: 'urgente' | 'agendada';
  status: string;
  data_consulta?: string;
  hora_consulta?: string;
  paciente: {
    id: number;
    nome: string;
    cpf?: string;
    email?: string;
    whatsapp?: string;
  };
}

interface ConsultaPacienteClientProps {
  initialConsultation: ConsultationData;
  consultationId: string;
}

export default function ConsultaPacienteClient({ 
  initialConsultation, 
  consultationId 
}: ConsultaPacienteClientProps) {
  const [consultation, setConsultation] = useState<ConsultationData>(initialConsultation);
  const [currentView, setCurrentView] = useState<'waiting' | 'devices' | 'consultation'>('waiting');
  const [devicesTested, setDevicesTested] = useState(false);

  const handleDevicesTestComplete = (success: boolean) => {
    setDevicesTested(success);
    if (success) {
      setCurrentView('consultation');
    }
  };

  const handleStartConsultation = async () => {
    if (consultation?.tipo === 'urgente') {
      setCurrentView('devices');
    } else {
      setCurrentView('consultation');
    }
  };

  const handleEndCall = () => {
    window.location.href = '/agradecimento';
  };

  // Waiting view
  if (currentView === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">StixConnect</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Consulta #{consultation?.id}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  consultation?.tipo === 'urgente' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {consultation?.tipo === 'urgente' ? 'Urgente' : 'Agendada'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {consultation?.tipo === 'urgente' 
                    ? 'Consulta de Urgência' 
                    : 'Consulta Agendada'
                  }
                </h2>
                
                {consultation?.data_consulta && (
                  <div className="mb-6">
                    <p className="text-gray-600 mb-2">Data e Horário:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {consultation.data_consulta} {consultation.hora_consulta || ''}
                    </p>
                  </div>
                )}

                {consultation?.status === 'aberta' && (
                  <div className="mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aguardando profissional disponível
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Passos</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </div>
                    <p className="text-gray-700">
                      {consultation?.tipo === 'urgente' 
                        ? 'Você passará por uma triagem rápida com um profissional de enfermagem'
                        : 'Aguarde o profissional entrar na sala de consulta'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </div>
                    <p className="text-gray-700">Teste sua câmera e microfone</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      3
                    </div>
                    <p className="text-gray-700">Inicie a videochamada com o profissional</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleStartConsultation}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {consultation?.tipo === 'urgente' ? 'Iniciar Triagem' : 'Entrar na Consulta'}
                </button>
                <button
                  onClick={() => setCurrentView('devices')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Testar Dispositivos
                </button>
              </div>

              {consultation?.status === 'aberta' && (
                <p className="mt-4 text-sm text-gray-500">
                  O botão ficará disponível quando um profissional estiver pronto para atendê-lo
                </p>
              )}
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
                onClick={() => setCurrentView('waiting')}
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
          <DeviceTest 
            onTestComplete={handleDevicesTestComplete}
            className="mb-8"
          />
          
          {devicesTested && (
            <div className="text-center">
              <button
                onClick={() => setCurrentView('consultation')}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Continuar para Consulta
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Video consultation view
  return (
    <VideoCall
      consultationId={consultationId}
      userRole="patient"
      userName={consultation.paciente.nome || "Paciente"}
      onEndCall={handleEndCall}
      className="h-screen"
    />
  );
}