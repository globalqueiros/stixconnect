"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditarPaciente() {
  const router = useRouter();

  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [planos, setPlanos] = useState<any[]>([]);
  const [prontuario, setProntuario] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "saving" | "idle">("idle");
  const [cancel, setCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [paciente, setPaciente] = useState<any>({
    plano: "",
    nome: "",
    data_nascimento: "",
    cpf: "",
    genero: "",
    estado_civil: "",
    whatsapp: "",
    email: "",
    cep: "",
    endereco: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    historico_clinico: "",
    alergias: "",
    medicacoes: "",
    habitos: "",
    condicoes_especiais: "",
    saude_mental: "",
    vacinacao: "",
    observacoes: "",
  });

  useEffect(() => {
    async function carregarPlanos() {
      try {
        setLoadingPlanos(true);
        const resp = await fetch("/api/planos");
        const data = await resp.json();
        setPlanos(data);
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
      } finally {
        setLoadingPlanos(false);
      }
    }
    carregarPlanos();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("prontuario_num");
    const savedTime = localStorage.getItem("prontuario_time");
    const now = Date.now();
    const limite = 5400 * 1000;

    if (saved && savedTime && now - parseInt(savedTime) < limite) {
      setProntuario(saved);
    } else {
      const novo = String(Math.floor(Math.random() * 999999999));
      localStorage.setItem("prontuario_num", novo);
      localStorage.setItem("prontuario_time", String(now));
      setProntuario(novo);
    }
  }, []);

  const formatCPF = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    const cpfMasked = onlyNumbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return cpfMasked;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cpf = formatCPF(e.target.value);
    setPaciente((prev: any) => ({ ...prev, cpf }));
  };

  const formatWhatsapp = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    const masked = onlyNumbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
    return masked;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const whatsapp = formatWhatsapp(e.target.value);
    setPaciente((prev: any) => ({ ...prev, whatsapp }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
    setPaciente((prev: any) => ({ ...prev, cep }));

    if (cep.length === 9) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep.replace("-", "")}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setPaciente((prev: any) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaciente((prev: any) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let validationErrors: any = {};
    Object.keys(paciente).forEach((key) => {
      if (paciente[key] === "") {
        validationErrors[key] = "Este campo é obrigatório";
      }
    });

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatus("saving");

    if (!validateForm()) {
      setTimeout(() => {
        setStatus("idle");
      }, 5000);

      return;
    }

    try {
      // Usar serviço de pacientes do backend
      const { patientService } = await import('@/app/services/patient.service');
      
      // Transformar dados para formato do backend
      const patientData = {
        num_prontuario: prontuario,
        nome: paciente.nome,
        data_nascimento: new Date(paciente.data_nascimento),
        cpf: paciente.cpf,
        telefone: paciente.whatsapp,
        email: paciente.email,
        // Campos adicionais podem ser adicionados conforme necessário
      };

      await patientService.createPatient(patientData);
      
      localStorage.setItem(
        "successMessage",
        "Prontuário aberto com sucesso!"
      );
      router.push("/enfermagem/prontuario");
    } catch (err: any) {
      console.error(err);
      
      // Tentar fallback para API route legada
      try {
        const resp = await fetch("/api/pacientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...paciente, prontuario }),
        });

        if (resp.ok) {
          localStorage.setItem(
            "successMessage",
            "Prontuário aberto com sucesso!"
          );
          router.push("/enfermagem/prontuario");
        } else {
          const data = await resp.json();
          alert(data.error || "Erro ao salvar paciente");
          setTimeout(() => {
            setStatus("idle");
          }, 2000);
        }
      } catch (fallbackErr) {
        alert(err.detail || err.message || "Erro ao salvar paciente");
        setTimeout(() => {
          setStatus("idle");
        }, 2000);
      }
    }
  };


  const handleCancel = () => {
    if (window.confirm("Você tem certeza que deseja cancelar? Todos os dados não salvos serão perdidos.")) {
      setCancel(true);
      setTimeout(() => router.push("/enfermagem/prontuario"), 1000);
    }
  };

  return (
    <div className="container-fluid">
      {message && (
        <div
          className={`mt-2 mb-3 mx-auto w-full text-center border px-4 py-4 rounded-md shadow ${message.includes("sucesso")
            ? "bg-green-100 text-green-700 border-green-400"
            : "bg-red-100 text-red-700 border-red-400"
            }`}
        >
          <strong className="text-red-500">{message}</strong>
        </div>
      )}
      <div className="mb-3 mt-4 mx-4 flex justify-between pb-2">
        <h4 className="font-semibold text-base">N° Prontuário: <span>{prontuario}</span></h4>
      </div>
      <form className="container-fluid space-y-4 mt-3" onSubmit={handleSubmit}>
        <h5 className="font-bold text-lg">💼 Planos Disponíveis</h5>
        <div className="flex flex-col w-1/5">
          <label>Plano da Stixmed</label>
          <select
            name="plano"
            className={`text-sm w-full border p-2 border-black rounded-xl cursor-pointer ${errors.plano ? 'border-red-500' : ''}`}
            value={paciente.plano}
            onChange={handleChange}
          >
            {loadingPlanos ? (
              <option>Carregando planos...</option>
            ) : (
              <>
                <option value="" disabled>Selecione o plano</option>
                {planos.map((p) => (
                  <option key={p.nome} value={p.nome}>{p.nome}</option>
                ))}
              </>
            )}
          </select>
          {errors.plano && <small className="text-red-500">{errors.plano}</small>}
        </div>

        <h5 className="font-bold text-lg">🙍🏻‍♂️ Dados Pessoais</h5>
        <div className="flex gap-3 w-full">
          <div className="flex flex-col flex-[2] min-w-0">
            <label>Nome Completo</label>
            <input
              name="nome"
              type="text"
              className={`text-sm w-full border p-2 border-black rounded-xl ${errors.nome ? 'border-red-500' : ''}`}
              placeholder="Nome completo"
              value={paciente.nome}
              onChange={handleChange}
            />
            {errors.nome && <small className="text-red-500">{errors.nome}</small>}
          </div>
          <div className="flex flex-col flex-[2] min-w-0">
            <label>Data de Nascimento</label>
            <input
              name="data_nascimento"
              type="date"
              className={`text-sm w-full border p-2 border-black rounded-xl ${errors.data_nascimento ? 'border-red-500' : ''}`}
              value={paciente.data_nascimento}
              onChange={handleChange}
            />
            {errors.data_nascimento && <small className="text-red-500">{errors.data_nascimento}</small>}
          </div>
          <div className="flex flex-col flex-[2] min-w-0">
            <label>CPF</label>
            <input
              name="cpf"
              type="text"
              className={`text-sm w-full border p-2 border-black rounded-xl ${errors.cpf ? 'border-red-500' : ''}`}
              placeholder="000.000.000-00"
              value={paciente.cpf}
              onChange={handleCpfChange}
              maxLength={14}
            />
            {errors.cpf && <small className="text-red-500">{errors.cpf}</small>}
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <div className="flex flex-col flex-[2] min-w-0">
            <label>Gênero</label>
            <select
              name="genero"
              className="text-sm w-full border p-2 border-black rounded-xl cursor-pointer"
              value={paciente.genero}
              onChange={handleChange}
            >
              <option value="" disabled>Selecione o gênero</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Não-binário">Não-binário</option>
              <option value="Agênero">Agênero</option>
              <option value="Gênero fluido">Gênero fluido</option>
              <option value="Transgênero">Transgênero</option>
              <option value="Outro">Outro</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
            {errors.genero && <small className="text-red-500">{errors.genero}</small>}
          </div>

          <div className="flex flex-col flex-[2] min-w-0">
            <label>Estado Civil</label>
            <select
              name="estado_civil"
              className="text-sm w-full border p-2 border-black rounded-xl cursor-pointer"
              value={paciente.estadocivil}
              onChange={handleChange}
            >
              <option value="" disabled>Selecione o estado civil</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Separado(a)">Separado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="União Estável">União Estável</option>
            </select>
            {errors.estadocivil && <small className="text-red-500">{errors.estadocivil}</small>}
          </div>
          <div className="flex flex-col flex-[2] min-w-0">
            <label>Whatsapp</label>
            <input
              name="whatsapp"
              type="text"
              className="text-sm w-full border p-2 border-black rounded-xl"
              placeholder="(00) 00000-0000"
              value={paciente.whatsapp}
              onChange={handleWhatsappChange}
              maxLength={15}
            />
            {errors.whatsapp && <small className="text-red-500">{errors.whatsapp}</small>}
          </div>
          <div className="flex flex-col flex-[2] min-w-0">
            <label>Email</label>
            <input
              name="email"
              type="email"
              className="text-sm w-full border p-2 border-black rounded-xl"
              placeholder="melhoremail@email.com"
              value={paciente.email}
              onChange={handleChange}
            />
            {errors.nome && <small className="text-red-500">{errors.nome}</small>}
          </div>
        </div>

        <h5 className="font-bold text-lg mt-4 mb-2">📍 Endereço Residencial</h5>
        <div className="flex gap-3 w-full">
          <div className="flex flex-col flex-[2] min-w-0">
            <label>CEP</label>
            <input
              name="cep"
              maxLength={9}
              placeholder="00000-000"
              className="border p-2 border-black rounded-xl w-full text-sm"
              value={paciente.cep}
              onChange={handleCepChange}
            />
            {errors.cep && <small className="text-red-500">{errors.cep}</small>}
          </div>
          <div className="flex flex-col flex-[5] min-w-0">
            <label>Endereço</label>
            <input
              name="endereco"
              className="border p-2 border-black rounded-xl w-full text-sm"
              placeholder="Alameda Rio Negro"
              value={paciente.endereco}
              onChange={handleChange}
            />
            {errors.endereco && <small className="text-red-500">{errors.endereco}</small>}
          </div>
          <div className="flex flex-col flex-[3] min-w-0">
            <label>Complemento</label>
            <input
              name="complemento"
              className="border p-2 border-black rounded-xl w-full text-sm"
              placeholder="N°1030, Cond Stadium Escrit 206"
              value={paciente.complemento}
              onChange={handleChange}
            />
            {errors.complemento && <small className="text-red-500">{errors.complemento}</small>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label>Bairro</label>
            <input
              name="bairro"
              className="border p-2 border-black rounded-xl text-sm"
              placeholder="Alphaville"
              value={paciente.bairro}
              onChange={handleChange}
            />
            {errors.bairro && <small className="text-red-500">{errors.bairro}</small>}
          </div>
          <div className="flex flex-col">
            <label>Cidade</label>
            <input
              name="cidade"
              className="border p-2 border-black rounded-xl text-sm"
              placeholder="Barueri"
              value={paciente.cidade}
              onChange={handleChange}
            />
            {errors.cidade && <small className="text-red-500">{errors.cidade}</small>}
          </div>
          <div className="flex flex-col">
            <label>Estado</label>
            <input
              name="estado"
              maxLength={2}
              className="border p-2 border-black rounded-xl text-sm"
              placeholder="SP"
              value={paciente.estado}
              onChange={handleChange}
            />
            {errors.estado && <small className="text-red-500">{errors.estado}</small>}
          </div>
        </div>

        <h5 className="font-bold text-lg mt-4 mb-2">🩺 Histórico Clínico</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label>🩺 Histórico Clínico</label>
            <textarea
              name="historico_clinico"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Informe doenças pré-existentes, cirurgias realizadas..."
              value={paciente.historico_clinico}
              onChange={handleChange}
            ></textarea>
            {errors.historico_clinico && <small className="text-red-500">{errors.historico_clinico}</small>}
          </div>

          <div className="flex flex-col">
            <label>⚠️ Alergias</label>
            <textarea
              name="alergias"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Informe o tipo de alergia e reação."
              value={paciente.alergias}
              onChange={handleChange}
            ></textarea>
            {errors.alergias && <small className="text-red-500">{errors.alergias}</small>}
          </div>

          <div className="flex flex-col">
            <label>💊 Medicações em uso</label>
            <textarea
              name="medicacoes"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Informe medicamento, dosagem e frequência."
              value={paciente.medicacoes}
              onChange={handleChange}
            ></textarea>
            {errors.medicacoes && <small className="text-red-500">{errors.medicacoes}</small>}
          </div>

          <div className="flex flex-col">
            <label>❤️ Hábitos e estilo de vida</label>
            <textarea
              name="habitos"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Tabagismo, álcool, atividade física, dieta..."
              value={paciente.habitos}
              onChange={handleChange}
            ></textarea>
            {errors.habitos && <small className="text-red-500">{errors.habitos}</small>}
          </div>

          <div className="flex flex-col">
            <label>🧩 Condições especiais</label>
            <textarea
              name="condicoes_especiais"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Marcapasso, prótese, deficiência visual/auditiva..."
              value={paciente.condicoes_especiais}
              onChange={handleChange}
            ></textarea>
            {errors.condicoes_especiais && <small className="text-red-500">{errors.condicoes_especiais}</small>}
          </div>

          <div className="flex flex-col">
            <label>🧠 Saúde mental</label>
            <textarea
              name="saude_mental"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Informações sobre saúde mental."
              value={paciente.saude_mental}
              onChange={handleChange}
            ></textarea>
            {errors.saude_mental && <small className="text-red-500">{errors.saude_mental}</small>}
          </div>

          <div className="flex flex-col">
            <label>🩹 Vacinação</label>
            <textarea
              name="vacinacao"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Covid-19, Influenza, Hepatite B, Tétano..."
              value={paciente.vacinacao}
              onChange={handleChange}
            ></textarea>
            {errors.vacinacao && <small className="text-red-500">{errors.vacinacao}</small>}
          </div>

          <div className="flex flex-col">
            <label>🧾 Observações / Evoluções</label>
            <textarea
              name="observacoes"
              className="text-sm border border-black p-2 rounded-xl resize-none leading-5"
              rows={5}
              placeholder="Campo livre para o profissional."
              value={paciente.observacoes}
              onChange={handleChange}
            ></textarea>
            {errors.observacoes && <small className="text-red-500">{errors.observacoes}</small>}
          </div>
        </div>
        <div className="my-4">
          <button
            disabled={status === "saving"}
            type="submit"
            className={`rounded-full px-4 py-2.5 mr-3 text-white font-semibold text-sm transition ${status === "saving"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#25a096] hover:bg-[#1e827a]"
              }`}
          >
            {status === "saving"
              ? "Aguarde, Abrindo Prontuário..."
              : "Abrir Prontuário"}
          </button>
          <button
            disabled={cancel}
            type="button"
            onClick={handleCancel}
            className={`rounded-full px-4 py-2.5 text-white font-semibold text-sm transition ${cancel ? "bg-gray-400 cursor-not-allowed" : "bg-[#f44336] hover:bg-[#e53935]"
              }`}
          >
            {cancel ? "Cancelando..." : "Cancelar"}
          </button>
        </div>
      </form>
    </div>
  );
}