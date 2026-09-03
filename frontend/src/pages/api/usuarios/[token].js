import { esAdmin, noAutorizado } from "../../../lib/auth.js";
import { query } from "../../../lib/db.js";
export const prerender = false;

export async function GET({ params }) {
  const resultado = await query(`select u.token,u.nombre,u.telefono,u.correo,u.area,u.descripcion,u.empresa_id as "empresaId",e.nombre as nombre_empresa,encode(u.foto,'base64') as foto_base64 from usuarios u join empresas e on e.id=u.empresa_id where u.token=$1`, [params.token]);
  if (!resultado.rowCount) return Response.json({ error: "No encontrado" }, { status: 404 });
  const usuario = resultado.rows[0];
  usuario.foto = usuario.foto_base64 ? `data:image/jpeg;base64,${usuario.foto_base64}` : "";
  delete usuario.foto_base64;
  return Response.json(usuario);
}

export async function PUT({ params, request, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  const d = await request.json();
  const resultado = await query(`update usuarios set nombre=$1,area=$2,descripcion=$3,telefono=$4,correo=lower($5),empresa_id=$6 where token=$7`, [d.nombre,d.area,d.descripcion,d.telefono,d.correo,Number(d.empresaId),params.token]);
  return resultado.rowCount ? Response.json({ ok:true }) : Response.json({ error:"No encontrado" }, { status:404 });
}

export async function DELETE({ params, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  await query("delete from usuarios where token=$1", [params.token]);
  return Response.json({ ok:true });
}
