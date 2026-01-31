"use client";
import { useState, useEffect, FormEvent } from "react";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface Paciente {
    prontuario: string;
    nome: string;
    data_nascimento: string;
    email: string | null;
    cpf: string | null;
    endereco: string | null;
}

export default function ProntuarioPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    async function fetchPacientes(search = "", pageNum = 1) {
        setLoading(true);
        setPacientes([]); 
        setError("");

        try {
            const res = await fetch(`/api/prontuario?search=${search}&page=${pageNum}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao buscar pacientes.");
            } else if (!data.results || data.results.length === 0) {
                setError("Nenhum paciente encontrado.");
                setTotal(0);
                setTotalPages(1);
            } else {
                setPacientes(data.results);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch (err) {
            console.error(err);
            setError("Erro ao conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPacientes("", page);
    }, [page]);

    async function handleSearch(e: FormEvent) {
        e.preventDefault();
        setPage(1);
        fetchPacientes(query, 1);
    }

    return (
        <div className="flex flex-col mt-3 px-4">
            <div className="my-4 text-left">
                <h2 className="text-lg font-semibold">Prontuário de Paciente</h2>
            </div>
            <div className="flex flex-col border rounded-2xl shadow-lg overflow-hidden w-full p-6">
                <form onSubmit={handleSearch} className="mb-6 w-full flex justify-center">
                    <div className="relative w-2/3">
                        <input
                            type="text"
                            placeholder="Buscar por nome do paciente ou CPF..."
                            className="text-sm text-black border rounded-full px-4 py-2.5 w-full pr-10"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute inset-y-0 bottom-.5 right-2 flex items-center pr-3 text-gray-600 hover:text-gray-800"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </form>
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 border-collapse">
                        <thead className="text-black text-center text-sm bg-gray-100">
                            <tr>
                                <th className="p-3 border border-gray-300 font-semibold">N° Prontuário</th>
                                <th className="p-3 border border-gray-300 font-semibold">Nome</th>
                                <th className="p-3 border border-gray-300 font-semibold">Nascimento</th>
                                <th className="p-3 border border-gray-300 font-semibold">CPF</th>
                                <th className="p-3 border border-gray-300 font-semibold">Email</th>
                                <th className="p-3 border border-gray-300 font-semibold">Cidade</th>
                                <th className="p-3 border border-gray-300 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-4 bg-gray-200 text-gray-700 text-center font-medium">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={7} className="p-4 bg-red-500 text-white text-center font-normal text-sm tracking-[.3px]">
                                        {error}
                                    </td>
                                </tr>
                            ) : (
                                pacientes.map((p) => (
                                    <tr key={p.prontuario} className="group hover:bg-gray-50 transition">
                                        <td className="p-3 text-sm border border-gray-300">{p.prontuario}</td>
                                        <td className="p-3 text-sm border border-gray-300">{p.nome}</td>
                                        <td className="p-3 text-sm border border-gray-300">
                                            {new Date(p.data_nascimento).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="p-3 text-sm border border-gray-300">
                                            {p.cpf ? p.cpf.replace(/\D/g, "").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : "—"}
                                        </td>
                                        <td className="p-3 text-sm border border-gray-300">{p.email || "—"}</td>
                                        <td className="p-3 text-sm border border-gray-300">
                                            {p.endereco ? (p.endereco.includes('-') ? p.endereco.split('-')[1].trim() : p.endereco) : "—"}
                                        </td>
                                        <td className="p-0 text-sm border border-gray-300 text-center">
                                            {p.prontuario ? (
                                                <a
                                                    href={`/medico/prontuario/${p.prontuario}`}
                                                    rel="noopener noreferrer"
                                                    title="Ver Prontuário"
                                                    className="inline-flex justify-center items-center w-full text-black hover:text-[#10C4B5] transition-colors"
                                                >
                                                    <FileText className="w-4.5 h-4.5" />
                                                </a>
                                            ) : (
                                                <span className="text-gray-400" title="Prontuário não disponível">
                                                    <FileText className="w-4.5 h-4.5" />
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-gray-600">
                        Mostrando {pacientes.length} de {total} pacientes
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="cursor-pointer p-2 border rounded-full hover:bg-gray-300 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs">
                            Página {page} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="cursor-pointer p-2 border rounded-full hover:bg-gray-300 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
