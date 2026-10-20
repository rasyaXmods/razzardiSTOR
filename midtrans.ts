import Midtrans from "midtrans-client";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function snapClient() {
  return new Midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: required("MIDTRANS_SERVER_KEY"),
    clientKey: required("MIDTRANS_CLIENT_KEY")
  });
}

export function verifyMidtransSignature(body: Record<string, unknown>) {
  const orderId = String(body.order_id ?? "");
  const statusCode = String(body.status_code ?? "");
  const grossAmount = String(body.gross_amount ?? "");
  const signatureKey = String(body.signature_key ?? "");
  const serverKey = required("MIDTRANS_SERVER_KEY");
  const crypto = require("node:crypto") as typeof import("node:crypto");
  const expected = crypto.createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureKey));
}
