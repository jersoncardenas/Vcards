import crypto from "node:crypto";

const COOKIE = "vcar_admin";
const entorno = (nombre) => process.env[nombre] || import.meta.env[nombre];
const firma = () => crypto.createHmac("sha256", entorno("ADMIN_SESSION_SECRET")).update(entorno("ADMIN_USER")).digest("hex");

export function autenticar(usuario, clave) {
  return usuario === entorno("ADMIN_USER") && clave === entorno("ADMIN_PASSWORD");
}
export function iniciarSesion(cookies) {
  cookies.set(COOKIE, firma(), { httpOnly: true, sameSite: "strict", secure: entorno("COOKIE_SECURE") === "true", path: "/", maxAge: 60 * 60 * 8 });
}
export function cerrarSesion(cookies) { cookies.delete(COOKIE, { path: "/" }); }
export function esAdmin(cookies) { return cookies.get(COOKIE)?.value === firma(); }
export const noAutorizado = () => new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
