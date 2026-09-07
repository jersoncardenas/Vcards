import { esAdmin } from "../../../lib/auth.js";
export const prerender = false;
export async function GET({ cookies }) {
  return Response.json(
    { autenticado: esAdmin(cookies) },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } }
  );
}
