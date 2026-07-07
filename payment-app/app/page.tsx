import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function RootPage() {
  // 1. Verificamos si el usuario tiene una sesión activa en Clerk
  const { userId } = await auth();

  // Si no está logueado, sigue el flujo de siempre y va a /login
  if (!userId) {
    redirect('/login');
  }

  // 2. Si está logueado, traemos sus datos para revisar los metadatos públicos
  const user = await currentUser();
  const esAdmin = user?.publicMetadata?.role === 'admin';

  // Si tiene el rol de administrador, lo desviamos al panel de control
  if (esAdmin) {
    redirect('/admin');
  }

  // Si está logueado pero es un cliente/usuario normal, sigue el flujo que tenías hasta ahora
  redirect('/login');
}