import { NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
// Importamos la conexión de Prisma que ya tenés instanciada, sin crear una nueva
import { prisma } from '../../../lib/prisma'; 

// Función que busca el pago en Mercado Pago usando TU ID local (external_reference)
async function buscarPorIdLocal(idPaymentOperation: string): Promise<{ status: PaymentStatus | null; mpId: string | null }> {
  try {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

    // Usamos el endpoint de búsqueda (search) filtrando por external_reference
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${idPaymentOperation}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Error en API de búsqueda para ${idPaymentOperation}: ${response.statusText}`);
      return { status: null, mpId: null };
    }

    const data = await response.json();

    // Si "results" está vacío, significa que el cliente jamás interactuó con la pasarela de pago
    if (!data.results || data.results.length === 0) {
      return { status: null, mpId: null };
    }

    // Si hay resultados, agarramos el pago más reciente
    const pagoMercadoPago = data.results[0];
    const mpStatus = pagoMercadoPago.status;
    const mpId = pagoMercadoPago.id.toString(); // El ID numérico real de MP

    if (mpStatus === 'approved') return { status: PaymentStatus.APROBADO, mpId };
    if (mpStatus === 'cancelled' || mpStatus === 'rejected') return { status: PaymentStatus.CANCELADO, mpId };
    if (mpStatus === 'refunded') return { status: PaymentStatus.REEMBOLSADO, mpId };

    return { status: null, mpId: null }; 

  } catch (error) {
    console.error('Error de red al buscar en Mercado Pago:', error);
    return { status: null, mpId: null };
  }
}

export async function POST() {
  console.log('🔍 [AUDITORÍA V2] Iniciando barrido por ID Local (external_reference)...');

  try {
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);

    // 1. Buscamos en Prisma todos los PENDIENTES de más de 24 horas
    const pagosPendientes = await prisma.payment_order.findMany({
      where: { 
        status: PaymentStatus.PENDIENTE,
        createdAt: { lt: hace24Horas }
      }
    });

    if (pagosPendientes.length === 0) {
      return NextResponse.json({ message: 'No hay pagos con más de 24hs para sincronizar', actualizados: 0 });
    }

    console.log(`📊 Se encontraron ${pagosPendientes.length} órdenes viejas para auditar.`);
    let actualizados = 0;

    for (const pago of pagosPendientes) {
      console.log(`📋 Auditando ID de Operación Local: ${pago.idPaymentOperation}`);

      // 2. Le preguntamos a MP usando tu ID local en lugar del hash
      const { status: estadoReal, mpId } = await buscarPorIdLocal(pago.idPaymentOperation);

      if (estadoReal) {
        // Caso A: Lo encontró en Mercado Pago. 
        // Actualizamos estado y GUARDAMOS el paymentHash que antes era null.
        await prisma.payment_order.update({
          where: { idPaymentOperation: pago.idPaymentOperation },
          data: { 
            status: estadoReal, 
            paymentHash: mpId, 
            updatedAt: new Date() 
          }
        });
        actualizados++;
        console.log(`✅ Sincronizado automáticamente a ${estadoReal} (Hash MP guardado: ${mpId})`);
      } else {
        // Caso B: Si dio null, no hay registro en MP tras 24hs (carrito abandonado).
        // Lo cancelamos para limpiar la base de datos.
        await prisma.payment_order.update({
          where: { idPaymentOperation: pago.idPaymentOperation },
          data: { 
            status: PaymentStatus.CANCELADO, 
            updatedAt: new Date() 
          }
        });
        actualizados++;
        console.log(`❌ Sin movimientos en MP. Orden expirada pasada a CANCELADO.`);
      }
    }

    return NextResponse.json({ 
      message: 'Auditoría por ID local completada', 
      revisados: pagosPendientes.length,
      actualizados: actualizados 
    });

  } catch (error) {
    console.error('❌ Error crítico en la auditoría:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}