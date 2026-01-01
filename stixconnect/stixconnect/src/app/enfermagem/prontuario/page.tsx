"use client";
import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Paciente {
  cidade: string;
  numProntuario: string;
  nome: string;
  data_nascimento: string;
  email: string;
  cpf: string;
}

export default function Prontuario() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const limit = 5;
  const router = useRouter();

  const fetchPacientes = async (q = "", p = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`./api/prontuario?search=${q}&page=${p}`);
      const result = await res.json();

      setPacientes(result.results || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes(query, page);
  }, [page]);

  useEffect(() => {
    const msg = localStorage.getItem("successMessage");
    if (msg) {
      setMessage(msg);
      localStorage.removeItem("successMessage");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPacientes(query, 1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container-fluid">
      <div className="mb-1 mt-4 ml-4 flex justify-between items-center">
        <h4 className="font-semibold text-base">Prontuário Online</h4>

        <button
          onClick={() => router.push("/enfermagem/prontuario/novo_prontuario")}
          className="rounded-full px-4 py-2.5 mr-3 text-white font-semibold text-sm transition bg-[#25a096]"
        >
          Abrir Prontuário
        </button>
      </div>

      {message && (
        <div
          className={`mt-2 mb-3 mx-auto w-full text-center border px-4 py-4 rounded-md shadow
          ${message.includes("sucesso")
              ? "bg-green-100 text-green-700 border-green-400"
              : "bg-red-100 text-red-700 border-red-400"
            }`}
        >
          <strong className="text-green-800">{message}</strong>
        </div>
      )}
      <form onSubmit={handleSearch} className="mb-6 w-full">
        <div className="relative w-2/6 m-auto">
          <input
            type="text"
            placeholder="Pesquise por prontuário médico, nome ou CPF..."
            className="text-sm text-black border rounded-full px-4 py-2 w-full pr-10"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
              fetchPacientes(e.target.value, 1);
            }}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-black text-xs uppercase">
            <tr className="text-center">
              <th className="p-3 border">N° Prontuário</th>
              <th className="p-3 border">Nome</th>
              <th className="p-3 border">Nascimento</th>
              <th className="p-3 border">CPF</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Cidade</th>
              <th className="p-3 border">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">Carregando...</td>
              </tr>
            ) : pacientes.length > 0 ? (
              pacientes.map((p, index) => (
                <tr key={`${p.numProntuario}-${index}`} className="hover:bg-[#10C4B51A]">
                  <td className="p-3 border text-center">{p.numProntuario}</td>
                  <td className="p-3 border capitalize">{p.nome}</td>
                  <td className="p-3 border text-center">
                    {new Date(p.data_nascimento).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3 border text-center">{p.cpf || "—"}</td>
                  <td className="p-3 border">{p.email || "—"}</td>
                  <td className="p-3 border capitalize">{p.cidade || "—"}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() =>
                        router.push(`/enfermagem/prontuario/${p.numProntuario}/editar`)
                      }
                      className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 bg-red-600 text-white text-center">
                  Nenhum paciente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center my-4">
        <p className="text-xs text-gray-600">
          Mostrando {pacientes.length} de {total} pacientes
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium">
            Página {page} de {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}