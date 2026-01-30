"use client"
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/page';
import { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFileLines } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Usuario {
    id: number;
    nome: string;
    email: string;
    nascimento: string;
    status: number;
}

export default function Status() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [time, setTime] = useState<string>(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loadingAtendimentos, setLoadingAtendimentos] = useState(true);
    const [pagina, setPagina] = useState(1);
    const itensPorPagina = 8;
    const router = useRouter();
    

    useEffect(() => {
        fetch("/api/usuarios")
            .then((res) => res.json())
            .then((data) => {
                setUsuarios(data);
                setLoadingAtendimentos(false);
            })
            .catch((err) => {
                console.error("Erro ao buscar usuários:", err);
                setLoadingAtendimentos(false);
            });
    }, []);

    const statusMap: { [key: number]: { text: string, color: string } } = {
        0: { text: "Aguardando Aprovação", color: "text-yellow-500" },
        1: { text: "Aguardando Pagamento", color: "text-yellow-500" },
        2: { text: "Pendente", color: "text-orange-500" },
        3: { text: "Aprovado", color: "text-green-500" },
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Token ausente. Redirecionando...');
            router.push('/');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch('/api/protected', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                console.log('API Response:', data);

                if (!res.ok || !data.user?.name) {
                    console.error('Erro na API:', data.error);
                    return router.push('/');
                }

                setUser(data.user);
            } catch (error) {
                console.error('Erro ao buscar usuário:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        const updateTime = () => {
            setTime(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
        };

        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const handleAnterior = () => {
        if (pagina > 1) setPagina(pagina - 1);
    };

    const handleProximo = () => {
        if (pagina * itensPorPagina < usuarios.length) setPagina(pagina + 1);
    };

    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const usuariosPaginados = usuarios.slice(inicio, fim);

    const filteredUsuarios = usuarios.filter(usuario => usuario.status === 0 || usuario.status === 2);
    const cadastroCount = filteredUsuarios.length;

    return (
        <div className="flex h-screen">
            <Sidebar children={undefined} />
            <div className="flex flex-col flex-grow p-2.5">
                <h2 className="text-xl font-bold mb-3 mt-3">Meus Cadastros</h2>
                <div className="w-full overflow-x-auto">
                    <div className="relative flex-grow shadow-md sm:rounded-lg">
                        <table className="w-full min-w-max text-sm text-left text-blue-100 table-secondary">
                            <caption className="text-xs mt-1">
                                Total de Cadastros Pendentes: {cadastroCount}
                            </caption>
                            <thead className="text-xs sm:text-[10px] text-white uppercase bg-[#25A096]">
                                <tr>
                                    <th className="px-6 py-3 sm:px-3 sm:py-2 text-center">Nome Completo</th>
                                    <th className="px-6 py-3 sm:px-3 sm:py-2 text-center">Email</th>
                                    <th className="px-6 py-3 sm:px-3 sm:py-2 text-center">Nascimento</th>
                                    <th className="px-6 py-3 sm:px-3 sm:py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingAtendimentos ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-black py-4">Carregando...</td>
                                    </tr>
                                ) : usuariosPaginados.length > 0 ? (
                                    usuariosPaginados.map((usuario) => (
                                        <tr key={usuario.id} className="border-b border-gray-700 text-black bg-gray-100">
                                            <td className="px-6 py-3 sm:px-3 sm:py-2 text-center whitespace-nowrap">
                                                {usuario.nome}
                                            </td>
                                            <td className="px-6 py-3 sm:px-3 sm:py-2 text-center whitespace-nowrap">
                                                {usuario.email}
                                            </td>
                                            <td className="px-6 py-3 sm:px-3 sm:py-2 text-center whitespace-nowrap">
                                                {new Date(usuario.nascimento).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-3 sm:px-3 sm:py-2 text-center whitespace-nowrap">
                                                {usuario.status === 1 ? (
                                                    <span className="ml-2 text-[#25a096]">
                                                        <Link href={`/cadastro-paciente/${usuario.id}`} className="text-[#25a096]">
                                                            <FontAwesomeIcon icon={faFileLines} /> Preencher o cadastro
                                                        </Link>
                                                    </span>
                                                ) : (
                                                    <span className={statusMap[usuario.status]?.color}>
                                                        {statusMap[usuario.status]?.text || "Desconhecido"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center text-black py-4">
                                            Nenhum cadastro encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex justify-between p-4">
                            <button onClick={handleAnterior} disabled={pagina === 1} className="px-3 py-2 bg-gray-300 rounded-full"><FontAwesomeIcon icon={faArrowLeft} /></button>
                            <span className="bg-gray-300 text-black p-3 w-10 h-10 flex items-center justify-center rounded-full">
                                {pagina}
                            </span>
                            <button onClick={handleProximo} disabled={pagina * itensPorPagina >= usuarios.length} className="px-3 py-2 bg-gray-300 rounded-full"><FontAwesomeIcon icon={faArrowRight} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}