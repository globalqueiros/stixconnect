"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  // 🔹 Recupera email/senha salvos
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    const savedPass = localStorage.getItem("remember_pass");

    if (savedEmail && savedPass) {
      setEmail(savedEmail);
      setPassword(savedPass);
      setRemember(true);
    }
  }, []);

  // 🔹 MOSTRA ALERTA DE LOGOUT
  useEffect(() => {
    const message = sessionStorage.getItem("flashMessage");

    if (message) {
      setAlert(message);
      sessionStorage.removeItem("flashMessage");

      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const sanitizeInput = (input: string) =>
    input.replace(/<[^>]*>?/gm, "").trim();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail || !sanitizedPassword) {
      setError("Preencha todos os campos corretamente.");
      setLoading(false);
      return;
    }

    try {
      // 🔹 Remember me
      if (remember) {
        localStorage.setItem("remember_email", sanitizedEmail);
        localStorage.setItem("remember_pass", sanitizedPassword);
      } else {
        localStorage.removeItem("remember_email");
        localStorage.removeItem("remember_pass");
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sanitizedEmail,
          password: sanitizedPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Email ou senha incorretos.");
        setLoading(false);
        return;
      }

      if (!data.user || !data.user.codPerfil) {
        setError("Seu acesso não está configurado.");
        setLoading(false);
        return;
      }

      if (data.user.codPerfil < 4) {
        setError("Acesso bloqueado para seu nível de usuário.");
        setLoading(false);
        return;
      }

      if (!data.user.rota) {
        setError("Rota de acesso não configurada.");
        setLoading(false);
        return;
      }

      // 🔹 Salva sessão
      sessionStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userLevel", String(data.user.codPerfil));

      router.replace(data.user.rota);
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundImage: "url('/bg-fundo.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Lado esquerdo */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="absolute inset-0 bg-[#10c4b5] opacity-25" />
        <Image
          src="/logo_branco.png"
          width={550}
          height={550}
          alt="Logo Stixconnect"
          className="relative z-10"
        />
      </div>

      {/* Login */}
      <div className="w-full lg:w-[430px] bg-white flex flex-col items-center justify-center shadow-lg">
        <div className="w-full px-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-1">
              Bem-vindo à Stixconnect 👋
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              Faça login para acessar sua área.
            </p>
          </div>

          {/* ALERTA ERRO */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* ALERTA LOGOUT */}
          {alert && (
            <div className="fixed top-5 right-5 z-50 rounded-xl bg-green-600 px-6 py-3 text-white shadow-lg animate-fade-in">
              {alert}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col">
            <label className="mb-1.5 font-medium">Email / Matrícula</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm border rounded-xl p-2 mb-2"
              required
            />
            <label className="mb-1.5 font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm border rounded-xl p-2 mb-2"
              required
            />

            <div className="flex items-center justify-between text-sm mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="cursor-pointer"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Lembrar de mim
              </label>
              <a href="/esqueci_senha" className="text-blue-600 hover:underline">
                Esqueci a senha?
              </a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-full px-4 py-2.5 text-white font-semibold ${loading
                  ? "bg-gray-400"
                  : "bg-[#25a096] hover:bg-[#1e827a]"
                }`}
            >
              {loading ? "Acessando..." : "Acessar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}