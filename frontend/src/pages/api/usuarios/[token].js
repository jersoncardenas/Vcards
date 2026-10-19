import { esAdmin, noAutorizado } from "../../../lib/auth.js";
import { query } from "../../../lib/db.js";
export const prerender = false;

const tipoImagen = (base64) => {
  const bytes = Buffer.from(base64.slice(0, 24), "base64");
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return "application/octet-stream";
};

export async function GET({ params }) {
  const resultado = await query(`select u.token,u.nombre,u.telefono,u.correo,u.area,u.descripcion,u.empresa_id as "empresaId",e.nombre as nombre_empresa,encode(u.foto,'base64') as foto_base64 from usuarios u join empresas e on e.id=u.empresa_id where u.token=$1`, [params.token]);
  if (!resultado.rowCount) return Response.json({ error: "No encontrado" }, { status: 404 });
  const usuario = resultado.rows[0];
  usuario.foto = usuario.foto_base64 ? `data:${tipoImagen(usuario.foto_base64)};base64,${usuario.foto_base64}` : "";
  delete usuario.foto_base64;
  return Response.json(usuario);
}

export async function PUT({ params, request, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  const d = await request.json();
  const empresaId = Number(d.empresaId);
  const duplicados = await query(`select
    exists(select 1 from usuarios where empresa_id=$3 and lower(correo)=lower($1) and token<>$4) as correo,
    exists(select 1 from usuarios where empresa_id=$3 and telefono=$2 and token<>$4) as telefono`, [d.correo, d.telefono, empresaId, params.token]);
  if (duplicados.rows[0].correo) return Response.json({ error:"El correo ya está registrado en esta empresa" }, { status:409 });
  if (duplicados.rows[0].telefono) return Response.json({ error:"El teléfono ya está registrado en esta empresa" }, { status:409 });
  try {
    const resultado = await query(`update usuarios set nombre=$1,area=$2,descripcion=$3,telefono=$4,correo=lower($5),empresa_id=$6 where token=$7`, [d.nombre,d.area,d.descripcion,d.telefono,d.correo,empresaId,params.token]);
    return resultado.rowCount ? Response.json({ ok:true }) : Response.json({ error:"No encontrado" }, { status:404 });
  } catch (error) {
    if (error?.code === "23505") return Response.json({ error:"El correo o el teléfono ya está registrado en esta empresa" }, { status:409 });
    throw error;
  }
}

export async function DELETE({ params, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  await query("delete from usuarios where token=$1", [params.token]);
  return Response.json({ ok:true });
}
