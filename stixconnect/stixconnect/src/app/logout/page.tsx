'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Logout() {
  const router = useRouter();
  const [message, setMessage] = useState('Saindo...'); 

  useEffect(() => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    setMessage('Deslogado com sucesso!'); 
    const timeout = setTimeout(() => {
      router.push('/'); 
    }, 1500);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="block max-w-4xl p-6 bg-white border border-gray-200 rounded-lg shadow">
        <Image src="/logo.png" width={120} height={120} alt="Logo Stixmed" className="mx-auto pb-3" />
        <Image src="/sair.svg" width={400} height={400} alt="Saindo da conta" className="mx-auto" />
        <h5 className="mt-3 mb-0 text-2xl text-center font-bold tracking-tight text-green-600">
          {message}
        </h5>
      </div>
    </div>
  );
}