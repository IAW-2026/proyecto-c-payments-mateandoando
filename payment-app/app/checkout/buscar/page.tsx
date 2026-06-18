import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma"; // Ajustá los ../ a tu ruta real

export default async function BuscadorOrdenPage() {
  // 1. Le pedimos a Clerk el ID único del usuario logueado
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Buscamos en Prisma usando ese userId exacto
  const ordenPendiente = await prisma.payment_order.findFirst({
    where: {
      idBuyer: userId, // Ahora usamos el ID que nos da Clerk
      status: "PENDIENTE"
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // 3. Si encontramos la orden, lo teletransportamos a pagar
  if (ordenPendiente) {
    redirect(`/checkout/${ordenPendiente.idPaymentOperation}`);
  }

  // Si no tiene nada pendiente, le mostramos este mensaje
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="p-8 bg-white rounded-2xl shadow text-center">
        <h2 className="text-xl font-bold text-stone-800">¡Hola! Estás logueado.</h2>
        <p className="text-stone-500 mt-2">Pero no encontramos ninguna orden pendiente de pago para tu cuenta.</p>
      </div>
    </div>
  );
}