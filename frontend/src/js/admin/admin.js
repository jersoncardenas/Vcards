import { EMPRESAS, REDES_DECORCERAMICA, archivoADataUrl } from "../datos-locales.js";
import { removerFondoPersona } from "../imagenes/remover-fondo-persona.js";
import { createIcons, CheckCircle2, CircleAlert, Eye, House, Link, LogOut, Pencil, Save, Trash2, TriangleAlert, UserRoundPen, Users, X } from "lucide";

const cargarIconos = () => createIcons({ icons: { CheckCircle2, CircleAlert, Eye, House, Link, LogOut, Pencil, Save, Trash2, TriangleAlert, UserRoundPen, Users, X } });
const escapar = (valor = "") => String(valor).replace(/[&<>"']/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[caracter]);
const dominioCorporativo = /^[^\s@]+@(novacasacenter\.com|grupodecor\.com|klipengroup\.com|klpcomercial\.com|decorceramica\.com|kohler\.com)$/i;
const formatosImagen = ["jpg", "jpeg", "png", "webp"];
const maximoImagenBytes = 2 * 1024 * 1024;

const tabla = document.getElementById("tablaUsuarios");
const editor = document.getElementById("editor");
const filtroEmpresa = document.getElementById("filtroEmpresa");
const ordenUsuarios = document.getElementById("ordenUsuarios");
const confirmarEliminacion = document.getElementById("confirmarEliminacion");
const notificacion = document.getElementById("notificacion");
const editFoto = document.getElementById("editFoto");
const editFotoPreview = document.getElementById("editFotoPreview");
const editFotoEstado = document.getElementById("editFotoEstado");

let usuarios = [];
let configuraciones = [];
let usuarioAEliminar = null;
let temporizadorNotificacion;
let fotoEditada = null;
let recorteFotoEdicion = null;
let versionFotoEdicion = 0;

const opcionesEmpresas = (id) => EMPRESAS.map((empresa) => `<option value="${empresa.id}" ${Number(id) === empresa.id ? "selected" : ""}>${empresa.nombre}</option>`).join("");

function mostrarNotificacion(mensaje, tipo = "success") {
  clearTimeout(temporizadorNotificacion);
  notificacion.className = `toast ${tipo} visible`;
  notificacion.innerHTML = `<i data-lucide="${tipo === "success" ? "check-circle-2" : "circle-alert"}" aria-hidden="true"></i><span>${escapar(mensaje)}</span>`;
  cargarIconos();
  temporizadorNotificacion = setTimeout(() => notificacion.classList.remove("visible"), 5000);
}

async function solicitarJson(url, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(url, { cache: "no-store", ...opciones });
  } catch {
    throw new Error("No fue posible conectar con el servidor");
  }

  let datos = {};
  try {
    datos = await respuesta.json();
  } catch {
    // Algunas respuestas del proxy no incluyen JSON.
  }

  if (respuesta.status === 401) {
    window.location.replace("/?admin=login");
    throw new Error("La sesión administrativa venció");
  }
  if (!respuesta.ok) throw new Error(datos.error || `El servidor rechazó la operación (${respuesta.status})`);
  return datos;
}

const sesion = await fetch("/api/admin/session", { cache: "no-store" }).then((respuesta) => respuesta.json()).catch(() => ({ autenticado: false }));
if (!sesion.autenticado) window.location.replace("/?admin=login");

async function cargarUsuarios() {
  usuarios = await solicitarJson("/api/usuarios");
  renderUsuarios(document.getElementById("buscar").value);
}

function usuariosFiltrados(filtro = "") {
  const empresaId = Number(filtroEmpresa.value || 0);
  const texto = filtro.trim().toLocaleLowerCase("es");
  const lista = usuarios.filter((usuario) =>
    (!empresaId || usuario.empresaId === empresaId)
    && `${usuario.nombre} ${usuario.correo} ${usuario.area} ${usuario.nombre_empresa}`.toLocaleLowerCase("es").includes(texto)
  );

  if (ordenUsuarios.value === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  if (ordenUsuarios.value === "empresa") lista.sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa, "es", { sensitivity: "base" }) || a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  return lista;
}

function renderUsuarios(filtro = "") {
  const lista = usuariosFiltrados(filtro);
  document.getElementById("totalPerfiles").textContent = usuarios.length;
  document.getElementById("sinUsuarios").hidden = lista.length > 0;
  document.getElementById("resultadosUsuarios").textContent = `Mostrando ${lista.length} de ${usuarios.length} colaboradores`;
  tabla.innerHTML = lista.map((usuario) => `<tr>
    <td class="person"><strong>${escapar(usuario.nombre)}</strong><span>${escapar(usuario.area)}</span></td>
    <td>${escapar(usuario.nombre_empresa)}</td>
    <td>${escapar(usuario.correo)}<br>${escapar(usuario.telefono)}</td>
    <td><div class="actions">
      <a class="view icon-button" href="/perfil/${encodeURIComponent(usuario.token)}" target="_blank" rel="noopener"><i data-lucide="eye" aria-hidden="true"></i>Ver</a>
      <button class="edit icon-button" type="button" data-editar="${escapar(usuario.token)}"><i data-lucide="pencil" aria-hidden="true"></i>Editar</button>
      <button class="delete icon-button" type="button" data-eliminar="${escapar(usuario.token)}"><i data-lucide="trash-2" aria-hidden="true"></i>Eliminar</button>
    </div></td>
  </tr>`).join("");
  cargarIconos();
}

function actualizarEstadoFoto(mensaje, tipo = "") {
  editFotoEstado.textContent = mensaje;
  editFotoEstado.className = `edit-photo-status${tipo ? ` ${tipo}` : ""}`;
}

function reiniciarFotoEdicion() {
  versionFotoEdicion += 1;
  fotoEditada = null;
  recorteFotoEdicion = null;
  editFoto.value = "";
  editFotoPreview.removeAttribute("src");
  editFotoPreview.hidden = true;
  actualizarEstadoFoto("Se conservará la fotografía actual.");
}

function validarArchivoFoto(archivo) {
  const extension = archivo.name.split(".").pop().toLowerCase();
  if (!formatosImagen.includes(extension)) return "La fotografía debe ser JPG, PNG o WEBP";
  if (archivo.size > maximoImagenBytes) return "La fotografía original no puede superar 2 MB";
  return "";
}

async function procesarFotoEdicion(archivo) {
  if (fotoEditada) return fotoEditada;
  if (recorteFotoEdicion) return recorteFotoEdicion;

  const versionActual = ++versionFotoEdicion;
  actualizarEstadoFoto("Quitando el fondo de la nueva fotografía...", "procesando");
  recorteFotoEdicion = removerFondoPersona(archivo)
    .then(async (foto) => {
      if (versionActual !== versionFotoEdicion || editFoto.files[0] !== archivo) return foto;
      fotoEditada = foto;
      editFotoPreview.src = await archivoADataUrl(foto);
      editFotoPreview.hidden = false;
      actualizarEstadoFoto("Nueva fotografía lista para guardar.", "listo");
      return foto;
    })
    .catch((error) => {
      if (versionActual === versionFotoEdicion) actualizarEstadoFoto(error.message, "error");
      throw error;
    })
    .finally(() => {
      if (versionActual === versionFotoEdicion) recorteFotoEdicion = null;
    });
  return recorteFotoEdicion;
}

editFoto.addEventListener("change", () => {
  const archivo = editFoto.files[0];
  versionFotoEdicion += 1;
  fotoEditada = null;
  recorteFotoEdicion = null;
  editFotoPreview.hidden = true;
  if (!archivo) return actualizarEstadoFoto("Se conservará la fotografía actual.");
  const error = validarArchivoFoto(archivo);
  if (error) {
    editFoto.value = "";
    actualizarEstadoFoto(error, "error");
    return;
  }
  procesarFotoEdicion(archivo).catch(() => {});
});

document.querySelectorAll("[data-tab]").forEach((boton) => {
  boton.onclick = () => {
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === boton));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === boton.dataset.tab));
  };
});

document.getElementById("buscar").oninput = (evento) => renderUsuarios(evento.target.value);
filtroEmpresa.innerHTML = '<option value="">Todas las empresas</option>' + EMPRESAS.map((empresa) => `<option value="${empresa.id}">${empresa.nombre}</option>`).join("");
filtroEmpresa.onchange = () => renderUsuarios(document.getElementById("buscar").value);
ordenUsuarios.onchange = () => renderUsuarios(document.getElementById("buscar").value);

document.getElementById("cerrarSesion").onclick = async () => {
  try {
    await solicitarJson("/api/admin/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    window.location.replace("/?sesion=cerrada");
  } catch (error) {
    mostrarNotificacion(error.message, "error");
  }
};

tabla.onclick = (evento) => {
  const accion = evento.target.closest("[data-eliminar], [data-editar]");
  if (!accion) return;
  const token = accion.dataset.eliminar || accion.dataset.editar;
  const usuario = usuarios.find((item) => item.token === token);
  if (!usuario) return mostrarNotificacion("El perfil seleccionado ya no está disponible.", "error");

  if (accion.dataset.eliminar) {
    usuarioAEliminar = usuario;
    document.getElementById("mensajeEliminacion").textContent = `Estás a punto de eliminar el perfil de ${usuario.nombre}. Esta acción no se puede deshacer.`;
    confirmarEliminacion.showModal();
    return;
  }

  for (const [id, valor] of Object.entries({ editToken: usuario.token, editNombre: usuario.nombre, editArea: usuario.area, editDescripcion: usuario.descripcion || "", editTelefono: usuario.telefono, editCorreo: usuario.correo })) {
    document.getElementById(id).value = valor;
  }
  document.getElementById("editEmpresa").innerHTML = opcionesEmpresas(usuario.empresaId);
  reiniciarFotoEdicion();
  editor.showModal();
};

document.getElementById("cancelarEliminacion").onclick = () => {
  usuarioAEliminar = null;
  confirmarEliminacion.close();
};

document.getElementById("aceptarEliminacion").onclick = async () => {
  if (!usuarioAEliminar) return;
  const usuario = usuarioAEliminar;
  const boton = document.getElementById("aceptarEliminacion");
  boton.disabled = true;
  try {
    await solicitarJson(`/api/usuarios/${encodeURIComponent(usuario.token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "eliminar" }),
    });
    confirmarEliminacion.close();
    usuarioAEliminar = null;
    await cargarUsuarios();
    mostrarNotificacion(`El perfil de ${usuario.nombre} fue eliminado correctamente.`);
  } catch (error) {
    mostrarNotificacion(error.message, "error");
  } finally {
    boton.disabled = false;
  }
};

document.getElementById("formEditor").onsubmit = async (evento) => {
  evento.preventDefault();
  const correo = document.getElementById("editCorreo").value.trim().toLowerCase();
  const telefono = document.getElementById("editTelefono").value.trim();
  if (!dominioCorporativo.test(correo)) return mostrarNotificacion("Usa un correo corporativo autorizado.", "error");
  if (!/^\d{10}$/.test(telefono)) return mostrarNotificacion("El teléfono debe tener 10 dígitos.", "error");

  const boton = evento.submitter || evento.currentTarget.querySelector('[type="submit"]');
  const contenidoBoton = boton.innerHTML;
  boton.disabled = true;
  try {
    let foto;
    if (editFoto.files[0]) {
      boton.textContent = "Procesando foto...";
      foto = await archivoADataUrl(await procesarFotoEdicion(editFoto.files[0]));
    }
    boton.textContent = "Guardando...";
    const token = document.getElementById("editToken").value;
    const datos = {
      accion: "editar",
      nombre: document.getElementById("editNombre").value.trim(),
      area: document.getElementById("editArea").value.trim(),
      descripcion: document.getElementById("editDescripcion").value.trim(),
      telefono,
      correo,
      empresaId: Number(document.getElementById("editEmpresa").value),
      ...(foto ? { foto } : {}),
    };
    await solicitarJson(`/api/usuarios/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    editor.close();
    await cargarUsuarios();
    mostrarNotificacion(`El perfil de ${datos.nombre} fue editado correctamente.`);
  } catch (error) {
    mostrarNotificacion(error.message, "error");
  } finally {
    boton.disabled = false;
    boton.innerHTML = contenidoBoton;
  }
};

document.getElementById("cerrarEditor").onclick = () => editor.close();
document.getElementById("cancelarEditor").onclick = () => editor.close();

const configEmpresa = document.getElementById("configEmpresa");
configEmpresa.innerHTML = opcionesEmpresas(2);

async function cargarConfiguraciones() {
  configuraciones = await solicitarJson("/api/configuraciones");
  mostrarConfig();
}

function mostrarConfig() {
  const configuracion = configuraciones.find((item) => item.empresaId === Number(configEmpresa.value)) || { redes: {} };
  for (const red of ["facebook", "instagram", "twitter", "linkedin"]) document.getElementById(red).value = configuracion.redes?.[red] || REDES_DECORCERAMICA[red] || "";
  document.getElementById("configMensaje").textContent = "";
}

configEmpresa.onchange = mostrarConfig;
document.getElementById("formConfiguracion").onsubmit = async (evento) => {
  evento.preventDefault();
  const empresaId = Number(configEmpresa.value);
  const redes = Object.fromEntries(["facebook", "instagram", "twitter", "linkedin"].map((red) => [red, document.getElementById(red).value.trim()]));
  try {
    await solicitarJson("/api/configuraciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresaId, plantillaId: empresaId, redes, colores: {} }),
    });
    await cargarConfiguraciones();
    document.getElementById("configMensaje").textContent = "Enlaces guardados correctamente.";
  } catch (error) {
    mostrarNotificacion(error.message, "error");
  }
};

cargarIconos();
try {
  await Promise.all([cargarUsuarios(), cargarConfiguraciones()]);
} catch (error) {
  mostrarNotificacion(error.message, "error");
} finally {
  const cargadorPagina = document.getElementById("cargadorPagina");
  cargadorPagina.classList.add("hidden");
  setTimeout(() => cargadorPagina.remove(), 350);
}
