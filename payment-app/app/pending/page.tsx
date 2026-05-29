import Link from 'next/link';

export default function PendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 p-4 font-sans dark:bg-stone-900 transition-colors">
      <main className="w-full max-w-md flex flex-col items-center gap-6 rounded-2xl bg-white p-10 text-center shadow-xl dark:bg-stone-800 border-t-4 border-amber-500">
        
        {/* Ícono de reloj o espera en color ámbar */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white">
          Pago Pendiente
        </h1>
        
        <p className="text-stone-600 dark:text-stone-400 text-lg">
          Tu pago está en proceso de revisión o a la espera de que lo abones en efectivo.
        </p>
        
        <div className="rounded-lg bg-stone-50 p-4 dark:bg-stone-700/50">
          <p className="text-stone-600 dark:text-stone-300 text-sm">
            <b>No vuelvas a realizar la compra.</b> Te avisaremos apenas Mercado Pago nos confirme la acreditación del dinero para preparar tu pedido.
          </p>
        </div>

        <Link 
          href="/"
          className="mt-2 w-full rounded-xl bg-amber-500 py-4 font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-95"
        >
          Volver a la tienda
        </Link>
      </main>
    </div>
  );
}