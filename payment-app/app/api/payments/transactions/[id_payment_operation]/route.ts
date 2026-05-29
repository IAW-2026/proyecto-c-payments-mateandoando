import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma";
import { auth } from '@clerk/nextjs/server';

//Endpoint para que la Seller App consulte el estado de una transaccion.
export async function GET(
  request: NextRequest,
  //Este nombre tiene que coincidir con el  parametro dinamico de la URL entre corchetes
  //Promise se utiliza como un await, para que id_payment_operation se resuelva antes de ser usado, ya que viene de la URL y es asincrónico
  { params }: { params: Promise<{ id_payment_operation: string }> }
) {
  try {

    //Le preguntamos a Clerk quein es el usuario que esta haciendo la peticion.
    const {userId} = await auth();

    //Si no hay usuario logueado, le cortamos el paso con error 401.
    if (!userId) {
      return NextResponse.json(
        {error: "No autorizado. Debes iniciar sesión para consultar el estado de la transacción."},
        {status: 401} //No autorizado
      ); 
    }

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

    //Devolvemos los campos que se piden en el contrato.
    return NextResponse.json({
      id_payment_operation: ordenDePago.idPaymentOperation,
      id_purchase_order: ordenDePago.idPurchaseOrder,
      total_price: Number(ordenDePago.totalPrice), // Prisma devuelve Decimal, lo pasamos a número
      status: ordenDePago.status,
      created_at: ordenDePago.createdAt
    }, { status: 200 });

} catch (error) {
    console.error("Error al buscar la transaccion.", error);
    return NextResponse.json(
      {error: "Error interno del servidor al consultar la transacción."},
      {status: 500} //Error de parte del Servidor
    );
  }
}