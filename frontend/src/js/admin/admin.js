import { EMPRESAS, REDES_DECORCERAMICA } from "../datos-locales.js";
import { createIcons, CheckCircle2, CircleAlert, Eye, House, Link, LogOut, Pencil, Save, Trash2, TriangleAlert, UserRoundPen, Users, X } from "lucide";

const cargarIconos = () => createIcons({ icons: { CheckCircle2, CircleAlert, Eye, House, Link, LogOut, Pencil, Save, Trash2, TriangleAlert, UserRoundPen, Users, X } });

const sesion = await fetch("/api/admin/session").then(r => r.json()).catch(() => ({ autenticado:false }));
if (!sesion.autenticado) window.location.replace("/?admin=login");
const dominioCorporativo = /^[^\s@]+@(novacasacenter\.com|grupodecor\.com|klipengroup\.com|klpcomercial\.com|decorceramica\.com)$/i;
const tabla = document.getElementById("tablaUsuarios"), editor = document.getElementById("editor");
const filtroEmpresa = document.getElementById("filtroEmpresa");
const confirmarEliminacion = document.getElementById("confirmarEliminacion");
const notificacion = document.getElementById("notificacion");
let usuarios = [], configuraciones = [];
let usuarioAEliminar = null;
let temporizadorNotificacion;
const escapar = (v="") => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
const opcionesEmpresas = id => EMPRESAS.map(e=>`<option value="${e.id}" ${Number(id)===e.id?"selected":""}>${e.nombre}</option>`).join("");
function mostrarNotificacion(mensaje, tipo="success") { clearTimeout(temporizadorNotificacion); notificacion.className=`toast ${tipo} visible`; notificacion.innerHTML=`<i data-lucide="${tipo==="success"?"check-circle-2":"circle-alert"}" aria-hidden="true"></i><span>${escapar(mensaje)}</span>`; cargarIconos(); temporizadorNotificacion=setTimeout(()=>notificacion.classList.remove("visible"),4000); }

async function cargarUsuarios() {
  const respuesta=await fetch("/api/usuarios");
  if(respuesta.status===401)return window.location.replace("/?admin=login");
  usuarios=await respuesta.json(); renderUsuarios(document.getElementById("buscar").value);
}
function renderUsuarios(filtro="") {
  const empresaId=Number(filtroEmpresa.value||0);
  const lista=usuarios.filter(u=>(!empresaId||u.empresaId===empresaId)&&`${u.nombre} ${u.correo} ${u.area} ${u.nombre_empresa}`.toLowerCase().includes(filtro.toLowerCase()));
  document.getElementById("totalPerfiles").textContent=usuarios.length; document.getElementById("sinUsuarios").hidden=lista.length>0;
  document.getElementById("resultadosUsuarios").textContent=`Mostrando ${lista.length} de ${usuarios.length} colaboradores`;
  tabla.innerHTML=lista.map(u=>`<tr><td class="person"><strong>${escapar(u.nombre)}</strong><span>${escapar(u.area)}</span></td><td>${escapar(u.nombre_empresa)}</td><td>${escapar(u.correo)}<br>${escapar(u.telefono)}</td><td><div class="actions"><a class="view icon-button" href="/perfil/${encodeURIComponent(u.token)}" target="_blank" rel="noopener"><i data-lucide="eye" aria-hidden="true"></i>Ver</a><button class="edit icon-button" data-editar="${escapar(u.token)}"><i data-lucide="pencil" aria-hidden="true"></i>Editar</button><button class="delete icon-button" data-eliminar="${escapar(u.token)}"><i data-lucide="trash-2" aria-hidden="true"></i>Eliminar</button></div></td></tr>`).join("");
  cargarIconos();
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===b.dataset.tab));});
document.getElementById("buscar").oninput=e=>renderUsuarios(e.target.value);
filtroEmpresa.innerHTML='<option value="">Todas las empresas</option>'+EMPRESAS.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join("");
filtroEmpresa.onchange=()=>renderUsuarios(document.getElementById("buscar").value);
document.getElementById("cerrarSesion").onclick=async()=>{await fetch("/api/admin/logout",{method:"POST"});window.location.replace("/");};
tabla.onclick=e=>{const accion=e.target.closest("[data-eliminar], [data-editar]");if(!accion)return;const token=accion.dataset.eliminar||accion.dataset.editar;const usuario=usuarios.find(u=>u.token===token);if(!usuario)return;if(accion.dataset.eliminar){usuarioAEliminar=usuario;document.getElementById("mensajeEliminacion").textContent=`Estás a punto de eliminar el perfil de ${usuario.nombre}. Esta acción no se puede deshacer.`;confirmarEliminacion.showModal();return;}for(const [id,v] of Object.entries({editToken:usuario.token,editNombre:usuario.nombre,editArea:usuario.area,editDescripcion:usuario.descripcion||"",editTelefono:usuario.telefono,editCorreo:usuario.correo}))document.getElementById(id).value=v;document.getElementById("editEmpresa").innerHTML=opcionesEmpresas(usuario.empresaId);editor.showModal();};
document.getElementById("cancelarEliminacion").onclick=()=>{usuarioAEliminar=null;confirmarEliminacion.close();};
document.getElementById("aceptarEliminacion").onclick=async()=>{if(!usuarioAEliminar)return;const usuario=usuarioAEliminar;const boton=document.getElementById("aceptarEliminacion");boton.disabled=true;try{const r=await fetch(`/api/usuarios/${usuario.token}`,{method:"DELETE"});if(!r.ok)throw new Error();confirmarEliminacion.close();usuarioAEliminar=null;await cargarUsuarios();mostrarNotificacion(`El perfil de ${usuario.nombre} fue eliminado correctamente.`);}catch{mostrarNotificacion("No fue posible eliminar el perfil.","error");}finally{boton.disabled=false;}};
document.getElementById("formEditor").onsubmit=async e=>{e.preventDefault();const correo=document.getElementById("editCorreo").value.trim().toLowerCase(),telefono=document.getElementById("editTelefono").value.trim();if(!dominioCorporativo.test(correo))return mostrarNotificacion("Usa un correo corporativo autorizado.","error");if(!/^\d{10}$/.test(telefono))return mostrarNotificacion("El teléfono debe tener 10 dígitos.","error");const token=document.getElementById("editToken").value,datos={nombre:document.getElementById("editNombre").value.trim(),area:document.getElementById("editArea").value.trim(),descripcion:document.getElementById("editDescripcion").value.trim(),telefono,correo,empresaId:Number(document.getElementById("editEmpresa").value)};const r=await fetch(`/api/usuarios/${token}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(datos)});if(!r.ok)return mostrarNotificacion("No fue posible guardar los cambios.","error");editor.close();await cargarUsuarios();mostrarNotificacion(`El perfil de ${datos.nombre} fue editado correctamente.`);};
document.getElementById("cerrarEditor").onclick=()=>editor.close(); document.getElementById("cancelarEditor").onclick=()=>editor.close();

const configEmpresa=document.getElementById("configEmpresa");configEmpresa.innerHTML=opcionesEmpresas(1);
async function cargarConfiguraciones(){configuraciones=await fetch("/api/configuraciones").then(r=>r.json());mostrarConfig();}
function mostrarConfig(){const c=configuraciones.find(x=>x.empresaId===Number(configEmpresa.value))||{redes:{}};for(const red of ["facebook","instagram","twitter","linkedin"])document.getElementById(red).value=c.redes?.[red]||REDES_DECORCERAMICA[red]||"";document.getElementById("configMensaje").textContent="";}
configEmpresa.onchange=mostrarConfig;
document.getElementById("formConfiguracion").onsubmit=async e=>{e.preventDefault();const empresaId=Number(configEmpresa.value);const redes=Object.fromEntries(["facebook","instagram","twitter","linkedin"].map(red=>[red,document.getElementById(red).value.trim()]));const datos={empresaId,plantillaId:empresaId,redes,colores:{}};const r=await fetch("/api/configuraciones",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(datos)});if(!r.ok)return alert("No fue posible guardar los enlaces.");await cargarConfiguraciones();document.getElementById("configMensaje").textContent="Enlaces guardados correctamente.";};
cargarIconos();
try {
  await Promise.all([cargarUsuarios(),cargarConfiguraciones()]);
} finally {
  const cargadorPagina=document.getElementById("cargadorPagina");
  cargadorPagina.classList.add("hidden");
  setTimeout(()=>cargadorPagina.remove(),350);
}
