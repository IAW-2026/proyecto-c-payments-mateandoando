'use client';
import React, { useState } from 'react';

interface BotonPagoProps {
  ordenId: string;
  compradorId: string;
  totalFinal: number;
  checkoutUrl: string | null; // <-- La recibimos acá
}

export default function BotonPago({ ordenId, compradorId, totalFinal, checkoutUrl }: BotonPagoProps) {
  const [cargando, setCargando] = useState(false);

  const handlePagar = () => {
    setCargando(true);
    
    // Si tenemos la URL guardada en la base de datos, viajamos directo
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      alert("Error: El link de pago no está disponible en la base de datos.");
      setCargando(false);
    }
  };

  return (
    <button
      onClick={handlePagar}
      disabled={cargando}
      className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 active:scale-[0.98] transition-all shadow-md"
    >
      {cargando ? "Redirigiendo..." : "Pagar con Mercado Pago"}
    </button>
  );
}