import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import PanelAdmin from './PanelAdmin';

export default async function AdminPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/login');
  }

  const user = await currentUser();
  const esAdmin = user?.publicMetadata?.role === 'admin';

  if (!esAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="text-center p-8 bg-white rounded-xl border border-zinc-200 shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-zinc-500 text-sm">No tenés permisos de administrador para ver este panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-zinc-200 pb-4">
          <h1 className="text-3xl font-bold text-[#1E3F20]" style={{ fontFamily: 'Georgia, serif' }}>
            Panel de Control de Pagos
          </h1>
          <p className="text-zinc-500 mt-1">
            Consola maestra de administración del sistema de pagos. Operando como: {user.firstName}.
          </p>
        </header>
        
        {/* Renderizamos el panel interactivo completo */}
        <PanelAdmin />
      </div>
    </div>
  );
}