import { autenticar, iniciarSesion } from "../../../lib/auth.js";
export const prerender = false;
export async function POST({ request, cookies }) {
  const { usuario, clave } = await request.json();
  if (!autenticar(usuario, clave)) return new Response(JSON.stringify({ error: "Credenciales incorrectas" }), { status: 401 });
  iniciarSesion(cookies);
  return Response.json({ ok: true });
}
