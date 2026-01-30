"use client";
import Image from "next/image";

const cards = [
  {
    titulo: "Mult Imagem",
    imagem: "/clinica_multi_imagem.png",
    link: "http://portal.multimagem.med.br:8081/login",
  },
  {
    titulo: "Mega Imagem",
    imagem: "/mega_imagem.webp",
    link: "https://resultado.clinux.com.br/portal/megaimagem/resultados",
  },
  {
    titulo: "Eurofins Pasteur",
    imagem: "/eurofins.svg",
    link: "https://imagemsantos.com.br:8443/Mediweb/login#",
  },
  {
    titulo: "IACS",
    imagem: "/iacs.png",
    link: "https://resultado.iacs.com.br/shift/lis/iacs/elis/s01.iu.web.Login.cls?config=UNICO&sigla=",
  },
  {
    titulo: "Cellula Mater",
    imagem: "/cellula_mater.png",
    link: "https://resultados.indauhost.com/matrixnet/wfrmLogin.aspx",
  },
];

export default function Page() {
  return (
    <>
      <div className="flex flex-col mt-3 px-4">
        <div className="my-4 text-left">
          <h2 className="text-lg font-semibold">Resultado de Exames do Paciente</h2>
        </div>

        <div className="flex flex-wrap gap-6">
          {cards.map((card, index) => (
            <div key={index} className="w-72 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col justify-between" style={{ minHeight: "400px" }}>
              <div className="flex items-center justify-center bg-white p-6 h-40">
                <Image
                  src={card.imagem}
                  alt={card.titulo}
                  width={180}
                  height={100}
                  className="object-contain max-h-24"
                />
              </div>
              <div className="p-4 flex flex-col justify-between bg-gray-100 flex-1">
                <h5 className="text-xl font-semibold mb-2">{card.titulo}</h5>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                 Consultar resultado do paciente em <strong>{card.titulo}</strong>
                </p>
                <a href={card.link} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm text-white bg-[#10c4b5] font-semibold rounded-xl px-4 py-2.5 mt-auto transition-all duration-200 hover:bg-[#0fa69c] text-center">
                  Acessar Resultado
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
