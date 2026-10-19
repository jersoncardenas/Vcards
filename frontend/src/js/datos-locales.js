export const EMPRESAS = [
  { id: 2, nombre: "Novacasa" },
  { id: 3, nombre: "Decorceramica" },
  { id: 4, nombre: "KLP" },
  { id: 5, nombre: "Klipen" },
  { id: 6, nombre: "Kohler" },
  { id: 7, nombre: "Decor Corporativo" },
];

const STORAGE_KEY = "vcar_usuarios";
const CONFIG_KEY = "vcar_config_empresas";

export const PLANTILLAS = [
  { id: 2, nombre: "Novacasa", css: "/css/novacasa/perfiles/vistaNovacasa.css", carpeta: "/imagenes/novacasa", qrLogo: "/imagenes/novacasa.png" },
  { id: 3, nombre: "Decorceramica", css: "/css/decorceramica/perfiles/vistaDecorceramica.css", carpeta: "/imagenes/decorceramica", qrLogo: "/imagenes/decorceramica.png" },
  { id: 4, nombre: "KLP", css: "/css/klp/perfiles/vistaKlp.css", carpeta: "/imagenes/klp", qrLogo: "/imagenes/klp.png" },
  { id: 5, nombre: "Klipen", css: "/css/klipen/perfiles/vistaKlipen.css", carpeta: "/imagenes/klipen", qrLogo: "/imagenes/klipen.png" },
  { id: 6, nombre: "Kohler", css: "/css/hohler/perfiles/vistaKohler.css", carpeta: "/imagenes/kohler", qrLogo: "/imagenes/kohler.png" },
  { id: 7, nombre: "Decor Corporativo", css: "/css/decor_corporativo/perfiles/vistaDecorCoorporativo.css", carpeta: "/imagenes/decor_corporativo", qrLogo: "/imagenes/decor_coorporativo.png" },
];

export const REDES_DECORCERAMICA = {
  facebook: "https://www.facebook.com/IdeasDECORCERAMICA/",
  instagram: "https://www.instagram.com/decorceramica_oficial/",
  twitter: "https://x.com/DECORTWITT",
  linkedin: "https://co.linkedin.com/in/decorceramica-oficial-491164126",
};

export const buscarEmpresa = (id) => EMPRESAS.find((empresa) => empresa.id === Number(id));

export function obtenerUsuarios() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

export const obtenerUsuario = (token) => obtenerUsuarios()[token] || null;

export function existeDuplicado(correo, telefono, empresaId) {
  return Object.values(obtenerUsuarios()).find((usuario) =>
    Number(usuario.empresaId) === Number(empresaId) &&
    (usuario.correo.toLowerCase() === correo.toLowerCase() || usuario.telefono === telefono)
  );
}

export function guardarUsuario(usuario) {
  const usuarios = obtenerUsuarios();
  usuarios[usuario.token] = usuario;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

export function actualizarUsuario(token, cambios) {
  const usuarios = obtenerUsuarios();
  if (!usuarios[token]) return false;
  usuarios[token] = { ...usuarios[token], ...cambios, token };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
  return true;
}

export function eliminarUsuario(token) {
  const usuarios = obtenerUsuarios();
  delete usuarios[token];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

export function obtenerConfiguraciones() {
  let guardadas = {};
  try { guardadas = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"); } catch {}
  return Object.fromEntries(EMPRESAS.map((empresa) => [empresa.id, {
    empresaId: empresa.id,
    plantillaId: Number(guardadas[empresa.id]?.plantillaId || empresa.id),
    redes: {
      ...REDES_DECORCERAMICA,
      ...Object.fromEntries(
        Object.entries(guardadas[empresa.id]?.redes || {}).filter(([, enlace]) => enlace)
      ),
    },
  }]));
}

export function obtenerConfiguracionEmpresa(empresaId) {
  const configuracion = obtenerConfiguraciones()[Number(empresaId)];
  if (!configuracion) return null;
  const plantilla = PLANTILLAS.find((item) => item.id === configuracion.plantillaId) || PLANTILLAS[0];
  return { ...configuracion, ...plantilla };
}

export function guardarConfiguracionEmpresa(empresaId, cambios) {
  const configuraciones = obtenerConfiguraciones();
  configuraciones[Number(empresaId)] = { ...configuraciones[Number(empresaId)], ...cambios };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configuraciones));
}

export function archivoADataUrl(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No fue posible leer la imagen"));
    lector.readAsDataURL(archivo);
  });
}
