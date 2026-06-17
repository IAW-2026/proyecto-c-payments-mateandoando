'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FailureContent() {
  // 1. Usamos la variable para volver a la app de compras
  const BUYER_APP_URL = process.env.NEXT_PUBLIC_BUYER_URL || "https://proyecto-c-buyer2-mateandoando.vercel.app";
  
  // 2. Leemos el ID que nos manda Mercado Pago por la URL
  const searchParams = useSearchParams();
  const idOperacion = searchParams.get('id_operacion');

  useEffect(() => {
    // 3. Avisamos silenciosamente a tu backend que el pago rebotó
    const avisarRechazo = async () => {
      if (idOperacion) {
        try {
          // Acá llamamos exactamente al endpoint "rejected" que armaste
          await fetch(`/api/payments/transactions/${idOperacion}/rejected`, { 
            method: 'PATCH' 
          });
          console.log("¡Éxito! La base de datos y el resto del sistema se actualizaron a CANCELADO.");
        } catch (error) {
          console.error("Falló la llamada al backend:", error);
        }
      }
    };

    avisarRechazo();

    // 4. (Opcional) A los 5 segundos lo mandamos de vuelta automáticamente a la tienda
    const timer = setTimeout(() => {
      window.location.href = BUYER_APP_URL;
    }, 5000);

    return () => clearTimeout(timer);
  }, [idOperacion, BUYER_APP_URL]);

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

        {/* Botón modificado para usar la variable y etiqueta <a> en lugar de Link */}
        <a 
          href={BUYER_APP_URL}
          className="mt-2 w-full flex items-center justify-center rounded-xl bg-red-600 py-4 font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-95"
        >
          Intentar pagar de nuevo en la tienda
        </a>
      </main>
    </div>
  );
}

// Envolvemos en Suspense por Next.js
export default function FailurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <FailureContent />
    </Suspense>
  );
}