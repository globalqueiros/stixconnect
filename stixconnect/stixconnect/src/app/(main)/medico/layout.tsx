import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen"> 
      <Sidebar />
      <main className="flex-1 ml-64 p-0 bg-gray-50">
        <Navbar />
        {children}
      </main>
    </div>
  );
}