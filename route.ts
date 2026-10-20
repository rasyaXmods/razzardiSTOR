import { db } from "@/lib/db";
import { verifyDigiflazzWebhook } from "@/lib/digiflazz";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  let body: Record<string, any>;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  let verified = false;
  try { verified = verifyDigiflazzWebhook(raw, request.headers.get("x-digiflazz-signature")); }
  catch { return Response.json({ error: "Webhook configuration error" }, { status: 500 }); }
  if (!verified) return Response.json({ error: "Invalid signature" }, { status: 401 });

  const refId = String(body.data?.ref_id ?? body.ref_id ?? "");
  const status = String(body.data?.status ?? body.status ?? "");
  const order = await db.order.findFirst({ where: { providerReference: refId } });
  if (!order) return Response.json({ received: true });

  const mapped = status.toLowerCase() === "sukses" ? "SUCCESS"
    : ["gagal", "failed"].includes(status.toLowerCase()) ? "FAILED" : "PROCESSING";

  await db.$transaction(async tx => {
    const current = await tx.order.findUnique({ where: { id: order.id } });
    if (!current || !["PROCESSING", "PAID"].includes(current.status)) return;
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: mapped,
        providerStatus: status,
        providerMessage: String(body.data?.message ?? body.message ?? ""),
        fulfilledAt: mapped === "SUCCESS" ? new Date() : undefined
      }
    });
    await tx.orderEvent.create({
      data: { orderId: order.id, source: "digiflazz", eventType: status || "UNKNOWN",
        detail: body.data ?? body }
    });
  });
  return Response.json({ received: true });
}
