import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";

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

    //Usamos el metodo update de Prisma para cambiar el estado a "CANCELADO"
    const pagoCancelado = await prisma.payment_order.update({
      where: {idPaymentOperation: paymentId},
      data: {status: "CANCELADO"} //Se usa el valor del enum
    });

    //Devolvemos la transaccion actualizada
    return NextResponse.json(pagoCancelado, {status: 200});
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