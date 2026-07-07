import Link from 'next/link';
import React from 'react';

export default function RefundSuccessPage() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-4 transition-colors font-sans">
      <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-3xl shadow-xl p-8 text-center border border-stone-200 dark:border-stone-700">
        
        {/* Ícono de Éxito animado */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-stone-800 dark:text-white mb-2">
          ¡Reembolso Aprobado!
        </h2>
        
        <p className="text-stone-500 dark:text-stone-400 mb-8">
          Cancelamos tu compra con éxito. El dinero fue devuelto a tu cuenta de Mercado Pago y estará disponible en los próximos minutos.
        </p>

        {/* Botón para volver */}
        <Link 
          href="/history-buyer" 
          className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          Volver a Mis Compras
        </Link>
      </div>
    </div>
  );
}