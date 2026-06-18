import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import { prisma } from "../../../lib/prisma";
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

// 1. Agregamos la estructura de paquetes para que coincida con lo que manda la Buyer App
interface PackageItem {
  id_package: string;
  id_seller: string;
  amount: number;
}

interface CreatePaymentRequest {
  id_purchase_order: string;
  id_buyer: string;
  total_price: number;
  packages: PackageItem[]; // La Buyer App lo manda, nosotros lo recibimos (aunque no lo guardemos)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePaymentRequest;
    const { id_purchase_order, id_buyer, total_price, packages } = body;
    
    // Validamos que venga todo
    if (!id_purchase_order || !id_buyer || !total_price || !packages) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en el body" },
        { status: 400 }
      );
    }

    // Generamos el ID de operación para MP y nuestra BD
    const id_operacion_pago = crypto.randomUUID();
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
        external_reference: id_operacion_pago,
        back_urls: {
          success: `https://proyecto-c-payments-mateandoando.vercel.app/success?id_operacion=${id_operacion_pago}`,
          failure: `https://proyecto-c-payments-mateandoando.vercel.app/failure?id_operacion=${id_operacion_pago}`,
          pending: `https://proyecto-c-payments-mateandoando.vercel.app/pending?id_operacion=${id_operacion_pago}`
        },
        auto_return: "approved"
      }
    });

    // 2. Guardamos solo lo necesario (Chau datos inventados con crypto)
    const nuevoPago = await prisma.payment_order.create({
      data: {
        idPaymentOperation: id_operacion_pago,
        idPurchaseOrder: id_purchase_order,
        idBuyer: id_buyer,
        totalPrice: total_price,
        status: "PENDIENTE",
        url: mpResponse.init_point,
      }
    });

    // 3. Devolvemos la respuesta exacta que pide el contrato
    return NextResponse.json(
      {
        id_payment_operation: nuevoPago.idPaymentOperation, 
        checkout_url: mpResponse.init_point,
        status: "PENDIENTE" // Agregado según el contrato
      },
      { status: 201 }
    );

  } catch(error: any) {
    console.error("Error completo de MP:", error.cause || error);
    
    return NextResponse.json(
      { error: "Error interno del servidor al generar el pago" },
      { status: 500 }
    );
  }
}