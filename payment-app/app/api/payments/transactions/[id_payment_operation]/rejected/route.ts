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
        const BUYER_APP_URL = process.env.BUYER_APP_URL || 'http://localhost:3002';

        try{
            await fetch(`${SELLER_APP_URL}/api/purchase-orders/${pagoCancelado.idPurchaseOrder}/payment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    //En esta linea se define una SECRET_KEY que se usa para identificar que fue la Seller App quien hizo la petición, para evitar que terceros puedan hacer peticiones a este endpoint. En un caso real, esta clave debería ser más segura y no estar hardcodeada.
                    'X_API_key': process.env.SECRET_KEY_SELLER_APP || ''
                },
                body: JSON.stringify({
                    status: 'CANCELADA',
                    id_payment_operation: pagoCancelado.idPaymentOperation,
                    payment_hash: null
                })
            });
        } catch (error) {
            console.warn("No se pudo avisar a la Seller App");
        }

        try{
            await fetch(`${BUYER_APP_URL}/api/buyers/payment-notification`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    'X_API_key': process.env.SECRET_KEY_BUYER_APP || ''
                },
                body: JSON.stringify({
                    status: "SUSPENDIDO",
                    id_payment_operation: pagoCancelado.idPaymentOperation,
                    // Si el hash todavía es null, mandamos un texto temporal por ahora
                    payment_hash: pagoCancelado.paymentHash || "hash_generado_proximamente"
                }),
            });
            console.log("¡Éxito! Se le avisó a la Buyer App que el pago está aprobado.");
        } catch (error) {
            console.warn("La Buyer App no respondio, pero el pago se aprobó localmente.");
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