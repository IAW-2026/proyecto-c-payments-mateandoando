import { NextRequest, NextResponse } from "next/server";
import {PrismaClient} from '../../../lib/prisma';
import crypto from 'crypto'; // Librería nativa para generar UUIDs aleatorios

import { prisma } from "../../../lib/prisma";

//Lo que esperamos recibir de la Seller App
interface CreatePaymentRequest {
  id_purchase_order: string;
  id_buyer: string;
  total_price: number;
}

//Funcion principal usando el POST
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
      {id_payment_operation: nuevoPago.idPaymentOperation},
      {status:201}
    )

  }catch(error){
    //Por si falla algo en la base de datos, lo imprimo en consola.
    console.error("Error al crear el pago", error);
    return NextResponse.json(
      {error: "Error interno del servidor al generar el pago"},
      {status: 500} //Error de parte del Servidor
    );
  }
}