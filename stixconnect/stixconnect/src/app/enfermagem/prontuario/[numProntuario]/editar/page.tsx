"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

interface Paciente {
    numProntuario: string;
    dtCriacao: string;
    nomePlano: string;
    nome: string;
    dataNascimento: string;
    cpf: string;
    wappNumber: string;
    email: string;
    estadocivil: string;
    genero: string;
    cep: string;
    endereco: string;
    bairro: string;
    complemento: string;
    cidade: string;
    estado: string;

    clinicoHistorico: string;
    clinicoAlergias: string;
    clinicoMedicacoes: string;
    clinicoCondicoes: string;
    clinicoHabitos: string;
    clinicoSaudeMental: string;
    clinicoVacinacao: string;
    clinicoObservacoes: string;
}

interface Consulta {
    idConsulta: number;
    idPaciente: number;
    data_consulta: string;
    hora_consulta: string;
    status: string;
}



export default function EditarPaciente() {
    const params = useParams();
    const numProntuario = params.numProntuario as string;
    const router = useRouter();
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cancel, setCancel] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [consultas, setConsultas] = useState<Consulta[]>([]);
    const [diasComConsulta, setDiasComConsulta] = useState<number[]>([]);

    const month = currentDate.format("MMMM");
    const year = currentDate.format("YYYY");

    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = dayjs(`${year}-${currentDate.month() + 1}-01`).day();

    const changeMonth = (direction: "prev" | "next") => {
        setCurrentDate(
            direction === "prev"
                ? currentDate.subtract(1, "month")
                : currentDate.add(1, "month")
        );
        setSelectedDay(null);
    };

    useEffect(() => {
        if (!numProntuario) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`../../api/prontuario/${numProntuario}`);
                const data = await res.json();
                setPaciente(data);
            } catch (err) {
                console.error("Erro ao carregar dados", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [numProntuario]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;

        setSaving(true);

        try {
            const res = await fetch(`/enfermagem/api/prontuario/${numProntuario}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paciente),
            });

            setSaving(false);

            if (res.ok) {
                setMessage("Registro atualizado com sucesso!");
                setTimeout(() => {
                    router.push("/enfermagem/api/prontuario");
                }, 2000);
            } else {
                setMessage("Erro ao salvar alterações.");
            }
        } catch (err) {
            setSaving(false);
            setMessage("Erro ao salvar alterações.");
            console.error("Erro ao salvar dados", err);
        }
    };

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!paciente) return;

        const cep = e.target.value
            .replace(/\D/g, "")
            .replace(/(\d{5})(\d{3})/, "$1-$2");
        setPaciente({ ...paciente, cep });

        if (cep.length === 9) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep.replace("-", "")}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setPaciente(prev => prev && ({
                        ...prev,
                        endereco: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    const maskCPF = (value: string | undefined | null) => {
        if (!value) return "";

        return value
            .toString()
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const handleCancel = () => {
        setCancel(true);
        setTimeout(() => {
            router.push("/enfermagem/prontuario");
        }, 1000);
    };

    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/^55/, "");

        value = value.slice(0, 11);
        if (value.length >= 2) value = value.replace(/^(\d{2})(\d)/, "($1) $2");
        if (value.length >= 9) value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");

        setPaciente(prev => ({ ...(prev as Paciente), wappNumber: value }));
    };

    if (loading)
        return (
            <div className="flex justify-center items-center mt-[38vh]">
                <div className="max-w-md text-center border bg-gray-100 px-6 py-4 rounded-md shadow flex items-center gap-3">
                    <span className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    Carregando...
                </div>
            </div>
        );

    if (!paciente)
        return (
            <div className="mt-10 mx-auto max-w-md text-center border border-red-400 bg-red-100 text-red-700 px-4 py-4 rounded-md shadow">
                ❗ Paciente não encontrado.
            </div>
        );
    return (
        <div className="container-fluid">
            <div className="mb-3 mt-4 mx-4 flex justify-between pb-2">
                <h4 className="font-semibold text-base">
                    N° Prontuário: <span>{paciente.numProntuario} - {paciente.nome}</span>
                </h4>
                <h4 className="font-semibold text-base">
                    Plano Adquirido: <span>({paciente.nomePlano} ({new Date(paciente.dtCriacao).toLocaleDateString("pt-BR")}))</span>
                </h4>
            </div>

            {message && (
                <div className={`mt-2 mb-3 mx-auto w-full text-center border px-4 py-4 rounded-md shadow ${message.includes("sucesso") ? "bg-green-100 text-green-700 border-green-400" : "bg-red-100 text-red-700 border-red-400"}`}>
                    <strong>{message}</strong>
                </div>
            )}
            <form onSubmit={handleSave} className="container-fluid space-y-4 mt-3">
                <h5 className="font-bold text-lg">🙍🏻‍♂️ Dados Pessoais</h5>
                <div className="flex gap-3 w-full">
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>Nome Completo</label>
                        <input type="text" readOnly className="text-sm w-full border p-2 border-black rounded-xl" value={paciente.nome} placeholder="Humberto Santos Dias Nascimento" />
                    </div>
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>Data de Nascimento</label>
                        <input type="date" readOnly className="text-sm w-full border p-2 border-black rounded-xl" value={paciente.dataNascimento?.split("T")[0]} placeholder="00/00/0000" />
                    </div>
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>CPF</label>
                        <input type="text" readOnly className="text-sm w-full border p-2 border-black rounded-xl" value={maskCPF(paciente.cpf)} placeholder="000.000.000-00" />
                    </div>
                </div>
                <div className="flex gap-3 w-full">
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>Gênero</label>
                        <input
                            type="text"
                            className="text-sm w-full border p-2 border-black rounded-xl"
                            value={paciente.genero ?? ""}
                            onChange={(e) => setPaciente({ ...paciente, genero: e.target.value })}
                            placeholder="Genero"
                        />
                    </div>
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>Estado Civil</label>
                        <input
                            type="text"
                            className="text-sm w-full border p-2 border-black rounded-xl"
                            value={paciente.estadocivil ?? ""}
                            onChange={(e) => setPaciente({ ...paciente, estadocivil: e.target.value })}
                            placeholder="Estado Civil"
                        />
                    </div>
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>Whatsapp</label>
                        <input
                            type="text"
                            className="text-sm w-full border p-2 border-black rounded-xl"
                            placeholder="(00) 00000-0000"
                            value={paciente.wappNumber}
                            onChange={handleWhatsappChange}
                            maxLength={15}
                        />
                    </div>
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>Email</label>
                        <input
                            type="email"
                            className="text-sm w-full border p-2 border-black rounded-xl"
                            value={paciente.email}
                            onChange={(e) => setPaciente({ ...paciente, email: e.target.value })}
                            placeholder="melhoremail@email.com"
                        />
                    </div>
                </div>
                <h5 className="font-bold text-lg mt-4 mb-2">📍 Endereço Residencial</h5>
                <div className="flex gap-3 w-full">
                    <div className="flex flex-col flex-[2] min-w-0">
                        <label>CEP</label>
                        <input
                            maxLength={9}
                            placeholder="00000-000"
                            className="border p-2 border-black rounded-xl w-full text-sm"
                            value={paciente.cep}
                            onChange={handleCepChange}
                        />
                    </div>
                    <div className="flex flex-col flex-[5] min-w-0">
                        <label>Endereço</label>
                        <input
                            className="border p-2 border-black rounded-xl w-full text-sm"
                            value={paciente.endereco}
                            onChange={(e) => setPaciente({ ...paciente, endereco: e.target.value })}
                            placeholder="Alameda Rio Negro"
                        />
                    </div>
                    <div className="flex flex-col flex-[3] min-w-0">
                        <label>Complemento</label>
                        <input
                            className="border p-2 border-black rounded-xl w-full text-sm"
                            value={paciente.complemento}
                            onChange={(e) => setPaciente({ ...paciente, complemento: e.target.value })}
                            placeholder="N°1030, Cond Stadium Escrit 206"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                        <label>Bairro</label>
                        <input
                            className="border p-2 border-black rounded-xl text-sm"
                            value={paciente.bairro}
                            onChange={(e) => setPaciente({ ...paciente, bairro: e.target.value })}
                            placeholder="Alphaville Centro Industrial e Empresarial/Alphav"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label>Cidade</label>
                        <input
                            className="border p-2 border-black rounded-xl text-sm"
                            value={paciente.cidade}
                            onChange={(e) => setPaciente({ ...paciente, cidade: e.target.value })}
                            placeholder="Barueri"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label>Estado</label>
                        <input
                            maxLength={2}
                            className="border p-2 border-black rounded-xl text-sm"
                            value={paciente.estado}
                            onChange={(e) => setPaciente({ ...paciente, estado: e.target.value.toUpperCase() })}
                            placeholder="SP"
                        />
                    </div>
                </div>
                <h5 className="font-bold text-lg mt-4 mb-2">🩺 Histórico Clínico</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                        <label>🩺 Histórico Clínico?</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoHistorico}
                            onChange={(e) => setPaciente({ ...paciente, clinicoHistorico: e.target.value })}
                            placeholder="Informe doenças pré-existentes, cirurgias realizadas, problemas cardíacos ou respiratórios e histórico familiar de doenças."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>⚠️ Possui alguma alergia?</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoAlergias}
                            onChange={(e) => setPaciente({ ...paciente, clinicoAlergias: e.target.value })}
                            placeholder="Informe o tipo de alergia e a reação apresentada."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>💊 Medicações em uso?</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoMedicacoes}
                            onChange={(e) => setPaciente({ ...paciente, clinicoMedicacoes: e.target.value })}
                            placeholder="Informe o nome do medicamento, sua dosagem e a frequência de uso."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>❤️ Hábitos e estilo de vida</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoHabitos}
                            onChange={(e) => setPaciente({ ...paciente, clinicoHabitos: e.target.value })}
                            placeholder="Informe hábitos como tabagismo, consumo de álcool, prática de atividade física e alimentação restritiva."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>🧩 Condições Especiais / Necessidades</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoCondicoes}
                            onChange={(e) => setPaciente({ ...paciente, clinicoCondicoes: e.target.value })}
                            placeholder="Informe se possui marcapasso, prótese, dificuldade de locomoção ou deficiência visual/auditiva."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>🧠 Saúde mental</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoSaudeMental}
                            onChange={(e) => setPaciente({ ...paciente, clinicoSaudeMental: e.target.value })}
                            placeholder="Informe informações relacionadas à saúde mental."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>🩹 Vacinação</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoVacinacao}
                            onChange={(e) => setPaciente({ ...paciente, clinicoVacinacao: e.target.value })}
                            placeholder="Informe as vacinas já tomadas, como Covid-19, Influenza, Hepatite B e Tétano."
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label>🧾 Observações médicas / evoluções</label>
                        <textarea
                            className="text-xs border border-black p-2 rounded-xl resize-none leading-5"
                            rows={5}
                            value={paciente.clinicoObservacoes}
                            onChange={(e) => setPaciente({ ...paciente, clinicoObservacoes: e.target.value })}
                            placeholder="Um campo livre para anotações do profissional."
                        ></textarea>
                    </div>
                </div>
                <div className="my-4">
                    <button
                        disabled={saving}
                        className={`rounded-full px-4 py-2.5 mr-3 text-white font-semibold text-sm transition 
                            ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#25a096] hover:bg-[#1e827a]"}`}
                    >
                        {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                    <button
                        disabled={cancel}
                        onClick={handleCancel}
                        className={`rounded-full px-4 py-2.5 text-white font-semibold text-sm transition 
                            ${cancel ? "bg-gray-400 cursor-not-allowed" : "bg-[#f44336] hover:bg-[#e53935]"}`}
                    >
                        {cancel ? "Cancelando..." : "Cancelar"}
                    </button>
                </div>
            </form>
            <div className="flex my-6 gap-6 container-fluid">
                <div className="w-1/2">
                    <h5 className="font-bold text-lg">➕ Serviços Avulsos</h5>
                    <div className="bg-red-100 border border-red-400 my-3 px-4 py-3 text-center rounded relative" role="alert">
                        <span className="block sm:inline text-red-800">Nenhum serviço foi contratado pelo paciente ainda.</span>
                    </div>
                    <h5 className="font-bold text-lg mb-3">🩺 Histórico Clínico</h5>
                    <p className="text-gray-600">Aqui você pode exibir histórico, evoluções ou consultas anteriores caso queira futuramente.</p>
                </div>
                <div className="w-1/2 border border-gray-300 rounded-xl p-4 shadow">
                    <h5 className="font-bold text-lg mb-3">🗓️ Calendário</h5>
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => changeMonth("prev")}
                            type="button"
                            className="px-3 py-1 rounded hover:bg-gray-200"
                        >
                            ◀
                        </button>

                        <h2 className="text-lg font-bold capitalize">
                            {month}, {year}
                        </h2>
                        <button
                            onClick={() => changeMonth("next")}
                            type="button"
                            className="px-3 py-1 rounded hover:bg-gray-200"
                        >
                            ▶
                        </button>
                    </div>
                    <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-2">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 text-center gap-1">
                        {[...Array(firstDayOfMonth)].map((_, i) => (
                            <div key={i}></div>
                        ))}

                        {[...Array(daysInMonth)].map((_, i) => {
                            const day = i + 1;
                            const isSelected = day === selectedDay;

                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`cursor-pointer rounded-full p-2 text-sm
                        ${isSelected ? "bg-teal-600 text-white font-bold" : "hover:bg-gray-200"}`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}