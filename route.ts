import { db } from "@/lib/db";
import { verifyMidtransSignature } from "@/lib/midtrans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid body" }, { status: 400 });

  try {
    if (!verifyMidtransSignature(body)) return Response.json({ error: "Invalid signature" }, { status: 401 });
  } catch {
    return Response.json({ error: "Webhook configuration error" }, { status: 500 });
  }

  const orderId = String(body.order_id ?? "");
  const transactionStatus = String(body.transaction_status ?? "");
  const fraudStatus = String(body.fraud_status ?? "");
  const order = await db.order.findUnique({ where: { publicId: orderId } });
  if (!order) return Response.json({ received: true }); // acknowledge unknown IDs without fulfillment

  let nextStatus: "PENDING_PAYMENT" | "PAID" | "EXPIRED" | "FAILED" = "PENDING_PAYMENT";
  if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) nextStatus = "PAID";
  else if (transactionStatus === "expire") nextStatus = "EXPIRED";
  else if (["deny", "cancel"].includes(transactionStatus)) nextStatus = "FAILED";

  await db.$transaction(async tx => {
    const current = await tx.order.findUnique({ where: { id: order.id } });
    if (!current) return;
    // Do not downgrade an already paid/fulfilled order because of a delayed notification.
    if (["PAID", "PROCESSING", "SUCCESS"].includes(current.status) && nextStatus !== "PAID") return;
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        paymentNotifiedAt: new Date()
      }
    });
    await tx.orderEvent.create({
      data: { orderId: order.id, source: "midtrans", eventType: transactionStatus || "UNKNOWN",
        detail: { transactionStatus, fraudStatus, paymentType: body.payment_type ?? null } }
    });
  });

  // Fulfillment must be moved to a durable queue/worker before production launch.
  // This webhook intentionally records verified payment; it does not pretend a top-up was delivered.
  return Response.json({ received: true });
}
