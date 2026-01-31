"use client"
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { consultationService, Consulta } from "@/app/services/consultation.service";
import { AlertCircle, Loader2 } from "lucide-react";

function ConsultorioContent() {
    const searchParams = useSearchParams();
    const consultaId = searchParams.get("id");
    
    const [showReceituario, setShowReceituario] = useState(false);
    const [showEncaminhamento, setShowEncaminhamento] = useState(false);
    const [consulta, setConsulta] = useState<Consulta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoomUrl, setZoomUrl] = useState<string | null>(null);

    useEffect(() => {
        async function loadConsulta() {
            try {
                setLoading(true);
                setError(null);

                if (consultaId) {
                    // Se tiver ID, buscar consulta específica
                    const data = await consultationService.getConsultationById(Number(consultaId));
                    setConsulta(data);
                    if (data.zoom_join_url) {
                        setZoomUrl(data.zoom_join_url);
                    } else {
                        setError("Reunião Zoom ainda não foi criada para esta consulta.");
                    }
                } else {
                    // Se não tiver ID, buscar consultas ativas do médico
                    const consultas = await consultationService.getConsultations();
                    // Buscar consulta em atendimento ou aguardando médico
                    const consultaAtiva = consultas.find(
                        c => c.status === "em_atendimento" || 
                             c.status === "aguardando_medico" ||
                             (c.medico?.id && c.zoom_join_url)
                    );
                    
                    if (consultaAtiva) {
                        setConsulta(consultaAtiva);
                        if (consultaAtiva.zoom_join_url) {
                            setZoomUrl(consultaAtiva.zoom_join_url);
                        } else {
                            setError("Reunião Zoom ainda não foi criada para esta consulta.");
                        }
                    } else {
                        setError("Nenhuma consulta ativa encontrada. Aguarde o enfermeiro encaminhar um paciente.");
                    }
                }
            } catch (err: any) {
                console.error("Erro ao carregar consulta:", err);
                setError(err.message || "Erro ao carregar informações da consulta.");
            } finally {
                setLoading(false);
            }
        }

        loadConsulta();
    }, [consultaId]);

    const cards = [
        {
            titulo: "Receituário",
            texto: consulta?.paciente 
                ? `O paciente ${consulta.paciente.nome} está aguardando para entrar na consulta.`
                : "Aguardando informações do paciente.",
            onClick: () => setShowReceituario(true),
        },
        {
            titulo: "Encaminhamentos",
            texto: consulta?.paciente
                ? `Acesse o prontuário completo do paciente ${consulta.paciente.nome} e últimos exames.`
                : "Acesse o prontuário completo do paciente e últimos exames.",
            onClick: () => setShowEncaminhamento(true),
        },
        {
            titulo: "Prescrição Atual",
            texto: "Confira os medicamentos e tratamentos em andamento.",
            link: consulta?.paciente?.id ? `/medico/prontuario/${consulta.paciente.id}` : "#",
        },
        {
            titulo: "Encerrar Consulta",
            texto: "Finalize o atendimento e registre observações no prontuário.",
            link: "#",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#10C4B5] animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando sala de consulta...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao Carregar Consulta</h2>
                <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-[#10C4B5] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0ea896] transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col mt-3 px-4">
            <div className="tile">
                <h4>
                    Nome do Paciente: <strong>{consulta?.paciente?.nome || "Carregando..."}</strong>
                </h4>
                {consulta && (
                    <p className="text-sm text-gray-600 mt-1">
                        Status: <span className="font-medium">{consulta.status}</span>
                        {consulta.enfermeira && (
                            <> | Triagem realizada por: {consulta.enfermeira.nome}</>
                        )}
                    </p>
                )}
            </div>
            <div className="flex gap-4 p-2">
                <div className="w-2/3">
                    {zoomUrl ? (
                        <div className="w-full h-[75vh] rounded-xl shadow-lg border border-gray-300 bg-white flex flex-col">
                            <div className="p-4 border-b border-gray-200 bg-[#10C4B5] text-white rounded-t-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg">Sala de Consulta - Zoom</h3>
                                        <p className="text-sm opacity-90">
                                            {consulta?.paciente?.nome ? `Paciente: ${consulta.paciente.nome}` : "Aguardando paciente"}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={zoomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-white text-[#10C4B5] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open(zoomUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Entrar na Videochamada (Nova Aba)
                                </a>
                            </div>
                            <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-24 h-24 bg-[#10C4B5] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Videochamada Pronta</h4>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Clique no botão acima para abrir a videochamada Zoom em uma nova aba.
                                        O Zoom funciona melhor quando aberto diretamente no navegador.
                                    </p>
                                    <button
                                        onClick={() => window.open(zoomUrl, '_blank', 'noopener,noreferrer')}
                                        className="bg-[#10C4B5] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#0ea896] transition-colors shadow-lg"
                                    >
                                        Abrir Videochamada Agora
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                <p className="text-xs text-gray-600 text-center">
                                    💡 <strong>Nota:</strong> O Zoom requer que seja aberto em uma nova aba devido a políticas de segurança do navegador.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-[75vh] rounded-xl shadow-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2 font-semibold">Link da reunião não disponível</p>
                                <p className="text-sm text-gray-500">
                                    A reunião Zoom será criada quando o enfermeiro iniciar o atendimento
                                </p>
                            </div>
                        </div>
                    )}
                </div>


                <div className="w-1/3 flex flex-col gap-4">
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 flex-1"
                        >
                            <div className="p-3">
                                <h5 className="text-lg font-bold text-gray-900 mb-2">
                                    {card.titulo}
                                </h5>
                                <p className="text-gray-600 text-sm mb-3">{card.texto}</p>

                                {card.onClick ? (
                                    <button
                                        onClick={card.onClick}
                                        className="inline-block bg-[#0f9e8a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0d7a73] transition duration-150"
                                    >
                                        Acessar
                                    </button>
                                ) : (
                                    <a
                                        href={card.link}
                                        className="inline-block bg-[#0f9e8a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0d7a73] transition duration-150"
                                    >
                                        Acessar
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full container-fluid mt-3.5 flex flex-col gap-2.5">
                <label className="font-semibold mb-0">Descrição da Consulta</label>
                <textarea name="descricao" id="" className="border border-gray-300 rounded-lg p-2.5 w-full resize-none text-sm" rows={8} placeholder="Descreva como foi a consulta"></textarea>
                <button type="submit" className="rounded-lg bg-[#0f9e8a] text-white px-4 py-2 my-3 w-max"> Salvar </button>
            </div>

            {/* ---- Modal Receituário ---- */}
            {showReceituario && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-[450px]">
                        <h3 className="text-lg font-bold mb-4">Receituário</h3>
                        <p>conteúdo do receituário aqui...</p>

                        <button
                            onClick={() => setShowReceituario(false)}
                            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
                        >Fechar</button>
                    </div>
                </div>
            )}

            {/* ---- Modal Encaminhamento ---- */}
            {showEncaminhamento && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-[450px]">
                        <h3 className="text-lg font-bold mb-4">Encaminhamentos</h3>
                        <p>conteúdo do encaminhamento aqui...</p>

                        <button
                            onClick={() => setShowEncaminhamento(false)}
                            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
                        >Fechar</button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default function Sala() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#10C4B5] animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        }>
            <ConsultorioContent />
        </Suspense>
    );
}