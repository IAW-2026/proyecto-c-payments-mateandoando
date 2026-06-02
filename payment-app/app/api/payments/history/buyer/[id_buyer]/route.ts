import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idComprador = params.id;

    // Buscamos todas las órdenes donde este usuario sea el COMPRADOR
    const compras = await prisma.payment_order.findMany({
      where: {
        idBuyer: idComprador,
      },
      orderBy: {
        createdAt: 'desc' // Ordenamos para que las más nuevas salgan arriba
      }
    });

    return NextResponse.json(compras);
    
  } catch (error: any) {
    console.error("Error al buscar el historial del comprador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}