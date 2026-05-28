import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

//Endpoint para que use Mercado Pago cuando un pago fue rechazado y avisara a la Seller App para que pueda tomar las acciones correspondientes.
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id_payment_operation: string }> }
){
    try{
        const resolvedParams = await context.params;
        const paymentId = resolvedParams.id_payment_operation;

        if (!paymentId) {
            return NextResponse.json({
                error: "Falta el ID de la operación de pago."
            }, {status: 400} //Error de parte del cliente
            ); 
        };

        const pagoCancelado = await prisma.payment_order.update({
            where: { idPaymentOperation: paymentId },
            data: { status: 'CANCELADO' },
        });

        //Le avisamos a la Seller App del rechazo del pago, para que pueda actuar en consecuencia.
        const SELLER_APP_URL = process.env.SELLER_APP_URL || 'http://localhost:3001';

        try{
            await fetch(`${SELLER_APP_URL}/api/purchase-orders/${pagoCancelado.idPurchaseOrder}/payment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    //En esta linea se define una SECRET_KEY que se usa para identificar que fue la Seller App quien hizo la petición, para evitar que terceros puedan hacer peticiones a este endpoint. En un caso real, esta clave debería ser más segura y no estar hardcodeada.
                    'sk_srvc_pagos_secreto_123': process.env.SECRET_KEY_SELLER_APP || 'sk_srvc_pagos_secreto_123'
                },
                body: JSON.stringify({
                    status: 'RECHAZADA',
                    id_payment_operation: pagoCancelado.idPaymentOperation,
                    payment_hash: null
                })
            });
        } catch (error) {
            console.warn("No se pudo avisar a la Seller App");
        }

        //Formateamos la respuesta segun el contrato
        return NextResponse.json({
            id_payment_operation: pagoCancelado.idPaymentOperation,
            status: pagoCancelado.status,
            updated_at: pagoCancelado.updatedAt
        }, {status: 200});
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "No encontrado" }, { status: 404 });
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}