'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Orden {
  total_price: number;
  url?: string; // Acá podrías guardar el init_point en tu DB
  // Si no lo guardás en la DB, podés usar el ID de la preferencia para armar el link manual
}

export default function CheckoutResumenPage() {
  const params = useParams();
  const idPayment = params.id_payment_operation as string;
  const [orden, setOrden] = useState<Orden | null>(null);

  useEffect(() => {
  console.log("idPayment recibido de params:", idPayment); // ← Mirá en consola
  
  fetch(`/api/payments/transactions/${idPayment}`)
    .then(res => {
      console.log("Status del GET:", res.status); // ← Mirá el status HTTP
      return res.json();
    })
    .then(data => {
      console.log("Datos completos recibidos:", data); // ← Mirá qué devuelve
      console.log("URL de MP:", data.url); // ← Específicamente el URL
      setOrden(data);
    })
    .catch(err => console.error("Error al cargar la orden", err));
}, [idPayment]);

  if (!orden) {
    return <div className="min-h-screen flex items-center justify-center">Cargando tu resumen...</div>;
  }

  // Nota: Asegurate de que tu endpoint GET de transacciones devuelva el checkout_url/init_point
  // Si no lo devuelve, vas a tener que agregarlo a tu modelo de Prisma y guardarlo en el POST /create
  const linkMercadoPago = orden.url || "#";

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
        <button 
  className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all shadow-md flex justify-center items-center mt-2"
  onClick={async (e) => {
    // Cambiamos el texto del botón
    const btn = e.currentTarget;
    btn.innerText = "Procesando...";
    btn.disabled = true;

    try {
      // Llamamos directo al POST (el que crea la preferencia en MP)
      const respuesta = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Asegurate de pasar los datos que tu API espera
          id_purchase_order: 'TU_ID_ORDEN', 
          id_buyer: 'ID_COMPRADOR', 
          total_price: 15000 // O el valor que corresponda
        })
      });

      const datos = await respuesta.json();

      if (datos.checkout_url) {
        // REDIRECCIÓN DIRECTA
        window.location.href = datos.checkout_url;
      } else {
        alert("No se pudo obtener el link de pago");
        btn.innerText = "Pagar con Mercado Pago";
        btn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
      btn.innerText = "Pagar con Mercado Pago";
      btn.disabled = false;
    }
  }}
>
  Pagar con Mercado Pago
</button>

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