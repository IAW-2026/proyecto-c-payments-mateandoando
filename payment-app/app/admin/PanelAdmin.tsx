'use client';
import { useState, useEffect } from 'react';

interface Transaction {
  idPaymentOperation: string;
  status: string;
  createdAt: string;
}

export default function PanelAdmin() {
  const [transacciones, setTransacciones] = useState<Transaction[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoAudit, setCargandoAudit] = useState(false);
  const [cargandoTabla, setCargandoTabla] = useState(true);
  const [resultadoAudit, setResultadoAudit] = useState<string | null>(null);
  const [idCopiado, setIdCopiado] = useState<string | null>(null);

  const cargarTransacciones = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (!data.error) {
        setTransacciones(data);
      }
    } catch (error) {
      console.error('Error cargando la tabla:', error);
    } finally {
      setCargandoTabla(false);
    }
  };

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const ejecutarAuditoria = async () => {
    setCargandoAudit(true);
    setResultadoAudit(null);
    
    try {
      const res = await fetch('/api/payments/sync', { method: 'POST' });
      const data = await res.json();
      
      setResultadoAudit(`Auditoría terminada. Revisados: ${data.revisados || 0} | Actualizados: ${data.actualizados || 0}`);
      await cargarTransacciones();
      
    } catch (error) {
      setResultadoAudit('Error al ejecutar la auditoría automática.');
    } finally {
      setCargandoAudit(false);
    }
  };

  const copiarAlPortapapeles = (id: string) => {
    navigator.clipboard.writeText(id);
    setIdCopiado(id);
    setTimeout(() => setIdCopiado(null), 2000);
  };

  const transaccionesFiltradas = transacciones.filter((t) =>
    t.idPaymentOperation.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: BOTÓN DE AUDITORÍA */}
      <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-800">Auditoría General</h3>
          <p className="text-sm text-zinc-500">Consulta el estado de órdenes vencidas directo contra la pasarela.</p>
        </div>
        <button
          onClick={ejecutarAuditoria}
          disabled={cargandoAudit}
          className="px-5 py-2.5 bg-[#1E3F20] text-white rounded-lg font-medium hover:bg-[#152e17] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
        >
          {cargandoAudit ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Sincronizando DB...
            </>
          ) : (
            'Ejecutar Auditoría Ahora'
          )}
        </button>
      </div>

      {resultadoAudit && (
        <div className="p-3 bg-[#C6E0B4] text-[#1E3F20] rounded-lg text-sm font-medium">
          💡 {resultadoAudit}
        </div>
      )}

      {/* SECCIÓN 2: BARRA DE BÚSQUEDA */}
      <div className="w-full">
        <input
          type="text"
          placeholder="🔍 Buscar por ID de Operación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3F20] text-sm"
        />
      </div>

      {/* SECCIÓN 3: TABLA DE TRANSACCIONES */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50">
          <h4 className="font-bold text-zinc-700 text-sm">Registro de Órdenes de Pago ({transaccionesFiltradas.length})</h4>
        </div>

        {cargandoTabla ? (
          <div className="p-12 text-center text-zinc-500 text-sm">Cargando transacciones desde la base de datos...</div>
        ) : transaccionesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">No se encontraron transacciones que coincidan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 uppercase text-[11px] tracking-wider border-b border-zinc-200">
                  <th className="p-4 font-semibold">ID Operación</th>
                  <th className="p-4 font-semibold">Estado Local</th>
                  <th className="p-4 font-semibold">Fecha Creación</th>
                  <th className="p-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {transaccionesFiltradas.map((t) => (
                  <tr key={t.idPaymentOperation} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-zinc-600">
                      {t.idPaymentOperation}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        t.status === 'APROBADO' ? 'bg-green-100 text-green-800' :
                        t.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      {new Date(t.createdAt).toLocaleString('es-AR')}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => copiarAlPortapapeles(t.idPaymentOperation)}
                        className="px-3 py-1 text-xs border border-zinc-300 rounded hover:bg-zinc-100 font-medium transition-all relative"
                      >
                        {idCopiado === t.idPaymentOperation ? (
                          <span className="text-green-600 font-bold">¡Copiado!</span>
                        ) : (
                          'Copiar ID'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}