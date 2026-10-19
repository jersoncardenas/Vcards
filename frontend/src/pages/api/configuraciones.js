import { esAdmin, noAutorizado } from "../../lib/auth.js";
import { query } from "../../lib/db.js";
export const prerender = false;

export async function GET() {
  const resultado = await query(`select empresa_id as "empresaId",plantilla_id as "plantillaId",redes,colores from empresa_config order by empresa_id`);
  return Response.json(resultado.rows);
}

async function guardarConfiguracion(request, cookies) {
  if (!esAdmin(cookies)) return noAutorizado();
  let datos;
  try {
    datos = await request.json();
  } catch {
    return Response.json({ error: "La solicitud no es válida" }, { status: 400 });
  }
  const empresaId = Number(datos.empresaId);
  const plantillaId = Number(datos.plantillaId);
  if (!Number.isInteger(empresaId) || !Number.isInteger(plantillaId)) {
    return Response.json({ error: "Selecciona una empresa válida" }, { status: 400 });
  }
  try {
    await query(`insert into empresa_config(empresa_id,plantilla_id,redes,colores,actualizado_en) values($1,$2,$3::jsonb,$4::jsonb,now()) on conflict(empresa_id) do update set plantilla_id=excluded.plantilla_id,redes=excluded.redes,colores=excluded.colores,actualizado_en=now()`, [empresaId, plantillaId, JSON.stringify(datos.redes || {}), JSON.stringify(datos.colores || {})]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("No fue posible guardar la configuración:", error);
    return Response.json({ error: "No fue posible guardar la configuración" }, { status: 500 });
  }
}

export async function POST({ request, cookies }) { return guardarConfiguracion(request, cookies); }
export async function PUT({ request, cookies }) { return guardarConfiguracion(request, cookies); }
