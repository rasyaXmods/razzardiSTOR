import crypto from "node:crypto";

const endpoint = "https://api.digiflazz.com/v1/transaction";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function verifyDigiflazzWebhook(rawBody: string, signature: string | null) {
  const secret = required("DIGIFLAZZ_WEBHOOK_SECRET");
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function submitTopup(input: {
  sku: string; customerNo: string; refId: string;
}) {
  const username = required("DIGIFLAZZ_USERNAME");
  const apiKey = required("DIGIFLAZZ_API_KEY");
  const sign = crypto.createHash("md5").update(username + apiKey + input.refId).digest("hex");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      username, buyer_sku_code: input.sku, customer_no: input.customerNo,
      ref_id: input.refId, sign
    })
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(`Digiflazz HTTP error (${response.status})`);
  return body;
}
