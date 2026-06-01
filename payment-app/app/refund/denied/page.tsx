import Link from 'next/link';
import React from 'react';

export default function RefundDeniedPage() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-4 transition-colors font-sans">
      <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-3xl shadow-xl p-8 text-center border border-stone-200 dark:border-stone-700">
        
        {/* Ícono de Advertencia (Paquete en tránsito) */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
          <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-stone-800 dark:text-white mb-2">
          Ups, es demasiado tarde
        </h2>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-8 border border-amber-200 dark:border-amber-800/50">
          <p className="text-amber-800 dark:text-amber-300 text-sm">
            No podemos cancelar esta compra porque <strong>el vendedor ya despachó tu paquete</strong> y se encuentra en poder del correo. ¡Pronto llegará a tu domicilio!
          </p>
        </div>

        {/* Botón para volver */}
        <Link 
          href="/history-buyer" 
          className="block w-full py-3 px-4 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          Entendido, volver al historial
        </Link>
      </div>
    </div>
  );
}