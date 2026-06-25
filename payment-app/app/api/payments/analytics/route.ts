import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; //Ajustá la ruta según tu estructura

export async function GET(request: NextRequest) {
  try {
    //BARRERA DE SEGURIDAD
    const apiKeyRecibida = request.headers.get('x-api-key') || request.headers.get('x_api_key');
    //Configurá esta variable en tu .env de Vercel para que Analytics se pueda conectar
    const ANALYTICS_SECRET = process.env.ANALYTICS_PAYMENTS_API_KEY || ''; 

    if (!apiKeyRecibida || apiKeyRecibida !== ANALYTICS_SECRET) {
      return NextResponse.json(
        { error: "Acceso denegado. Credenciales de aplicación inválidas." },
        { status: 401 }
      );
    }

    //CÁLCULOS FINANCIEROS (Solo de transacciones APROBADAS)
    //Usamos aggregate para sumar y promediar directamente en la base de datos
    const metricasFinancieras = await prisma.payment_order.aggregate({
      _sum: {
        totalPrice: true,
      },
      _avg: {
        totalPrice: true,
      },
      where: {
        status: "APROBADO", //Solo contamos la plata que realmente entró
      },
    });

    //VOLUMEN TOTAL
    const totalTransacciones = await prisma.payment_order.count();

    //DISTRIBUCIÓN DE ESTADOS
    //groupBy agrupa las órdenes por estado y nos cuenta cuántas hay de cada uno
    const distribucionEstados = await prisma.payment_order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    //FORMATEO DE LA RESPUESTA
    //Prisma devuelve los decimales como objetos especiales, así que los pasamos a Number
    const revenueTotal = metricasFinancieras._sum.totalPrice ? Number(metricasFinancieras._sum.totalPrice) : 0;
    const ticketPromedio = metricasFinancieras._avg.totalPrice ? Number(metricasFinancieras._avg.totalPrice) : 0;

    //Acomodamos el arreglo de estados para que quede prolijo según el JSON que prometimos
    const byStatus = distribucionEstados.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    return NextResponse.json(
      {
        financial_metrics: {
          total_revenue_ars: parseFloat(revenueTotal.toFixed(2)),
          average_ticket_ars: parseFloat(ticketPromedio.toFixed(2)),
          total_processed_transactions: totalTransacciones,
        },
        transactions_by_status: byStatus,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error al generar las métricas de Analytics:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al calcular métricas." },
      { status: 500 }
    );
  }
}