import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Endpoint para que use Mercado Pago cuando un pago fue rechazado y avisara a la Seller App para que pueda tomar las acciones correspondientes.
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id_payment_operation: string }> }
){
    try {
        const resolvedParams = await context.params;
        const paymentId = resolvedParams.id_payment_operation;

        if (!paymentId) {
            return NextResponse.json({
                error: "Falta el ID de la operación de pago."
            }, {status: 400} 
            ); 
        }

        // Actualizamos localmente a CANCELADO en nuestra base de datos
        const pagoCancelado = await prisma.payment_order.update({
            where: { idPaymentOperation: paymentId },
            data: { status: 'CANCELADO' },
        });

        // Usamos las variables unificadas
        const SELLER_APP_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3001';
        const BUYER_APP_URL = process.env.NEXT_PUBLIC_BUYER_URL || 'http://localhost:3002';

        // 1. Avisamos a la Seller App del rechazo del pago (Escenario B del contrato)
        try {
            await fetch(`${SELLER_APP_URL}/api/purchase-orders/${pagoCancelado.idPurchaseOrder}/payment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': process.env.PAYMENTS_API_KEY || '' // ✅ Header unificado
                },
                body: JSON.stringify({
                    status: 'RECHAZADO', // ✅ Contrato pide exactamente "RECHAZADO"
                    id_payment_operation: null, // ✅ Contrato pide null en caso de rechazo
                    payment_hash: null // ✅ Contrato pide null
                })
            });
            console.log("Se le avisó a la Seller App que el pago fue RECHAZADO.");
        } catch (error) {
            console.warn("No se pudo avisar a la Seller App");
        }

        // 2. Avisamos a la Buyer App
        try {
            await fetch(`${BUYER_APP_URL}/api/buyers/payment-notification`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    'X-API-KEY': process.env.BUYER_APP_SECRET_KEY || '' // ✅ Header unificado
                },
                body: JSON.stringify({
                    id_purchase_order: pagoCancelado.idPurchaseOrder, // ✅ Agregado el ID de la orden
                    id_payment_operation: pagoCancelado.idPaymentOperation,
                    status: "RECHAZADO", // ✅ Unificado con el contrato
                    payment_hash: null // ✅ Al ser rechazado, no hay hash
                }),
            });
            console.log("Se le avisó a la Buyer App que el pago fue RECHAZADO.");
        } catch (error) {
            console.warn("La Buyer App no respondió, pero el pago se canceló localmente.");
        }

        // Formateamos la respuesta según el contrato para el Webhook
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