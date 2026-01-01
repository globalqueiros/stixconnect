'use client';

import { useEffect, useState } from "react";

interface Protocolo {
    id: number;
    nprotocol: string;
    assunto: string;
    status: string;
    created: string;
}

export default function Comunicacao() {
    const [protocolos, setProtocolos] = useState<Protocolo[]>([]);

    useEffect(() => {
        fetch("/api/protocolos")
            .then((res) => res.json())
            .then((data) => setProtocolos(data.protocolos))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="flex flex-col mt-3 px-4">
            <div className="my-4 text-left">
                <h2 className="text-lg font-semibold">Protocolos Recentes</h2>
            </div>
            <form action="" method="post">
                <label htmlFor="">Assunto</label>
                <input type="text" name="" id="" />
            </form>
            {protocolos.length === 0 && <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-md text-center text-sm font-medium">
                Nenhum protocolo aberto.
            </div>}
            <ul>
                {protocolos.map((p) => (
                    <li
                        key={p.id}
                        className="p-4 mb-2 border rounded-md shadow-sm hover:shadow-md transition"
                    >
                        <h3 className="font-semibold">{p.nprotocol}</h3>
                        <p className="text-sm text-gray-600">{p.assunto}</p>
                        <span className="text-xs text-white bg-green-500 px-2 py-1 rounded">
                            {p.status}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                            {new Date(p.created).toLocaleString()}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
