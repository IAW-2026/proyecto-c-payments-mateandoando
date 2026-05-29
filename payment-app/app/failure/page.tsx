import Link from 'next/link';

export default function FailurePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 p-4 font-sans dark:bg-stone-900 transition-colors">
      <main className="w-full max-w-md flex flex-col items-center gap-6 rounded-2xl bg-white p-10 text-center shadow-xl dark:bg-stone-800 border-t-4 border-red-500">
        
        {/* Ícono de cruz roja */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white">
          Pago Rechazado
        </h1>
        
        <p className="text-stone-600 dark:text-stone-400 text-lg">
          No pudimos procesar tu pago. Puede ser por falta de fondos, un error temporal con el banco o porque cancelaste la operación.
        </p>
        
        <div className="rounded-lg bg-stone-50 p-4 dark:bg-stone-700/50">
          <p className="text-stone-600 dark:text-stone-300 text-sm">
            Quedate tranquilo que <b>no se te cobró nada</b> en tu tarjeta.
          </p>
        </div>

        {/* Botón para darle una segunda oportunidad de compra */}
        <Link 
          href="/"
          className="mt-2 w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-95"
        >
          Intentar pagar de nuevo
        </Link>
      </main>
    </div>
  );
}