-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'REEMBOLSADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "payment_order" (
    "id_payment_operation" UUID NOT NULL,
    "id_purchase_order" UUID NOT NULL,
    "id_seller" UUID NOT NULL,
    "id_seller_app" UUID NOT NULL,
    "id_buyer" UUID NOT NULL,
    "id_buyer_app" UUID NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "url" TEXT NOT NULL,
    "payment_hash" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_order_pkey" PRIMARY KEY ("id_payment_operation")
);
