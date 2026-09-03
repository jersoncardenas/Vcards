import { esAdmin } from "../../../lib/auth.js";
export const prerender = false;
export async function GET({ cookies }) { return Response.json({ autenticado: esAdmin(cookies) }); }
