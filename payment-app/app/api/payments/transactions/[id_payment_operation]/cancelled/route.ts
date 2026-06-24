import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";

//Endpoint para que la Buyer App cancele una transaccion de pago, cambiando su estado a "REEMBOLSADO".
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id_payment_operation: string }> }
) {
  try {
    // --- NUEVA BARRERA DE SEGURIDAD ---
    const apiKeyRecibida = request.headers.get('x-api-key') || request.headers.get('x_api_key');
    const BUYER_APP_SECRET = process.env.BUYER_APP_SECRET_KEY || ''; 

    if (!apiKeyRecibida || apiKeyRecibida !== BUYER_APP_SECRET) {
        return NextResponse.json(
            { error: "Acceso denegado. Credenciales inválidas." },
            { status: 401 } 
        );
    }

    //Extraemos el ID de la URL 
    const resolvedParams = await context.params;
    const paymentId = resolvedParams.id_payment_operation;

    if (!paymentId) {
      return NextResponse.json(
        {error: "Falta el ID de la operación de pago."},
        {status: 400} 
      ); 
    }

    //Leemos el Body que nos manda la Buyer App
    const body = await request.json();

    if (body.status !== "CANCELADO") {
      return NextResponse.json(
        {error: "El estado enviado no es valido para esta operacion."},
        {status: 400} 
      )
    }

    //Buscamos la orden primero
    const ordenActual = await prisma.payment_order.findUnique({
      where: { idPaymentOperation: paymentId },
    });

    if (!ordenActual) {
      return NextResponse.json(
        {error: "No se encontró la orden de pago con el ID proporcionado."},
        {status: 404} 
      );
    }

    //Le preguntamos a la Seller App si podems reembolsar.
    const SELLER_APP_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3001';

    try {
      const sellerResponse = await fetch(`${SELLER_APP_URL}/api/purchase-orders/${ordenActual.idPurchaseOrder}/refund`, {
        method: 'PATCH', 
        headers: {
          "Content-Type": "application/json",
          'X-API-KEY': process.env.SELLER_APP_SECRET_KEY || ''
        },
      });

      const sellerData = await sellerResponse.json();

      //Escenario B: Rechazo
      if (!sellerResponse.ok || sellerData.error) {
        return NextResponse.json(
          {
            error: sellerData.error || "Error al procesar el reembolso en la Seller App.",
            codigo: sellerData.codigo || "ERROR_DESCONOCIDO" 
          },
          {status: 400} 
        );
      }
      
    } catch (error) {
      console.error("Error de comunicación con la Seller App.", error);
      return NextResponse.json(
        {error: "Error interno: No se pudo validar el estado del paquete con el vendedor."},
        {status: 500} 
      );
    }

    //Actualizamos prisma.
    const pagoReembolsado = await prisma.payment_order.update({
      where: { idPaymentOperation: paymentId },
      data: { status: "REEMBOLSADO" },
    });

    return NextResponse.json({
      id_payment_operation: pagoReembolsado.idPaymentOperation,
      status: pagoReembolsado.status,
      updated_at: pagoReembolsado.updatedAt
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error al cancelar la transaccion.", error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {error: "No se encontró la orden de pago con el ID proporcionado."},
        {status: 404} 
      );
    }

    return NextResponse.json(
      {error: "Error interno del servidor al cancelar la transacción."},
      {status: 500} 
    );
  }
}