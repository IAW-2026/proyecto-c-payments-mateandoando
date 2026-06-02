'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Orden {
  total_price: number;
  checkout_url?: string; // Acá podrías guardar el init_point en tu DB
  // Si no lo guardás en la DB, podés usar el ID de la preferencia para armar el link manual
}

export default function CheckoutResumenPage() {
  const params = useParams();
  const idPayment = params.id_payment_operation as string;
  const [orden, setOrden] = useState<Orden | null>(null);

  useEffect(() => {
    // Reutilizamos el endpoint que ya tenías en tu contrato para traer los datos!
    // (GET /api/payments/transactions/{id_payment_operation})
    fetch(`/api/payments/transactions/${idPayment}`)
      .then(res => res.json())
      .then(data => setOrden(data))
      .catch(err => console.error("Error al cargar la orden", err));
  }, [idPayment]);

  if (!orden) {
    return <div className="min-h-screen flex items-center justify-center">Cargando tu resumen...</div>;
  }

  // Nota: Asegurate de que tu endpoint GET de transacciones devuelva el checkout_url/init_point
  // Si no lo devuelve, vas a tener que agregarlo a tu modelo de Prisma y guardarlo en el POST /create
  const linkMercadoPago = orden.checkout_url || "#";

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-200 text-center">
        
        <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Resumen de tu Compra</h1>
        <p className="text-stone-500 mb-6">Verificá el monto antes de proceder al pago.</p>
        
        <div className="bg-stone-50 p-6 rounded-2xl mb-8 border border-stone-200">
          <p className="text-sm text-stone-500 uppercase tracking-wide font-bold mb-1">Total a Pagar</p>
          <p className="text-4xl font-extrabold text-stone-800">
            ${Number(orden.total_price).toLocaleString('es-AR')}
          </p>
        </div>

        {/* El Botón Mágico que los saca de tu app y los lleva a MP */}
        <a
          href={linkMercadoPago}
          className="block w-full py-4 px-4 bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-lg rounded-xl transition-colors shadow-md"
        >
          Pagar con Mercado Pago
        </a>

        {/* NUEVO: Botón secundario para ir al historial */}
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