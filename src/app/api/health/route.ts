import { jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  return jsonResponse({ status: "healthy" });
}
