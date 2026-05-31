import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";

//Endpoint para que la Buyer App cancele una transaccion de pago, cambiando su estado a "REEMBOLSADO".
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id_payment_operation: string }> }
) {
  try {
    //Extraemos el ID de la URL 
    const resolvedParams = await context.params;
    const paymentId = resolvedParams.id_payment_operation;

    if (!paymentId) {
      return NextResponse.json(
        {error: "Falta el ID de la operación de pago."},
        {status: 400} //Error de parte del cliente
      ); 
    }

    //Leemos el Body que nos manda la Buyer App
    const body = await request.json();

    if (body.status !== "CANCELADO") {
      return NextResponse.json(
        {error: "El estado enviado no es valido para esta operacion."}
      )
    }

    //Usamos el metodo update de Prisma para cambiar el estado a "CANCELADO"
    const pagoReembolsado = await prisma.payment_order.update({
      where: {idPaymentOperation: paymentId},
      data: {status: "REEMBOLSADO"} //Se usa el valor del enum, pasamos a REEMBOLSADO automaticamente
    });

    //Le avisamos a la Seller App y a la Buyer App que el pago fue cancelado, para que puedan actuar en consecuencia.
    const SELLER_APP_URL = process.env.SELLER_APP_URL || 'http://localhost:3001';
    //const BUYER_APP_URL = process.env.BUYER_APP_URL || 'http://localhost:3002';

    try{
        //Usamos el ID de la orden de compra que recuperamos de la base de datos
        await fetch(`${SELLER_APP_URL}/api/purchase-orders/${pagoReembolsado.idPurchaseOrder}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'X_API_key': process.env.SECRET_KEY_SELLER_APP || ''
        },
        body: JSON.stringify({
          status: "REEMBOLSADO",
          id_payment_operation: pagoReembolsado.idPaymentOperation,
          payment_hash: pagoReembolsado.paymentHash || "reembolso_sin_hash"
        }),
      });
      console.log("¡Éxito! Se le avisó a la Seller App que el pago está reembolsado.");
    } catch (error) {
      console.warn("La Seller App no respondio, pero el pago se reembolsó localmente.");
    }

    //Devolvemos la transaccion actualizada
    return NextResponse.json({
      id_payment_operation: pagoReembolsado.idPaymentOperation,
      status: pagoReembolsado.status,
      updated_at: pagoReembolsado.updatedAt
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error al cancelar la transaccion.", error);

    //Si Prisma no encuentra el ID, tira el codigo de error especifico P2025
    if (error.code === 'P2025') {
      return NextResponse.json(
        {error: "No se encontró la orden de pago con el ID proporcionado."},
        {status: 404} //No encontrado
      );
    }

    return NextResponse.json(
      {error: "Error interno del servidor al cancelar la transacción."},
      {status: 500} //Error de parte del Servidor
    );
  }
}