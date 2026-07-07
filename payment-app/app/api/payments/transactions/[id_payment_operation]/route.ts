import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma"; // Verificá que los '../' sean correctos

// Endpoint para que la Seller App u otras apps consulten el estado de una transaccion.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_payment_operation: string }> }
) {
  try {
    // 1. SEGURIDAD SERVER-TO-SERVER (Reemplaza a Clerk)
    const apiKeyRecibida = request.headers.get('x-api-key') || request.headers.get('x_api_key');
    const PAYMENTS_SECRET = process.env.PAYMENTS_API_KEY || ''; 

    if (!apiKeyRecibida || apiKeyRecibida !== PAYMENTS_SECRET) {
      return NextResponse.json(
        {error: "No autorizado. Credenciales de aplicación inválidas."},
        {status: 401} 
      ); 
    }

    // 2. BUSCAMOS LA ORDEN
    const resolvedParams = await params;
    const paymentId = resolvedParams.id_payment_operation;

    if (!paymentId) {
      return NextResponse.json(
        {error: "Falta el ID de la operación de pago en la URL."},
        {status: 400} 
      ); 
    }

    const ordenDePago = await prisma.payment_order.findUnique({
      where: { idPaymentOperation: paymentId },
    });

    if (!ordenDePago) {
      return NextResponse.json(
        {error: "No se encontró la orden de pago con el ID proporcionado."},
        {status: 404} 
      );
    }

    // 3. DEVOLVEMOS EL JSON
    return NextResponse.json({
      id_payment_operation: ordenDePago.idPaymentOperation,
      id_purchase_order: ordenDePago.idPurchaseOrder,
      total_price: Number(ordenDePago.totalPrice), 
      status: ordenDePago.status,
      created_at: ordenDePago.createdAt,
      url: ordenDePago.url // ¡Mantenemos tu excelente agregado!
    }, { status: 200 });

  } catch (error) {
    console.error("Error al buscar la transaccion.", error);
    return NextResponse.json(
      {error: "Error interno del servidor al consultar la transacción."},
      {status: 500} 
    );
  }
}