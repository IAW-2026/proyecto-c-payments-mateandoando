import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto'; // Librería nativa para generar UUIDs aleatorios
import { prisma } from "../../../lib/prisma";
//Importamos la libreria de Mercado Pago
import {MercadoPagoConfig, Preference} from 'mercadopago';

//Le pasamos el token de .env para que sepa que soy yo
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

//Lo que esperamos recibir de la Seller App
interface CreatePaymentRequest {
  id_purchase_order: string;
  id_buyer: string;
  total_price: number;
}

//Endpoint para que la Seller App cree una nueva transaccion de pago cuando se genere una orden de compra.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePaymentRequest; //Forzamos el tipado con la interface
    const {id_purchase_order, id_buyer, total_price} = body;
    
    //Nos fijamos que esten los datos obligatorios
    if (!id_purchase_order || !id_buyer || !total_price) {
      return NextResponse.json(
        {error: "Faltan campos obligatorios en el body"},
        {status: 400} //Error de parte del cliente
      )
    }

    //Le avisamos a MP antes de hacer nada
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

    //Guardamos en la base de datos
    const nuevoPago = await prisma.payment_order.create({
      data: {
        idPurchaseOrder: id_purchase_order,
        idBuyer: id_buyer,
        totalPrice: total_price,
        status: "PENDIENTE",
        idSeller: crypto.randomUUID(), //Crypto es usado para generar codigos UUID validos y aleatorios
        idSellerApp: crypto.randomUUID(),
        idBuyerApp: crypto.randomUUID(),
      }
    });

    //Devolvemos el ID de la nueva transaccion recien creada
    return NextResponse.json(
      {id_payment_operation: nuevoPago.idPaymentOperation, 
        //Mas adelante se va a cambiar sandbox_init_point por init_point que es el link real de MP.
      checkout_url: mpResponse.init_point},
      {status:201}
    )

  }catch(error: any) {
    // Le pedimos a la consola que escupa el JSON exacto del rechazo de MP
    console.error("Error completo de MP:", error.cause || error);
    
    return NextResponse.json(
      {error: "Error interno del servidor al generar el pago"},
      {status: 500}
    );
  }
}