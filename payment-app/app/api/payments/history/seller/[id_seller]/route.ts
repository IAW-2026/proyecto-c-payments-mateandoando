import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma"; // Ajustá los ../ según necesites

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idVendedor = params.id;

    // Buscamos todas las órdenes donde este usuario sea el vendedor
    const ventas = await prisma.payment_order.findMany({
      where: {
        idSeller: idVendedor,
      },
      orderBy: {
        createdAt: 'desc' // Las ordenamos de más nueva a más vieja
      }
    });

    return NextResponse.json(ventas);
    
  } catch (error: any) {
    console.error("Error al buscar el historial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}