import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; 

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idBuyer = searchParams.get('idBuyer');

    if (!idBuyer) {
      return NextResponse.json({ error: "Falta idBuyer" }, { status: 400 });
    }

    const ordenPendiente = await prisma.payment_order.findFirst({
      where: {
        idBuyer: idBuyer,
        status: "PENDIENTE" 
      },
      orderBy: {
        createdAt: 'desc' 
      }
    });

    if (!ordenPendiente) {
      return NextResponse.json({ error: "Sin ordenes pendientes" }, { status: 404 });
    }

    return NextResponse.json(ordenPendiente, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}