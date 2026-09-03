import { esAdmin, noAutorizado } from "../../lib/auth.js";
import { query } from "../../lib/db.js";
export const prerender = false;

export async function GET() {
  const resultado = await query(`select empresa_id as "empresaId",plantilla_id as "plantillaId",redes,colores from empresa_config order by empresa_id`);
  return Response.json(resultado.rows);
}
export async function PUT({ request, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  const d = await request.json();
  await query(`insert into empresa_config(empresa_id,plantilla_id,redes,colores,actualizado_en) values($1,$2,$3::jsonb,$4::jsonb,now()) on conflict(empresa_id) do update set plantilla_id=excluded.plantilla_id,redes=excluded.redes,colores=excluded.colores,actualizado_en=now()`, [Number(d.empresaId),Number(d.plantillaId),JSON.stringify(d.redes || {}),JSON.stringify(d.colores || {})]);
  return Response.json({ ok:true });
}
