'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSelectedLayoutSegment } from 'next/navigation';
import useScroll from '../../hooks/use-scroll';
import { cn } from '../../lib/utils';
import Image from 'next/image';
import { LogOut, User, Settings } from 'lucide-react';

interface User {
  id: number;
  name: string;
  image: string;
  email: string;
}

const Header = () => {
  const router = useRouter();
  const scrolled = useScroll(5);
  const selectedLayout = useSelectedLayoutSegment();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/protected', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data.user?.name) {
          router.push('/');
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Bom dia');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  }, [router]);

  return (
    <div
      className={cn(
        `sticky inset-x-0 top-0 z-30 w-full h-[46px] transition-all border-b border-gray-200 bg-gray-200`,
        {
          'border-b border-gray-200 bg-white/75 backdrop-blur-lg': scrolled,
          'border-b border-gray-200 bg-white': selectedLayout,
        },
      )}
    >
      <div className="flex h-[46px] my-2 items-center justify-between px-4 bg-gray-200 border-b-2 border-black">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex my-2 flex-row space-x-3 items-center justify-center md:hidden"
          >
            <Image
              src="/logo.png"
              width={150}
              height={150}
              alt="Logo Stixmed"
            />
          </Link>
        </div>
        <div className="hidden md:flex justify-between items-center w-full">
          <h2 className="text-base font-bold">
          {loading ? "Carregando..." : `${greeting}, ${user?.name || "Usuário"}`}
          </h2>
          <div className="h-8 w-8 cursor-pointer rounded-full bg-zinc-N300 flex items-center justify-center" onClick={() => setIsOpen(!isOpen)}>
            {user ? (
              <Image
                src={user.image || './perfil.png'}
                alt="Foto de perfil"
                width={35}
                height={35}
                className="rounded-full object-cover w-auto"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full" />
            )}
          </div>
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-md z-50 text-black">
            <Link href="/meu_perfil" className="w-full text-black text-sm text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
              <User width={16} height={16}/> Meu Perfil
            </Link>
            <Link href="/configuracao" className="w-full text-black text-sm text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
              <Settings width={16} height={16}/> Configurações
            </Link>
            <Link href="/sair"
              className="w-full text-black text-sm text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <LogOut width={16} height={16} /> Sair
            </Link>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;  