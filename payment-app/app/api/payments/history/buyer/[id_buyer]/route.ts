import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_buyer: string }> }
) {
  try {
    //Verificamos que quien llama sea la Buyer App
    const apiKeyRecibida = request.headers.get('x-api-key') || request.headers.get('x_api_key');
    const claveSecreta = process.env.BUYER_APP_SECRET_KEY || '';

    if (!apiKeyRecibida || apiKeyRecibida !== claveSecreta) {
      return NextResponse.json(
        { error: "Acceso denegado. Credenciales de aplicación inválidas." },
        { status: 401 } // 401: Unauthorized
      );
    }

    //Extraemos el parámetro de la URL
    const {id_buyer} = await params;

    //Buscamos todas las órdenes donde este usuario sea el comprador
    const compras = await prisma.payment_order.findMany({
      where: {
        idBuyer: id_buyer,
      },
      orderBy: {
        createdAt: 'desc' //Ordenamos para que las más nuevas salgan arriba
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