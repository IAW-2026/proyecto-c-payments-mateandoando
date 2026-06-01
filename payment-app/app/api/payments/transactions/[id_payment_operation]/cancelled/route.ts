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

    //Buscamos la orden primero para saber cuál es el idPurchaseOrder
    const ordenActual = await prisma.payment_order.findUnique({
      where: { idPaymentOperation: paymentId },
    });

    if (!ordenActual) {
      return NextResponse.json(
        {error: "No se encontró la orden de pago con el ID proporcionado."},
        {status: 404} //No encontrado
      );
    }

    //Le preguntamos a la Seller App si podems reembolsar.
    const SELLER_APP_URL = process.env.SELLER_APP_URL || 'http://localhost:3001';

    try{
      const sellerResponse = await fetch(`${SELLER_APP_URL}/api/seller/orders/${ordenActual.idPurchaseOrder}/refund`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'X-API-KEY': process.env.SELLER_APP_API_KEY || ''
        },
        //Sin body porque la Seller App solo necesita el id de la orden para hacer el reembolso
      });

      const sellerData = await sellerResponse.json();

      //Escenario B: Si la Seller App responde con un error significa que no se puede reembolsar.
      if (!sellerResponse.ok || sellerData.error) {
        return NextResponse.json(
          {error: sellerData.error || "Error al procesar el reembolso en la Seller App."},
          {status: 502} //Bad Gateway, porque el error viene de la Seller App
        );
      }

      //Escenario A: Si se llega aca significa que no hay problemas para reembolsar.
      console.log("Exito al realizar el reembolso.");
    } catch (error) {
      console.error("Error de comunicación con la Seller App.", error);
      return NextResponse.json(
        {error: "Error interno: No se pudo validar el estado del paquete con el vendedor."},
        {status: 500} //Error de parte del Servidorr
      );
    }

    //Como la Seller App no devolvio error, ahora actualizamos prisma.
    const pagoReembolsado = await prisma.payment_order.update({
      where: { idPaymentOperation: paymentId },
      data: { status: "REEMBOLSADO" },
    });

    //Devolvemos la transaccion actualizada a la Buyer App
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