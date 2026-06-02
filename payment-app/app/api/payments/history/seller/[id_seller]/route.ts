import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma"; // Ajustá los ../ según necesites

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_seller: string }> }
) {
  try {
    const {id_seller} = await params;


    // Buscamos todas las órdenes donde este usuario sea el vendedor
    const ventas = await prisma.payment_order.findMany({
      where: {
        idSeller: id_seller,
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