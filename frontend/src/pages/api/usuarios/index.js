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
  const empresaId = Number(datos.empresaId);
  if (!correoValido.test(datos.correo || "") || !/^\d{10}$/.test(datos.telefono || "") || !Number.isInteger(empresaId)) return Response.json({ error: "Datos no válidos" }, { status: 400 });
  const duplicados = await query(`select
    exists(select 1 from usuarios where empresa_id=$3 and lower(correo)=lower($1)) as correo,
    exists(select 1 from usuarios where empresa_id=$3 and telefono=$2) as telefono`, [datos.correo, datos.telefono, empresaId]);
  if (duplicados.rows[0].correo) return Response.json({ error: "El correo ya está registrado en esta empresa" }, { status: 409 });
  if (duplicados.rows[0].telefono) return Response.json({ error: "El teléfono ya está registrado en esta empresa" }, { status: 409 });
  const token = crypto.randomUUID().replaceAll("-", "");
  try {
    await query(`insert into usuarios(nombre,telefono,correo,area,descripcion,foto,token,img_qr,empresa_id) values($1,$2,lower($3),$4,$5,$6,$7,null,$8)`, [datos.nombre,datos.telefono,datos.correo,datos.area,datos.descripcion,fotoBuffer(datos.foto),token,empresaId]);
    return Response.json({ token }, { status: 201 });
  } catch (error) {
    if (error?.code === "23505") return Response.json({ error: "El correo o el teléfono ya está registrado en esta empresa" }, { status: 409 });
    throw error;
  }
}
