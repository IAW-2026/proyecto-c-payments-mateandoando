'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs'; // Importamos Clerk

// Tipado básico para guiar a TypeScript
interface Transaccion {
  idPaymentOperation: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function BuyerHistoryPage() {
  const [compras, setCompras] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);

  const router = useRouter();

  // Traemos al usuario real logueado desde Clerk
  const { user, isLoaded } = useUser(); 

  useEffect(() => {
    // Si Clerk todavía está cargando o no hay usuario, frenamos acá
    if (!isLoaded || !user) return;

    const cargarHistorial = async () => {
      try {
        // Usamos el user.id dinámico en lugar del ID simulado
        const res = await fetch(`/api/payments/history/buyer/${user.id}`, {
          headers: {
            'X_API_key': 'una_clave_super_secreta_123' // La llave de la Buyer App
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCompras(data);
        }
      } catch (error) {
        console.error("Error al cargar compras:", error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarHistorial();
  }, [isLoaded, user]); // Le avisamos a React que dependemos de estos datos

  const solicitarReembolso = async (idPago: string) => {
    const confirmar = window.confirm("¿Estás seguro que querés cancelar esta compra y pedir un reembolso?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/payments/transactions/${idPago}/cancelled`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "CANCELADO" })
      });

      const data = await res.json();

      if (res.status === 409) {
        // La Seller App dijo que ya está en camino
        router.push('/refund/denied'); 
      } else if (res.ok) {
        // La API lo aprobó perfectamente
        router.push('/refund/success'); 
      } else {
        alert("Hubo un error al procesar el reembolso.");
      }
    } catch (error) {
      alert("Error de conexión al intentar cancelar.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 py-10 px-4 font-sans text-stone-800 dark:bg-stone-900 dark:text-stone-100 transition-colors">
      <main className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        
        <h1 className="text-3xl font-extrabold text-green-700 dark:text-green-500 tracking-tight">
          Mis Compras
        </h1>

        {cargando ? (
          <p className="text-stone-500">Cargando tu historial...</p>
        ) : compras.length === 0 ? (
          <p className="text-stone-500 bg-white p-6 rounded-xl shadow-sm">Todavía no hiciste ninguna compra.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {compras.map((compra) => (
              <div key={compra.idPaymentOperation} className="bg-white dark:bg-stone-800 p-5 rounded-2xl shadow-md border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                {/* Datos de la compra */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-stone-400 font-mono">ID: {compra.idPaymentOperation.slice(0, 12)}...</span>
                  <span className="text-xl font-bold text-stone-800 dark:text-white">
                    ${Number(compra.totalPrice).toLocaleString('es-AR')}
                  </span>
                  <span className="text-sm text-stone-500">
                    {new Date(compra.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Estado y Botones */}
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                  {/* Badge de Estado dinámico */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${compra.status === 'APROBADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      compra.status === 'REEMBOLSADO' ? 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300' : 
                      compra.status === 'RECHAZADO' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {compra.status}
                  </span>

                  {/* LA MAGIA: Solo mostramos el botón si está APROBADO y el precio es < 30.000 */}
                  {compra.status === 'APROBADO' && Number(compra.totalPrice) < 30000 && (
                    <button 
                      onClick={() => solicitarReembolso(compra.idPaymentOperation)}
                      className="text-sm px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold rounded-lg transition-colors border border-red-200"
                    >
                      Solicitar Reembolso
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}