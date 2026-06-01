'use client'; 

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ContenidoCheckout() {
  const searchParams = useSearchParams();
  
  const ordenId = searchParams.get('orden');
  const precioUrl = searchParams.get('precio');

  const esModoPrueba = !ordenId || !precioUrl;

  const productos = esModoPrueba 
    ? [
        { id: 1, nombre: 'Mate Imperial de Calabaza', precio: 15000, vendedor: 'Artesanías El Gaucho' },
        { id: 2, nombre: 'Bombilla Pico de Loro (Alpaca)', precio: 8500, vendedor: 'Artesanías El Gaucho' },
        { id: 3, nombre: 'Yerba Mate Orgánica 1kg', precio: 4200, vendedor: 'Yerbas del Litoral' },
        { id: 4, nombre: 'Termo Stanley 1L Verde', precio: 45000, vendedor: 'Importadora Sur' },
        { id: 5, nombre: 'Matera de Cuero Artesanal', precio: 22000, vendedor: 'Artesanías El Gaucho' },
      ]
    : [
        { id: 99, nombre: `Orden de compra #${ordenId}`, precio: Number(precioUrl), vendedor: 'Tienda Oficial' }
      ];

  // 1. Simulamos los costos de envío que nos mandaría la Buyer App
  const costosEnvioMock: Record<string, number> = {
    'Artesanías El Gaucho': 3500,
    'Yerbas del Litoral': 2800,
    'Importadora Sur': 0, // ¡Envío gratis!
    'Tienda Oficial': 1500
  };

  // 2. AGRUPAMOS PRODUCTOS Y LES ASIGNAMOS SU ENVÍO
  const paquetes = productos.reduce((acumulador: any, producto) => {
    if (!acumulador[producto.vendedor]) {
      acumulador[producto.vendedor] = {
        items: [],
        costoEnvio: esModoPrueba ? costosEnvioMock[producto.vendedor] : 0
      };
    }
    acumulador[producto.vendedor].items.push(producto);
    return acumulador;
  }, {});

  // 3. CÁLCULOS FINALES
  const subtotalProductos = esModoPrueba ? productos.reduce((acc, prod) => acc + prod.precio, 0) : Number(precioUrl);
  // Sumamos los costos de envío de todos los paquetes generados
  const totalEnvios = Object.values(paquetes).reduce((acc: number, paquete: any) => acc + paquete.costoEnvio, 0);
  const totalFinal = subtotalProductos + totalEnvios;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center py-10 px-4 font-sans text-stone-800 dark:bg-stone-900 dark:text-stone-100 transition-colors">
      
      <h1 className="text-4xl font-extrabold mb-8 text-green-700 dark:text-green-500 tracking-tight">
        MateandoAndo
      </h1>
      
      <main className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-2xl font-bold mb-1">Tu Pedido</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {esModoPrueba ? 'Estás viendo datos de prueba (Mock)' : 'Revisá tus productos antes de finalizar la compra'}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-6 bg-stone-50 dark:bg-stone-800/50">
          {Object.entries(paquetes).map(([vendedor, datosPaquete]: [string, any]) => (
            <div key={vendedor} className="mb-6 last:mb-0">
              
              <h3 className="font-semibold text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                Paquete de: {vendedor}
              </h3>
              
              <div className="space-y-3 pl-2 border-l-2 border-stone-200 dark:border-stone-600">
                {/* Lista de Mates/Bombillas */}
                {datosPaquete.items.map((prod: any) => (
                  <div key={prod.id} className="flex justify-between items-center bg-white dark:bg-stone-700 p-3 rounded-xl shadow-sm border border-stone-100 dark:border-stone-600">
                    <span className="font-medium pr-4">{prod.nombre}</span>
                    <span className="font-bold text-green-700 dark:text-green-400 whitespace-nowrap">
                      ${prod.precio.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
                
                {/* Fila del costo de envío de este vendedor */}
                <div className="flex justify-between items-center bg-stone-100 dark:bg-stone-800 p-3 rounded-xl shadow-inner border border-dashed border-stone-300 dark:border-stone-600 mt-2">
                  <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Costo de envío</span>
                  <span className={`font-bold text-sm ${datosPaquete.costoEnvio === 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-700 dark:text-stone-300'}`}>
                    {datosPaquete.costoEnvio === 0 ? '¡Gratis!' : `$${datosPaquete.costoEnvio.toLocaleString('es-AR')}`}
                  </span>
                </div>
              </div>
              
            </div>
          ))}
        </div>

        {/* 4. SECCIÓN FINAL DESGLOSADA */}
        <div className="p-6 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 flex flex-col gap-4">
          
          <div className="flex flex-col gap-2 border-b border-stone-100 dark:border-stone-700 pb-4">
            <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
              <span>Subtotal productos:</span>
              <span>${subtotalProductos.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
              <span>Total envíos:</span>
              <span>${totalEnvios.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total a pagar:</span>
            <span>${totalFinal.toLocaleString('es-AR')}</span>
          </div>
          
          <button 
            className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all shadow-md flex justify-center items-center mt-2"
            onClick={async (e) => {
              e.currentTarget.innerText = "Procesando...";
              e.currentTarget.disabled = true;

              try {
                const respuesta = await fetch('/api/payments/create', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'sk_srvc_pagos_secreto_123' 
                  },
                  body: JSON.stringify({
                    id_purchase_order: esModoPrueba ? '123e4567-e89b-12d3-a456-426614174000' : ordenId,
                    id_buyer: '987f6543-e21b-34c5-b678-537725285111', 
                    // ¡Acá le mandamos a MP el total exacto con todo sumado!
                    total_price: totalFinal
                  })
                });

                if (!respuesta.ok) throw new Error('Falló la creación del pago en el backend');

                const datos = await respuesta.json();

                if (datos.checkout_url) window.location.href = datos.checkout_url;
                else alert("Error: El backend no devolvió el link de Mercado Pago");

              } catch (error) {
                console.error(error);
                alert("Hubo un error al intentar conectar con el servidor.");
                e.currentTarget.innerText = "Pagar con Mercado Pago";
                e.currentTarget.disabled = false;
              }
            }}
          >
            Pagar con Mercado Pago
          </button>
        </div>

      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Cargando pantalla de pago...</div>}>
      <ContenidoCheckout />
    </Suspense>
  );
}