import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma"; // Ajustá la ruta según tu proyecto

export default async function DashboardRedirect() {
  // Usamos currentUser() para poder leer el texto del email y los metadatos
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  // ==========================================
  // RUTA DE SEGURIDAD: ES UN ADMINISTRADOR
  // ==========================================
  // Revisamos si Clerk tiene asignado el rol de admin en la metadata pública
  const esAdmin = user.publicMetadata?.role === "admin";
  if (esAdmin) {
    redirect("/admin");
  }

  // Agarramos el mail principal con el que inició sesión
  const email = user.emailAddresses[0]?.emailAddress.toLowerCase() || "";

  // ==========================================
  // RUTA 1: ES UN VENDEDOR
  // ==========================================
  if (email.includes("vendedor")) {
    // Lo mandamos a su panel principal (aunque esté vacío por ahora)
    redirect("/history-seller"); 
  }

  // ==========================================
  // RUTA 2: ES UN COMPRADOR
  // ==========================================
  if (email.includes("comprador")) {
    console.log("EL ID REAL DE ESTE COMPRADOR ES:", user.id);
    // Nos fijamos si de casualidad tiene un carrito pendiente
    const ordenPendiente = await prisma.payment_order.findFirst({
      where: {
        idBuyer: user.id, // user.id es el "user_..." de Clerk
        status: "PENDIENTE"
      },
      orderBy: { createdAt: "desc" }
    });

    if (ordenPendiente) {
      // Si tiene carrito, directo a pagar a Mercado Pago
      redirect(`/checkout/${ordenPendiente.idPaymentOperation}`);
    } else {
      // Si NO tiene carrito, le mostramos su pantalla principal de comprador vacía
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100">
          <div className="p-8 bg-white rounded-2xl shadow text-center">
            <h2 className="text-2xl font-bold text-stone-800">¡Hola Comprador!</h2>
            <p className="text-stone-500 mt-2">No tenés compras pendientes.</p>
          </div>
        </div>
      );
    }
  }

  // ==========================================
  // RUTA 3: MAIL DESCONOCIDO
  // ==========================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="p-8 bg-white rounded-2xl shadow text-center">
        <h2 className="text-xl font-bold text-red-600">Cuenta no reconocida</h2>
        <p className="text-stone-500 mt-2">Tu mail no dice ni 'comprador' ni 'vendedor'.</p>
      </div>
    </div>
  );
}