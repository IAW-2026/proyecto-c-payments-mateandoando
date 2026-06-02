import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import { prisma } from "../../../lib/prisma";
import {MercadoPagoConfig, Preference} from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

interface CreatePaymentRequest {
  id_purchase_order: string;
  id_buyer: string;
  total_price: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePaymentRequest;
    const {id_purchase_order, id_buyer, total_price} = body;
    
    if (!id_purchase_order || !id_buyer || !total_price) {
      return NextResponse.json(
        {error: "Faltan campos obligatorios en el body"},
        {status: 400}
      )
    }

    const preference = new Preference(client);
    const mpResponse = await preference.create({
      body: {
        items: [
          {
            id: id_purchase_order,
            title: 'Orden de compra de la tienda',
            quantity: 1,
            unit_price: Number(total_price),
            currency_id: 'ARS',
          }
        ],
        back_urls: {
          success: "https://proyecto-c-payments-mateandoando.vercel.app/success",
          failure: "https://proyecto-c-payments-mateandoando.vercel.app/failure",
          pending: "https://proyecto-c-payments-mateandoando.vercel.app/pending"
        },
        auto_return: "approved"
      }
    });

    const nuevoPago = await prisma.payment_order.create({
      data: {
        idPurchaseOrder: id_purchase_order,
        idBuyer: id_buyer,
        totalPrice: total_price,
        status: "PENDIENTE",
        idSeller: crypto.randomUUID(),
        idSellerApp: crypto.randomUUID(),
        idBuyerApp: crypto.randomUUID(),
        url: mpResponse.init_point // ← AGREGÁ ESTO AL ANTERIOR
      }
    });

    return NextResponse.json(
      {id_payment_operation: nuevoPago.idPaymentOperation, 
      checkout_url: mpResponse.init_point},
      {status:201}
    )

  }catch(error: any) {
    console.error("Error completo de MP:", error.cause || error);
    
    return NextResponse.json(
      {error: "Error interno del servidor al generar el pago"},
      {status: 500}
    );
  }
}