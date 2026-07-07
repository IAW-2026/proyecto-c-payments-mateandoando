import { NextResponse } from 'next/server';
import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Función REAL que consulta a la API de Mercado Pago
async function consultarMercadoPago(idPagoMercadoPago: string): Promise<PaymentStatus | null> {
  try {
    // Reemplazarías esto por tu variable de entorno real: process.env.MP_ACCESS_TOKEN
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

    // Hacemos el request GET al endpoint de Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${idPagoMercadoPago}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Error consultando MP para el pago ${idPagoMercadoPago}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Mercado Pago devuelve el estado en inglés. Lo mapeamos a tus enums.
    if (data.status === 'approved') return PaymentStatus.APROBADO;
    if (data.status === 'cancelled' || data.status === 'rejected') return PaymentStatus.CANCELADO;
    if (data.status === 'refunded') return PaymentStatus.REEMBOLSADO;
    
    // Si sigue 'pending' o 'in_process', devolvemos null para no hacer nada
    return null; 
    
  } catch (error) {
    console.error('Fallo en la red al contactar a Mercado Pago:', error);
    return null;
  }
}

export async function POST() {
  console.log('🔍 [SYNC] Iniciando sincronización de pagos vencidos...');

  try {
    // 1. Calculamos exactamente qué hora era hace 24 horas
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);

    // 2. Buscamos en Prisma solo los PENDIENTES que tengan MÁS de 1 día de antigüedad
    const pagosPendientes = await prisma.payment_order.findMany({
      where: { 
        status: PaymentStatus.PENDIENTE,
        createdAt: {
          lt: hace24Horas // "less than" hace 24 horas
        }
      }
    });

    if (pagosPendientes.length === 0) {
      return NextResponse.json({ message: 'No hay pagos con más de 24hs de antigüedad para sincronizar', actualizados: 0 });
    }

    let actualizados = 0;

    for (const pago of pagosPendientes) {
      // OJO ACÁ: A Mercado Pago tenés que mandarle el ID que ellos te generaron cuando se creó la preferencia, 
      // no tu UUID de base de datos. Asumimos que lo guardaste en el paymentHash.
      const idDeMP = pago.paymentHash; 
      
      if (!idDeMP) continue; // Si por algún motivo no tenemos el ID de MP, lo saltamos

      const estadoReal = await consultarMercadoPago(idDeMP);

      if (estadoReal && estadoReal !== PaymentStatus.PENDIENTE) {
        // 3. Si Mercado Pago nos confirma un estado final, lo grabamos en la base
        await prisma.payment_order.update({
          where: { idPaymentOperation: pago.idPaymentOperation },
          data: { status: estadoReal, updatedAt: new Date() }
        });
        actualizados++;
        console.log(`🔄 [CRON] Pago ${pago.idPaymentOperation.substring(0,8)} actualizado a ${estadoReal} vía Mercado Pago`);
      } else if (!estadoReal) {
        // 4. LÓGICA DE CANCELACIÓN: 
        // Si Mercado Pago sigue diciendo que está pendiente después de 24hs, 
        // tu sistema de e-commerce asume que el cliente abandonó y lo cancela localmente
        // para liberar el stock de la Seller App.
        await prisma.payment_order.update({
          where: { idPaymentOperation: pago.idPaymentOperation },
          data: { status: PaymentStatus.CANCELADO, updatedAt: new Date() }
        });
        actualizados++;
        console.log(`❌ [CRON] Pago ${pago.idPaymentOperation.substring(0,8)} expiró por tiempo y fue CANCELADO localmente.`);
      }
    }

    return NextResponse.json({ 
      message: 'Sincronización con Mercado Pago completada', 
      revisados: pagosPendientes.length,
      actualizados: actualizados 
    });

  } catch (error) {
    console.error('❌ Error general en sincronización:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return POST();
}