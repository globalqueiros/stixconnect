"use client"
import { useState } from "react";

export default function Sala() {

    const [showReceituario, setShowReceituario] = useState(false);
    const [showEncaminhamento, setShowEncaminhamento] = useState(false);

    const cards = [
        {
            titulo: "Receituário",
            texto: "O paciente João Silva está aguardando para entrar na consulta.",
            onClick: () => setShowReceituario(true),
        },
        {
            titulo: "Encaminhamentos",
            texto: "Acesse o prontuário completo do paciente e últimos exames.",
            onClick: () => setShowEncaminhamento(true),
        },
        {
            titulo: "Prescrição Atual",
            texto: "Confira os medicamentos e tratamentos em andamento.",
            link: "#",
        },
        {
            titulo: "Encerrar Consulta",
            texto: "Finalize o atendimento e registre observações no prontuário.",
            link: "#",
        },
    ];

    return (
        <div className="flex flex-col mt-3 px-4">
            <div className="tile">
                <h4>Nome do Paciente: <strong></strong></h4>
            </div>
            <div className="flex gap-4 p-2">
                <div className="w-2/3">
                    <iframe
                        src="https://web.zoom.us/wc/join/123456789"
                        title="Sala de Consulta Zoom"
                        className="w-full h-[75vh] rounded-xl shadow-lg border-0"
                    />
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