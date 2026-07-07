import { PrismaClient, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Cargamos la URL de tu .env y configuramos el adaptador de Postgres/Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Ejecutando Algoritmo Determinista para Payments App (Marzo - Junio 2026)...');

  const operacionesHistoricas = [];
  
  // Generamos exactamente 60 transacciones (15 por mes)
  for (let i = 1; i <= 60; i++) {
    // 1. Generación de IDs idénticos para las 4 apps (Formato UUID)
    const hexI = i.toString(16).padStart(12, '0');
    const idPaymentOperation = `a0000000-0000-0000-0000-${hexI}`;
    const idPurchaseOrder    = `b0000000-0000-0000-0000-${hexI}`;
    const paymentHash        = `c0000000-0000-0000-0000-${hexI}`;
    
    // 2. Lógica de Compradores (30 compradores distintos, repiten exactamente 2 veces c/u)
    const buyerIndex = (i % 30) + 1; 
    const idBuyer = `user_buyer_0000000000000000000_${buyerIndex.toString().padStart(2, '0')}`;

    // 3. Cálculos de Precios (Iguales en todos los módulos)
    const itemIndex = (i % 10) + 1; // 10 productos distintos
    const basePrice = 10000 + (itemIndex * 5000); // Precios entre 15k y 60k
    const shippingCost = 1500 + ((i % 3) * 500); // Envíos de 1500, 2000 o 2500
    const totalPrice = basePrice + shippingCost;

    // 4. Distribución Realista de Estados
    let status: PaymentStatus = PaymentStatus.APROBADO;
    if (i % 7 === 0) status = PaymentStatus.CANCELADO; // ~14% abandona en el checkout
    else if (i % 11 === 0) status = PaymentStatus.REEMBOLSADO; // ~9% pide devolución
    else if (i % 13 === 0) status = PaymentStatus.PENDIENTE; // ~7% deja el pago colgado

    // 5. Distribución Temporal (15 compras por mes, desde Marzo a Junio)
    const monthOffset = Math.floor((i - 1) / 15); // 0=Marzo, 1=Abril, 2=Mayo, 3=Junio
    const day = 1 + (i % 27); // Días repartidos orgánicamente del 1 al 28
    const hora = 9 + (i % 12); // Horario comercial (9hs a 20hs)
    const minuto = (i * 7) % 60;
    
    // Meses en JS son 0-indexed (2 = Marzo)
    const createdAt = new Date(Date.UTC(2026, 2 + monthOffset, day, hora, minuto, 0));
    
    // Si fue aprobado o reembolsado, se actualizó 4 minutos después
    const updatedAt = (status === PaymentStatus.APROBADO || status === PaymentStatus.REEMBOLSADO)
      ? new Date(createdAt.getTime() + 4 * 60 * 1000) 
      : createdAt;

    operacionesHistoricas.push({
      idPaymentOperation,
      idPurchaseOrder,
      idBuyer,
      totalPrice,
      status,
      url: `https://checkout.pasarelainterna.com/pay/${idPaymentOperation.substring(0,8)}`,
      paymentHash: (status === PaymentStatus.APROBADO || status === PaymentStatus.REEMBOLSADO) ? paymentHash : null,
      createdAt,
      updatedAt
    });
  }

  console.log(` ⌛ Guardando ${operacionesHistoricas.length} órdenes financieras en tu base de datos...`);

  // Inserción segura con upsert para evitar duplicados si lo corrés 2 veces
  for (const op of operacionesHistoricas) {
    await prisma.payment_order.upsert({
      where: { idPaymentOperation: op.idPaymentOperation },
      update: {
        status: op.status,
        totalPrice: op.totalPrice,
        updatedAt: op.updatedAt
      },
      create: op
    });
  }

  console.log('✅ ¡Seeding de la Payments App finalizado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error al inyectar los datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });