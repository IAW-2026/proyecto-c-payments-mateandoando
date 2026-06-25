import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; //Ajustá la ruta según tu estructura

export async function GET(request: NextRequest) {
  try {
    //BARRERA DE SEGURIDAD
    const apiKeyRecibida = request.headers.get('x-api-key') || request.headers.get('x_api_key');
    const ANALYTICS_SECRET = process.env.ANALYTICS_PAYMENTS_API_KEY || ''; 

    if (!apiKeyRecibida || apiKeyRecibida !== ANALYTICS_SECRET) {
      return NextResponse.json(
        { error: "Acceso denegado. Credenciales de aplicación inválidas." },
        { status: 401 }
      );
    }

    // --- DEFINIMOS LA FECHA DE CORTE ---
    const FECHA_CORTE = new Date('2026-06-21T00:00:00.000Z');

    //CÁLCULOS FINANCIEROS (Solo de transacciones APROBADAS y desde la fecha de corte)
    const metricasFinancieras = await prisma.payment_order.aggregate({
      _sum: { totalPrice: true },
      _avg: { totalPrice: true },
      where: {
        status: "APROBADO",
        createdAt: { gte: FECHA_CORTE }
      },
    });

    //VOLUMEN TOTAL (Desde la fecha de corte)
    const totalTransacciones = await prisma.payment_order.count({
      where: { createdAt: { gte: FECHA_CORTE } }
    });

    //DISTRIBUCIÓN DE ESTADOS (Desde la fecha de corte)
    const distribucionEstados = await prisma.payment_order.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { createdAt: { gte: FECHA_CORTE } }
    });

    // --- NUEVO: EXTRAER EL HISTORIAL TEMPORAL DE VENTAS ---
    const ventasTimeline = await prisma.payment_order.findMany({
      where: {
        status: "APROBADO",
        createdAt: { gte: FECHA_CORTE }
      },
      select: {
        createdAt: true,
        totalPrice: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Formateamos el historial para que viaje limpio en el JSON
    const timelineFormateado = ventasTimeline.map(item => ({
      date: item.createdAt,
      price: Number(item.totalPrice)
    }));

    //FORMATEO DE LA RESPUESTA
    const revenueTotal = metricasFinancieras._sum.totalPrice ? Number(metricasFinancieras._sum.totalPrice) : 0;
    const ticketPromedio = metricasFinancieras._avg.totalPrice ? Number(metricasFinancieras._avg.totalPrice) : 0;

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
        sales_timeline: timelineFormateado, // <-- Enviamos la serie de tiempo al Dashboard
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