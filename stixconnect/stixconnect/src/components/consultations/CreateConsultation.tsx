'use client';

import { useState } from 'react';
import { Tabs, Tab, Card } from '@/components/ui';
import TriageForm from './TriageForm';
import AppointmentForm from './AppointmentForm';
import { ConsultaResponse } from '@/lib/types/consultas-criar';
import { Alert } from '@/components/ui';

interface CreateConsultationProps {
  onSuccess?: (response: ConsultaResponse) => void;
  onCancel?: () => void;
}

export default function CreateConsultation({ onSuccess, onCancel }: CreateConsultationProps) {
  const [activeTab, setActiveTab] = useState<'urgent' | 'scheduled'>('urgent');
  const [successMessage, setSuccessMessage] = useState<{ type: 'urgent' | 'scheduled'; data: ConsultaResponse } | null>(null);

  const handleTriageSubmit = (response: ConsultaResponse) => {
    setSuccessMessage({ type: 'urgent', data: response });
    if (onSuccess) {
      onSuccess(response);
    }
  };

  const handleAppointmentSubmit = (response: ConsultaResponse) => {
    setSuccessMessage({ type: 'scheduled', data: response });
    if (onSuccess) {
      onSuccess(response);
    }
  };

  const resetForm = () => {
    setSuccessMessage(null);
  };

  if (successMessage) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {successMessage.type === 'urgent' ? 'Consulta de Urgência Criada!' : 'Consulta Agendada com Sucesso!'}
            </h2>
            <p className="text-gray-600">
              {successMessage.data.data.mensagem}
            </p>
          </div>

          {/* Consultation Details */}
          <div className="bg-gray-50 rounded-lg p-6 text-left">
            <h3 className="font-medium text-gray-900 mb-4">Detalhes da Consulta</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Protocolo:</span>
                <span className="font-medium">#{successMessage.data.data.consultaId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-medium">
                  {successMessage.data.data.tipo === 'urgente' ? 'Urgência' : 'Agendada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">{successMessage.data.data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paciente:</span>
                <span className="font-medium">{successMessage.data.data.paciente.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-sm">{successMessage.data.data.paciente.email}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Próximos Passos</h4>
            <p className="text-blue-700 text-sm">
              {successMessage.data.data.proximoPasso}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Nova Consulta
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Nova Consulta</h1>
        <p className="mt-2 text-gray-600">
          Escolha o tipo de consulta que deseja criar
        </p>
      </div>

      {/* Type Selection */}
      <Card className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <Tab
                value="urgent"
                className="flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm cursor-pointer transition-colors"
                activeClassName="border-blue-500 text-blue-600"
                inactiveClassName="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Consulta Urgente</div>
                    <div className="text-xs text-gray-500">Atendimento imediato</div>
                  </div>
                </div>
              </Tab>
              
              <Tab
                value="scheduled"
                className="flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm cursor-pointer transition-colors"
                activeClassName="border-blue-500 text-blue-600"
                inactiveClassName="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Agendar Consulta</div>
                    <div className="text-xs text-gray-500">Marcar horário</div>
                  </div>
                </div>
              </Tab>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'urgent' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        Triagem Obrigatória
                      </h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>
                          Consultas de urgência passam por triagem para avaliação da prioridade. 
                          O tempo de atendimento será definido conforme a classificação de urgência.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <TriageForm onSubmit={handleTriageSubmit} onCancel={onCancel} />
              </div>
            )}

            {activeTab === 'scheduled' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Agendamento Online
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Escolha o profissional e horário desejado. Você receberá uma confirmação 
                          por email após o agendamento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <AppointmentForm onSubmit={handleAppointmentSubmit} onCancel={onCancel} />
              </div>
            )}
          </div>
        </Tabs>
      </Card>
    </div>
  );
}