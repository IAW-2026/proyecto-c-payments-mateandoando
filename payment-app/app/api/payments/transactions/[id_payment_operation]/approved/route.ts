import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

//Endpoint para que use Mercado Pago cuando un pago fue aprobado y este mismo utilizara los endpoints provistos por Seller App y Buyer App
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id_payment_operation: string }> }
) {
    try {
        const resolvedParams = await context.params;
        const paymentId = resolvedParams.id_payment_operation;

        if (!paymentId) {
            return NextResponse.json(
                {error: "Falta el ID de la operación de pago."},
                {status: 400} //Error de parte del cliente
            ); 
        }

        //Actualizamos el estado a "APROBADO"
        const pagoAprobado = await prisma.payment_order.update({
            where: {idPaymentOperation: paymentId},
            data: {status: "APROBADO"} //Se usa el valor del enum
        });

        //Usamos las variables de entorno correctas apuntando a los Vercel
        const SELLER_APP_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3001';
        const BUYER_APP_URL = process.env.NEXT_PUBLIC_BUYER_URL || 'http://localhost:3002';

        //Avisamos a la Seller App
        try {
            await fetch(`${SELLER_APP_URL}/api/purchase-orders/${pagoAprobado.idPurchaseOrder}/payment`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    'X-API-KEY': process.env.PAYMENTS_API_KEY || ''
                },
                body: JSON.stringify({
                    status: "APROBADO", //Corregido según contrato
                    id_payment_operation: pagoAprobado.idPaymentOperation,
                    payment_hash: pagoAprobado.paymentHash || "hash_generado_proximamente"
                }),
            });
            console.log("¡Éxito! Se le avisó a la Seller App que el pago está aprobado.");
        } catch (error) {
            console.warn("La Seller App no respondio, pero el pago se aprobó localmente.");
        }

        // 2. Avisamos a la Buyer App
        try {
            await fetch(`${BUYER_APP_URL}/api/buyers/payment-notification`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    'X-API-KEY': process.env.BUYER_APP_SECRET_KEY || ''
                },
                body: JSON.stringify({
                    id_purchase_order: pagoAprobado.idPurchaseOrder, //Agregado según contrato
                    status: "APROBADO",
                    id_payment_operation: pagoAprobado.idPaymentOperation,
                    payment_hash: pagoAprobado.paymentHash || "hash_generado_proximamente"
                }),
            });
            console.log("¡Éxito! Se le avisó a la Buyer App que el pago está aprobado.");
        } catch (error) {
            console.warn("La Buyer App no respondio, pero el pago se aprobó localmente.");
        }

        return NextResponse.json(pagoAprobado, {status: 200});
        
    } catch (error: any) {
        console.error("Error al aprobar la transaccion.", error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                {error: "No se encontró la orden de pago con el ID proporcionado."},
                {status: 404} //No encontrado
            );
        }

        return NextResponse.json(
            {error: "Error interno del servidor al aprobar la transacción."},
            {status: 500} //Error de parte del Servidor
        );
    }
}