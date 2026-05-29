import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 rounded-xl bg-white p-12 text-center shadow-lg dark:bg-zinc-900">
        
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
          Panel de Pruebas - Payment App
        </h1>

        {/* LO QUE SE VE CUANDO NO ESTÁS LOGUEADO */}
        <Show when="signed-out">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            No estás logueado. Clerk va a bloquear cualquier petición a tus endpoints protegidos.
          </p>
          <div className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700">
            <SignInButton mode="modal" />
          </div>
        </Show>

        {/* LO QUE SE VE CUANDO YA INICIASTE SESIÓN */}
        <Show when="signed-in">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
              Autenticado exitosamente
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Ya tenés tu token JWT guardado. Ahora podés abrir otra pestaña en este mismo navegador y probar tu endpoint GET protegido.
            </p>
            {/* El UserButton muestra tu foto de perfil y te deja cerrar sesión */}
            <UserButton /> 
          </div>
        </Show>

      </main>
    </div>
  );
}