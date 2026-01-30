"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import AuthProvider from "../../components/AuthProvider/page";
import Header from "../../components/Header/header";
import HeaderMobile from "../../components/Header/header-mobile";
import SideNav from "../../components/Header/side-nav";
import MarginWidthWrapper from "../../components/Header/margin-width-wrapper";
import axios from "axios";

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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <AuthProvider>
      <div className="flex">
        <SideNav />
        <main className="flex-1">
          <MarginWidthWrapper>
            <Header />
            <div className="p-4">
              <h3 className="font-bold text-center text-xl mt-2">Central de Ajuda</h3>
              {faqs.map((faq, index) => (
                <div key={faq.id} className="w-full pb-2 mt-3.5">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between font-bold text-lg"
                  >
                    <div className="flex items-center justify-between w-full border-b pb-2">
                      <span className="text-black text-left text-base">{faq.title}</span>
                      {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div className="mt-2 bg-gray-100 p-3 rounded leading-6">
                      <p className="text-black text-justify text-sm leading-6">{faq.descricao}</p>
                    </div>
                  )}
                </div>
              ))}              
            </div>
            <HeaderMobile />
          </MarginWidthWrapper>
        </main>
      </div>
    </AuthProvider>
  );
}