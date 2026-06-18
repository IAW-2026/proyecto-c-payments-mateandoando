'use client';

import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

interface Venta {
  idPaymentOperation: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  idPurchaseOrder: string;
}

export default function SellerHistoryPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);

  // Simulamos el ID del vendedor logueado por ahora
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Si Clerk todavía está cargando o no hay usuario, no hacemos nada
    if (!isLoaded || !user) return;

    const cargarVentas = async () => {
      try {
        // Usamos el ID real de Clerk (user.id) en lugar del simulado
        const res = await fetch(`/api/payments/history/seller/${user.id}`, {
          headers: {
            'X_API_key': 'clave_secreta_seller_123'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setVentas(data);
        }
      } catch (error) {
        console.error("Error al cargar ventas:", error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarVentas();
  }, [isLoaded, user]); // Le avisamos al useEffect que dependemos de estas variables

  // Calculamos la plata real que le entra (solo las aprobadas)
  const gananciasTotales = ventas
    .filter(v => v.status === 'APROBADO')
    .reduce((acc, v) => acc + Number(v.totalPrice), 0);

  return (
    <div className="min-h-screen bg-stone-100 py-10 px-4 font-sans text-stone-800 dark:bg-stone-900 dark:text-stone-100 transition-colors">
      <main className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4">
          <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white tracking-tight">
            Panel de Ventas
          </h1>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-sm text-stone-500">Ingresos Confirmados</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${gananciasTotales.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {cargando ? (
          <p className="text-stone-500">Cargando tu registro de ventas...</p>
        ) : ventas.length === 0 ? (
          <p className="text-stone-500 bg-white p-6 rounded-xl shadow-sm">Todavía no tenés ventas registradas.</p>
        ) : (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl overflow-hidden border border-stone-200 dark:border-stone-700">
            {/* Cabecera de la tabla (oculta en celulares) */}
            <div className="hidden sm:grid grid-cols-4 bg-stone-50 dark:bg-stone-800/50 p-4 border-b border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-500">
              <span>Fecha</span>
              <span>N° Orden</span>
              <span>Estado</span>
              <span className="text-right">Monto</span>
            </div>

            {/* Lista de ventas */}
            <div className="divide-y divide-stone-100 dark:divide-stone-700">
              {ventas.map((venta) => (
                <div key={venta.idPaymentOperation} className="grid grid-cols-1 sm:grid-cols-4 items-center p-4 gap-2 sm:gap-0 hover:bg-stone-50 dark:hover:bg-stone-700/30 transition-colors">
                  
                  <span className="text-sm text-stone-600 dark:text-stone-300">
                    {new Date(venta.createdAt).toLocaleDateString('es-AR')}
                  </span>
                  
                  <span className="text-sm font-mono text-stone-500">
                    {venta.idPurchaseOrder.slice(0, 8)}...
                  </span>
                  
                  <div>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase
                      ${venta.status === 'APROBADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        venta.status === 'REEMBOLSADO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                        'bg-stone-100 text-stone-500 dark:bg-stone-700'}`}>
                      {venta.status}
                    </span>
                  </div>
                  
                  <span className="text-right font-bold text-stone-800 dark:text-stone-200">
                    ${Number(venta.totalPrice).toLocaleString('es-AR')}
                  </span>

                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}