'use client';
import { useState, useEffect } from "react";

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const cookieAccepted = localStorage.getItem("cookieAccepted");
        if (!cookieAccepted) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem("cookieAccepted", "true");
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="p-3 fixed bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-md md:max-w-6xl lg:max-w-7xl xl:max-w-2xl 2xl:max-w-6xl bg-[#25a096] py-6 px-4 sm:py-4 sm:px-8 lg:px-16 rounded-3xl text-white z-50 shadow-lg">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-4 sm:mb-0 sm:pr-6 mr-0">
                    <header className="text-base sm:text-lg font-bold mb-2">Aviso de Cookie</header>
                    <p className="max-w-3xl text-xs sm:text-sm lg:text-sm md:text-xs text-justify my-0 leading-7 text-white">
                        Nós armazenamos dados temporariamente para melhorar a sua experiência
                        de navegação e recomendar conteúdo de seu interesse. Ao utilizar
                        nossos serviços, você concorda com tal monitoramento.
                    </p>
                </div>
                <div className="flex flex-row items-center justify-center gap-6">
                    <button
                        className="text-xs font-semibold rounded-full px-4 py-2 lg:px-6 lg:py-2 bg-[#1e8b7f] hover:bg-[#186f65] transition"
                        onClick={handleClose}
                        aria-label="Aceitar e fechar aviso de cookies"
                    >
                        Concordo
                    </button>
                    <a
                        href="/politica_privacidade"
                        className="text-center text-xs underline 2xl:text-sm lg:text-xs md:text-sm hover:text-gray-200 transition"
                        aria-label="Saiba mais sobre a política de privacidade"
                    >
                        Saiba Mais
                    </a>
                </div>
            </div>
        </div>

    );
}