import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  //Este nombre tiene que coincidir con el  parametro dinamico de la URL entre corchetes
  //Promise se utiliza como un await, para que id_payment_operation se resuelva antes de ser usado, ya que viene de la URL y es asincrónico
  { params }: { params: Promise<{ id_payment_operation: string }> }
) {
  try {
    const resolvedParams = await params; // Resolvemos la promesa para obtener los parámetros
    const paymentId = resolvedParams.id_payment_operation;

    if (!paymentId) {
      return NextResponse.json(
        {error: "Falta el ID de la operación de pago en la URL."},
        {status: 400} //Error de parte del cliente
      ); 
    }

    const ordenDePago = await prisma.payment_order.findUnique({
      where: { idPaymentOperation: paymentId },
    });

    if (!ordenDePago) {
      return NextResponse.json(
        {error: "No se encontró la orden de pago con el ID proporcionado."},
        {status: 404} //No encontrado
      );
    }

    return NextResponse.json(ordenDePago, {status: 200});
} catch (error) {
    console.error("Error al buscar la transaccion.", error);
    return NextResponse.json(
      {error: "Error interno del servidor al consultar la transacción."},
      {status: 500} //Error de parte del Servidor
    );
  }
}