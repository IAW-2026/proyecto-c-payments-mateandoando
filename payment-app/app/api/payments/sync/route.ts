import { NextResponse } from 'next/server';
// 1. Volvemos a importar PaymentStatus para que TypeScript esté feliz
import { PaymentStatus } from '@prisma/client';
import { prisma } from '../../../lib/prisma'; 

export const dynamic = 'force-dynamic';

// 2. Le decimos explícitamente que devuelve un PaymentStatus
async function buscarPorIdLocal(idPaymentOperation: string): Promise<{ status: PaymentStatus | null; mpId: string | null }> {
  try {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

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

    if (!data.results || data.results.length === 0) {
      return { status: null, mpId: null };
    }

    const pagoMercadoPago = data.results[0];
    const mpStatus = pagoMercadoPago.status;
    const mpId = pagoMercadoPago.id.toString();

    // 3. Usamos el Enum oficial en vez de strings
    if (mpStatus === 'approved') return { status: PaymentStatus.APROBADO, mpId };
    if (mpStatus === 'cancelled' || mpStatus === 'rejected') return { status: PaymentStatus.CANCELADO, mpId };
    if (mpStatus === 'refunded') return { status: PaymentStatus.REEMBOLSADO, mpId };

    return { status: null, mpId: null }; 

  } catch (error) {
    console.error('Error de red al buscar en Mercado Pago:', error);
    return { status: null, mpId: null };
  }
}

async function ejecutarAuditoria(filtrarPorFecha: boolean) {
  // 4. Usamos PaymentStatus.PENDIENTE para buscar
  let condicionWhere: any = { status: PaymentStatus.PENDIENTE };

  if (filtrarPorFecha) {
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);
    condicionWhere.createdAt = { lt: hace24Horas };
  }

  const conteoTotal = await prisma.payment_order.count();
  console.log(`📊 [DIAGNÓSTICO] Filas totales en la tabla payment_order: ${conteoTotal}`);

  const pagosPendientes = await prisma.payment_order.findMany({
    where: condicionWhere
  });

  console.log(`🔎 [DIAGNÓSTICO] Órdenes que entraron al filtro como PENDIENTE: ${pagosPendientes.length}`);

  let actualizados = 0;

  for (const pago of pagosPendientes) {
    console.log(`📋 Procesando orden local: ${pago.idPaymentOperation}`);
    const { status: estadoReal, mpId } = await buscarPorIdLocal(pago.idPaymentOperation);

    if (estadoReal) {
      await prisma.payment_order.update({
        where: { idPaymentOperation: pago.idPaymentOperation },
        data: { 
          status: estadoReal,
          //paymentHash: mpId, 
          updatedAt: new Date() 
        }
      });
      actualizados++;
      console.log(`   ✅ Cambiada a ${estadoReal}`);
    } else {
      await prisma.payment_order.update({
        where: { idPaymentOperation: pago.idPaymentOperation },
        data: { 
          status: PaymentStatus.CANCELADO, // Usamos el Enum para cancelar
          updatedAt: new Date() 
        }
      });
      actualizados++;
      console.log(`   ❌ No encontrada en MP, cambiada a CANCELADO`);
    }
  }

  return {
    revisados: pagosPendientes.length,
    actualizados: actualizados
  };
}

export async function POST() {
  console.log('🔍 [BOTÓN ADMIN] Iniciando auditoría manual total...');
  try {
    const resultado = await ejecutarAuditoria(false); 
    return NextResponse.json({ 
      message: 'Auditoría manual completada con éxito', 
      ...resultado
    });
  } catch (error) {
    console.error('❌ Error crítico en auditoría manual:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  console.log('⏰ [CRON JOB] Iniciando barrido automático (24hs)...');
  try {
    const resultado = await ejecutarAuditoria(true); 
    return NextResponse.json({ 
      message: 'Sincronización programada completada con éxito', 
      ...resultado
    });
  } catch (error) {
    console.error('❌ Error crítico en cron automático:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}