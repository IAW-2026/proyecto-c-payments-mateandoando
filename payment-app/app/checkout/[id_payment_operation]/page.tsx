'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ContenidoCheckoutResumen() {
  const searchParams = useSearchParams();
  const [cargando, setCargando] = useState(false);

  // Obtenemos los datos de la URL
  const ordenId = searchParams?.get('orden') || 'orden-default';
  const precioUrl = searchParams?.get('precio') || '0';
  const compradorId = searchParams?.get('comprador') || 'comprador-default';
  const totalFinal = Number(precioUrl) || 0;

  const handlePagar = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_purchase_order: ordenId,      // ✅ Datos reales
          id_buyer: compradorId,            // ✅ Datos reales
          total_price: totalFinal            // ✅ Precio real
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.error || 'Error en el servidor');
      }

      const datos = await respuesta.json();
      console.log("Respuesta del servidor:", datos); // ← Para debuggear

      if (datos.checkout_url) {
        window.location.href = datos.checkout_url;
      } else {
        alert("No se pudo obtener el link de pago");
      }
    }catch (error: any) {
  console.error("Error:", error);
  const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
  alert(`Error al conectar: ${mensajeError}`);
} finally {
  setCargando(false);
}
  };

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

        <button
          onClick={handlePagar}
          disabled={cargando}
          className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 active:scale-[0.98] transition-all shadow-md"
        >
          {cargando ? "Procesando..." : "Pagar con Mercado Pago"}
        </button>

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

export default function CheckoutResumenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ContenidoCheckoutResumen />
    </Suspense>
  );
}