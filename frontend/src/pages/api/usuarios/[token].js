import { esAdmin, noAutorizado } from "../../../lib/auth.js";
import { query } from "../../../lib/db.js";

export const prerender = false;

const correoValido = /^[^\s@]+@(novacasacenter\.com|grupodecor\.com|klipengroup\.com|klpcomercial\.com|decorceramica\.com|kohler\.com)$/i;
const telefonoValido = /^\d{10}$/;
const MAXIMO_FOTO = 5 * 1024 * 1024;

const tipoImagen = (base64) => {
  const bytes = Buffer.from(base64.slice(0, 24), "base64");
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return "application/octet-stream";
};

const errorJson = (error, status) => Response.json({ error }, { status });

function fotoBuffer(foto) {
  if (!foto) return null;
  const coincidencia = String(foto).match(/^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!coincidencia) throw new Error("La fotografía debe ser una imagen PNG, JPG o WEBP válida");
  const buffer = Buffer.from(coincidencia[1], "base64");
  if (!buffer.length || buffer.length > MAXIMO_FOTO) throw new Error("La fotografía procesada no puede superar 5 MB");
  return buffer;
}

function normalizarEdicion(datos = {}) {
  const nombre = String(datos.nombre || "").trim();
  const area = String(datos.area || "").trim();
  const descripcion = String(datos.descripcion || "").trim();
  const telefono = String(datos.telefono || "").trim();
  const correo = String(datos.correo || "").trim().toLowerCase();
  const empresaId = Number(datos.empresaId);

  if (!nombre || nombre.length > 255) throw new Error("Escribe un nombre válido");
  if (!area || area.length > 255) throw new Error("Escribe un cargo válido");
  if (!telefonoValido.test(telefono)) throw new Error("El teléfono debe tener 10 dígitos");
  if (!correoValido.test(correo)) throw new Error("Usa un correo corporativo autorizado");
  if (!Number.isInteger(empresaId) || empresaId <= 0) throw new Error("Selecciona una empresa válida");

  return { nombre, area, descripcion, telefono, correo, empresaId, foto: fotoBuffer(datos.foto) };
}

async function editarUsuario(token, datos) {
  let usuario;
  try {
    usuario = normalizarEdicion(datos);
  } catch (error) {
    return errorJson(error.message, 400);
  }

  const duplicados = await query(`select
    exists(select 1 from usuarios where empresa_id=$3 and lower(correo)=lower($1) and token<>$4) as correo,
    exists(select 1 from usuarios where empresa_id=$3 and telefono=$2 and token<>$4) as telefono`, [usuario.correo, usuario.telefono, usuario.empresaId, token]);
  if (duplicados.rows[0].correo) return errorJson("El correo ya está registrado en esta empresa", 409);
  if (duplicados.rows[0].telefono) return errorJson("El teléfono ya está registrado en esta empresa", 409);

  try {
    const resultado = await query(`update usuarios
      set nombre=$1, area=$2, descripcion=$3, telefono=$4, correo=$5, empresa_id=$6,
          foto=case when $7::bytea is null then foto else $7::bytea end
      where token=$8 returning token`, [usuario.nombre, usuario.area, usuario.descripcion, usuario.telefono, usuario.correo, usuario.empresaId, usuario.foto, token]);
    return resultado.rowCount
      ? Response.json({ ok: true, token })
      : errorJson("El perfil ya no existe", 404);
  } catch (error) {
    if (error?.code === "23503") return errorJson("La empresa seleccionada no existe", 400);
    if (error?.code === "23505") return errorJson("El correo o el teléfono ya está registrado en esta empresa", 409);
    console.error("No fue posible editar el perfil:", error);
    return errorJson("No fue posible editar el perfil", 500);
  }
}

async function eliminarUsuario(token) {
  try {
    const resultado = await query("delete from usuarios where token=$1 returning token", [token]);
    return resultado.rowCount
      ? Response.json({ ok: true, token })
      : errorJson("El perfil ya no existe", 404);
  } catch (error) {
    console.error("No fue posible eliminar el perfil:", error);
    return errorJson("No fue posible eliminar el perfil en la base de datos", 500);
  }
}

export async function GET({ params }) {
  const resultado = await query(`select u.token,u.nombre,u.telefono,u.correo,u.area,u.descripcion,u.empresa_id as "empresaId",e.nombre as nombre_empresa,encode(u.foto,'base64') as foto_base64 from usuarios u join empresas e on e.id=u.empresa_id where u.token=$1`, [params.token]);
  if (!resultado.rowCount) return errorJson("No encontrado", 404);
  const usuario = resultado.rows[0];
  usuario.foto = usuario.foto_base64 ? `data:${tipoImagen(usuario.foto_base64)};base64,${usuario.foto_base64}` : "";
  delete usuario.foto_base64;
  return Response.json(usuario);
}

// POST con JSON evita bloqueos de PUT/DELETE y de validación de origen cuando
// Astro está desplegado detrás de un proxy inverso. PUT y DELETE se conservan
// para clientes existentes.
export async function POST({ params, request, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  let datos;
  try {
    datos = await request.json();
  } catch {
    return errorJson("La solicitud no es válida", 400);
  }
  if (datos.accion === "editar") return editarUsuario(params.token, datos);
  if (datos.accion === "eliminar") return eliminarUsuario(params.token);
  return errorJson("Acción administrativa no válida", 400);
}

export async function PUT({ params, request, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  try {
    return editarUsuario(params.token, await request.json());
  } catch {
    return errorJson("La solicitud no es válida", 400);
  }
}

export async function DELETE({ params, cookies }) {
  if (!esAdmin(cookies)) return noAutorizado();
  return eliminarUsuario(params.token);
}
