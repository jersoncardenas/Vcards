const dialogo = document.getElementById("loginAdmin");
const error = document.getElementById("errorLogin");

document.getElementById("abrirLogin").addEventListener("click", async () => {
  const sesion = await fetch("/api/admin/session").then((respuesta) => respuesta.json()).catch(() => ({ autenticado:false }));
  if (sesion.autenticado) {
    window.location.href = "/admin";
    return;
  }
  error.hidden = true;
  dialogo.showModal();
  document.getElementById("usuarioAdmin").focus();
});

document.getElementById("cancelarLogin").addEventListener("click", () => dialogo.close());
document.getElementById("mostrarClave").addEventListener("click", (evento) => {
  const campo = document.getElementById("claveAdmin");
  const visible = campo.type === "text";
  campo.type = visible ? "password" : "text";
  evento.currentTarget.textContent = visible ? "Mostrar" : "Ocultar";
});
document.getElementById("formLoginAdmin").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const usuario = document.getElementById("usuarioAdmin").value.trim();
  const clave = document.getElementById("claveAdmin").value;
  const respuesta = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ usuario, clave }) });
  if (!respuesta.ok) {
    error.hidden = false;
    return;
  }
  window.location.href = "/admin";
});

if (new URLSearchParams(window.location.search).get("admin") === "login") {
  document.getElementById("abrirLogin").click();
}
