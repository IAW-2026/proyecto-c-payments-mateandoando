import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id_payment_operation: string }> }
) {
    try{
        const resolvedParams = await context.params;
        const paymentId = resolvedParams.id_payment_operation;

        if (!paymentId) {
            return NextResponse.json(
                {error: "Falta el ID de la operación de pago."},
                {status: 400} //Error de parte del cliente
            ); 
        }

        //Actualizamos el estado a "REEMBOLSADO"
        const pagoReembolsado = await prisma.payment_order.update({
            where: {idPaymentOperation: paymentId},
            data: {status: "REEMBOLSADO"} //Se usa el valor del enum
        });

        return NextResponse.json(pagoReembolsado, {status: 200});
    } catch (error: any) {
        console.error("Error al reembolsar la transaccion.", error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                {error: "No se encontró la orden de pago con el ID proporcionado."},
                {status: 404} //No encontrado
            );
        }

        return NextResponse.json(
            {error: "Error interno del servidor al reembolsar la transacción."},
            {status: 500} //Error de parte del Servidor
        );
    }
}