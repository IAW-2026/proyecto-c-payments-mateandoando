import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

//Endpoint para que use Mercado Pago cuando un pago fue aprobado y este mismo utilizara los endpoints provistos por Seller App y Buyer App
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

        //Actualizamos el estado a "APROBADO"
        const pagoAprobado = await prisma.payment_order.update({
            where: {idPaymentOperation: paymentId},
            data: {status: "APROBADO"} //Se usa el valor del enum
        });

        //Avisamos a la Seller App que el pago fue aprobado, para que pueda avanzar.
        const SELLER_APP_URL = process.env.SELLER_APP_URL || 'http://localhost:3001';
        const BUYER_APP_URL = process.env.BUYER_APP_URL || 'http://localhost:3002';

        try{
            await fetch(`${SELLER_APP_URL}/api/purchase-orders/${pagoAprobado.idPurchaseOrder}/payment`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    //En esta linea se define una SECRET_KEY que se usa para identificar que fue la Seller App quien hizo la petición, para evitar que terceros puedan hacer peticiones a este endpoint. En un caso real, esta clave debería ser más segura y no estar hardcodeada.
                    'sk_srvc_pagos_secreto_123': process.env.SECRET_KEY_SELLER_APP || 'sk_srvc_pagos_secreto_123'
                },
                body: JSON.stringify({
                    status: "PAGADA",
                    id_payment_operation: pagoAprobado.idPaymentOperation,
                    // Si el hash todavía es null, mandamos un texto temporal por ahora
                    payment_hash: pagoAprobado.paymentHash || "hash_generado_proximamente"
                }),
            });
            console.log("¡Éxito! Se le avisó a la Seller App que el pago está aprobado.");
        } catch (error) {
            console.warn("La Seller App no respondio, pero el pago se aprobó localmente.");
        }

        try{
            await fetch(`${BUYER_APP_URL}/api/buyers/payment-notification`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "APROBADO",
                    id_payment_operation: pagoAprobado.idPaymentOperation,
                    // Si el hash todavía es null, mandamos un texto temporal por ahora
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