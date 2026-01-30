"use client";
import { useEffect, useRef, useState } from "react";

type StatusType = "info" | "success" | "danger" | "cancel";
type AmbienteType = "silencioso" | "baixo" | "barulhento";

export default function TesteDispositivos() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [micLevel, setMicLevel] = useState(0);
  const [ambiente, setAmbiente] = useState<AmbienteType>("silencioso");
  const [status, setStatus] = useState("Permissão necessária para continuar");
  const [statusType, setStatusType] = useState<StatusType>("info");
  const [showModal, setShowModal] = useState(true);

  const statusStyles: Record<StatusType, string> = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-300",
    danger: "bg-red-50 text-red-700 border-red-200",
    cancel: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };

  async function iniciarTeste() {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setStatus("Solicitando permissão...");
      setStatusType("info");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMicLevel = () => {
        analyser.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        setMicLevel(average);

        if (average < 10) {
          setAmbiente("silencioso");
        } else if (average < 30) {
          setAmbiente("baixo");
        } else {
          setAmbiente("barulhento");
        }

        requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();

      setStatus("Câmera e microfone funcionando corretamente");
      setStatusType("success");
    } catch (error) {
      setStatus("Permissão negada ou dispositivo indisponível");
      setStatusType("danger");
    }
  }

  function cancelarTeste() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setMicLevel(0);
    setStatus("Teste cancelado pelo usuário");
    setStatusType("cancel");
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-sm mt-4 px-0">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full text-black max-w-sm shadow-lg space-y-4">
            <h2 className="text-lg font-semibold text-center mb-0">
              Permissão necessária
            </h2>
            <p className="text-sm text-center mt-2">
              Precisamos acessar sua câmera e microfone para garantir a qualidade do atendimento.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  iniciarTeste();
                }}
                className="rounded-full px-6 py-2 text-sm font-semibold cursor-pointer
                bg-[#25a096] text-white hover:bg-[#1e827a] transition"
              >
                Permitir acesso
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setStatus("Permissão não concedida");
                  setStatusType("cancel");
                }}
                className="rounded-full px-6 py-2 text-sm font-semibold cursor-pointer
                border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-lg font-semibold text-black text-center">
          Teste de Câmera e Microfone
        </h1>

        <div
          className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-sm ${statusStyles[statusType]}`}
        >
          <span className="text-center w-full font-medium">{status}</span>
        </div>

        {statusType === "success" && (
          <div
            className={`text-sm text-center font-medium rounded-xl border px-4 py-2
        ${ambiente === "silencioso"
                ? "bg-green-50 text-green-700 border-green-300"
                : ambiente === "baixo"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                  : "bg-red-50 text-red-700 border-red-300"
              }
        `}
          >
            {ambiente === "silencioso" && "🔇 Ambiente silencioso"}
            {ambiente === "baixo" && "🔈 Ambiente com baixo som"}
            {ambiente === "barulhento" && "🔊 Ambiente barulhento"}
          </div>
        )}

        <p className="text-sm font-medium text-black">📷 Câmera</p>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-xl bg-black"
        />

        <div>
          <p className="text-sm font-medium mb-2 text-black">🎙️ Microfone</p>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${ambiente === "barulhento"
                ? "bg-red-500"
                : ambiente === "baixo"
                  ? "bg-yellow-500"
                  : "bg-green-500"
                }`}
              style={{ width: `${Math.min(micLevel, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-full px-6 py-2 text-sm font-semibold cursor-pointer
            bg-[#25a096] text-white hover:bg-[#1e827a] transition"
          >
            Testar novamente
          </button>

          {statusType !== "success" && (
            <button
              onClick={cancelarTeste}
              className="rounded-full px-6 py-2 text-sm font-semibold cursor-pointer
              border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}