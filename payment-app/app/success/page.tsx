'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const BUYER_APP_URL = process.env.NEXT_PUBLIC_BUYER_URL || "https://proyecto-c-buyer2-mateandoando.vercel.app";
  
  // 1. Atrapamos el ID que viene en la URL desde Mercado Pago
  const searchParams = useSearchParams();
  const idOperacion = searchParams.get('id_operacion');

  useEffect(() => {
    // 2. Disparamos la actualización en la Base de Datos
    const avisarAlBackend = async () => {
      if (idOperacion) {
        try {
          await fetch(`/api/payments/transactions/${idOperacion}/approved`, {
            method: 'PATCH',
          });
          console.log("¡La base de datos se actualizó a APROBADO!");
        } catch (error) {
          console.error("Falló la llamada al backend:", error);
        }
      }
    };

    avisarAlBackend();

    // 3. Temporizador normal de redirección
    const timer = setTimeout(() => {
      window.location.href = BUYER_APP_URL;
    }, 4000);

    return () => clearTimeout(timer);
  }, [BUYER_APP_URL, idOperacion]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 p-4 font-sans dark:bg-stone-900 transition-colors">
      <main className="w-full max-w-md flex flex-col items-center gap-6 rounded-2xl bg-white p-10 text-center shadow-xl dark:bg-stone-800 border-t-4 border-green-500">
        
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white">
          ¡Pago Aprobado!
        </h1>
        
        <p className="text-stone-600 dark:text-stone-400 text-lg">
          Tu compra en <b>MateandoAndo</b> se procesó correctamente. 
        </p>
        
        <div className="rounded-lg bg-stone-50 p-4 dark:bg-stone-700/50 w-full">
          <p className="text-stone-600 dark:text-stone-300 text-sm">
            Ya le avisamos al vendedor para que empiece a preparar tu mate. ¡Gracias por tu compra!
          </p>
        </div>

        <a 
          href={BUYER_APP_URL}
          className="mt-2 w-full flex justify-center items-center rounded-xl bg-green-600 py-4 font-bold text-white shadow-md transition-all hover:bg-green-700 active:scale-95"
        >
          Volver a la tienda
        </a>
      </main>
    </div>
  );
}

// Envolvemos todo en Suspense porque usamos useSearchParams
export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Procesando éxito...</div>}>
      <SuccessContent />
    </Suspense>
  );
}