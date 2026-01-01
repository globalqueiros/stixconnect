"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import AuthProvider from "../../components/AuthProvider";
import Header from "../../components/Header";
import HeaderMobile from "../../components/HeaderMobile";
import SideNav from "../../components/SideNav";
import MarginWidthWrapper from "../../components/MarginWidthWrapper";

const faqs = [
  {
    id: 1,
    title: "Como posso contratar um benefício?",
    descricao:
      "Para contratar um dos benefícios disponíveis para colaboradores da Stixmed, entre em contato através do chat, das 09h às 17h, ou pelo email atendimento@groupqueiros.com.",
  },
  {
    id: 2,
    title: "Como funciona o sistema de pagamento?",
    descricao:
      "Nossos pagamentos são realizados todos dias 5 ou 10 de forma comissionada levando em consideração fatores como desempenho, volume de vendas, cumprimento de metas e outros indicadores relevantes.",
  },
  {
    id: 3,
    title: "Posso trocar minha conta bancária?",
    descricao:
      "Sim, para atualizar suas informações bancárias, basta abrir um protocolo clicando no card abaixo.",
  }
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <AuthProvider>
      <div className="flex h-screen">
        <SideNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <main className="flex-1 overflow-auto">
          <MarginWidthWrapper>
            <Header title="Central de Ajuda" onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
            <div className="p-6">
              <h2 className="font-bold text-center text-2xl mb-6">Central de Ajuda</h2>
              {faqs.map((faq, index) => (
                <div key={faq.id} className="w-full pb-4 mt-4">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between font-semibold text-lg"
                  >
                    <div className="flex items-center justify-between w-full border-b pb-3">
                      <span className="text-gray-900 text-left">{faq.title}</span>
                      {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 text-justify leading-6">{faq.descricao}</p>
                    </div>
                  )}
                </div>
              ))}              
            </div>
            <HeaderMobile onMenuToggle={toggleMenu} />
          </MarginWidthWrapper>
        </main>
      </div>
    </AuthProvider>
  );
}