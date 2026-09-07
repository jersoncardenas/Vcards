import crypto from "node:crypto";
import { esAdmin, noAutorizado } from "../../../lib/auth.js";
import { query } from "../../../lib/db.js";
export const prerender = false;

const correoValido = /^[^\s@]+@(novacasacenter\.com|grupodecor\.com|klipengroup\.com|klpcomercial\.com|decorceramica\.com|kohler\.com)$/i;
const fotoBuffer = (foto) => Buffer.from(String(foto || "").split(",")[1] || "", "base64");

export async function GET({ cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  const resultado = await query(`select u.token,u.nombre,u.telefono,u.correo,u.area,u.descripcion,u.empresa_id as "empresaId",e.nombre as nombre_empresa from usuarios u join empresas e on e.id=u.empresa_id order by u.id desc`);
  return Response.json(resultado.rows);
}

export async function POST({ request }) {
  const datos = await request.json();
  if (!correoValido.test(datos.correo || "") || !/^\d{10}$/.test(datos.telefono || "")) return Response.json({ error: "Datos no válidos" }, { status: 400 });
  const duplicado = await query("select correo,telefono from usuarios where lower(correo)=lower($1) or telefono=$2 limit 1", [datos.correo, datos.telefono]);
  if (duplicado.rowCount) return Response.json({ error: duplicado.rows[0].correo.toLowerCase() === datos.correo.toLowerCase() ? "El correo ya está registrado" : "El teléfono ya está registrado" }, { status: 409 });
  const token = crypto.randomUUID().replaceAll("-", "");
  await query(`insert into usuarios(nombre,telefono,correo,area,descripcion,foto,token,img_qr,empresa_id) values($1,$2,lower($3),$4,$5,$6,$7,null,$8)`, [datos.nombre,datos.telefono,datos.correo,datos.area,datos.descripcion,fotoBuffer(datos.foto),token,Number(datos.empresaId)]);
  return Response.json({ token }, { status: 201 });
}
