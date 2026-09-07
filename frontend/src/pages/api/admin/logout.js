import { cerrarSesion } from "../../../lib/auth.js";
export const prerender = false;
export async function POST({ cookies }) {
  cerrarSesion(cookies);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
