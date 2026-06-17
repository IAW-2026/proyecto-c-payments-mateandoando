import React from 'react';
import { prisma } from '../../lib/prisma'; 
import BotonPago from './BotonPago';

// 1. Tipamos params como una Promesa
export default async function CheckoutResumenPage({ 
  params 
}: { 
  params: Promise<{ id_payment_operation: string }> 
}) {
  
  // 2. Esperamos a que Next.js resuelva la URL
  const parametrosResueltos = await params;
  const idOperacion = parametrosResueltos.id_payment_operation;

  // 3. Ahora sí le pasamos el string real a Prisma
  const orden = await prisma.payment_order.findUnique({
    where: { 
      idPaymentOperation: idOperacion 
    }
  });

  if (!orden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <h2 className="text-2xl font-bold text-stone-800">Orden no encontrada</h2>
      </div>
    );
  }

  const totalFinal = Number(orden.totalPrice);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-200 text-center">
        
        <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Resumen de tu Compra</h1>
        <p className="text-stone-500 mb-6">Verificá el monto antes de proceder al pago.</p>
        
        <div className="bg-stone-50 p-6 rounded-2xl mb-8 border border-stone-200">
          <p className="text-sm text-stone-500 uppercase tracking-wide font-bold mb-1">Total a Pagar</p>
          <p className="text-4xl font-extrabold text-stone-800">
            ${totalFinal.toLocaleString('es-AR')}
          </p>
        </div>

        {/* 3. Le pasamos los datos blindados al botón interactivo */}
        <BotonPago 
          ordenId={orden.idPurchaseOrder} 
          compradorId={orden.idBuyer} 
          totalFinal={totalFinal}
          checkoutUrl={orden.url}
        />

        <a
          href="/history-buyer"
          className="block w-full mt-5 text-sm text-stone-500 hover:text-stone-800 font-semibold transition-colors underline decoration-stone-300 underline-offset-4"
        >
          Ver mi historial de compras
        </a>

      </div>
    </div>
  );
}