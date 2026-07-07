import { NextResponse } from 'next/server';
// Importamos tu instancia de Prisma que ya está configurada correctamente
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    const transacciones = await prisma.payment_order.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(transacciones);
  } catch (error) {
    console.error('Error real en la base de datos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}