import QRCodeStyling from "qr-code-styling";
import { PLANTILLAS } from "../datos-locales.js";

const token = document.body.dataset.token; // Obtengo el token
console.log("Token recibido:", token); 

async function generarQrConLogo(url, logoSrc) {
  const qr = new QRCodeStyling({
    width: 600,
    height: 600,
    type: "canvas",
    data: url,
    image: logoSrc,
    margin: 20,
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { color: "#000000", type: "dots" },
    cornersSquareOptions: { color: "#000000", type: "extra-rounded" },
    cornersDotOptions: { color: "#000000", type: "dot" },
    backgroundOptions: { color: "#ffffff" },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 10,
      imageSize: 0.24,
      hideBackgroundDots: true,
    },
  });
  const archivo = await qr.getRawData("png");
  return URL.createObjectURL(archivo);
}

// Aqui se establece una conexion con el backend para obtener los datos por medio del token obtenido
Promise.all([fetch(`/api/usuarios/${token}`)])
  // Si la direccion se encuentra bien se llenan los siguientes datos obtenidos a la pagina
  .then(async ([respuestaUsuario]) => {
    if (!respuestaUsuario.ok) {
      window.location.href = "/404";
      return;
    }
    const data = await respuestaUsuario.json();
    const saludo = document.getElementById("saludo");
    const img = document.getElementById("qr");
    const btn = document.getElementById("descargar");

    saludo.textContent = `Hola ${data.nombre}, se ha generado con éxito tu QR`;
    const configuracion = PLANTILLAS.find((item) => item.id === data.empresaId) || PLANTILLAS[0];
    img.src = await generarQrConLogo(
      `${window.location.origin}/perfil/${token}`,
      configuracion?.qrLogo || "/imagenes/decorceramica.png"
    );
    img.style.display = "block";
    btn.style.display = "inline-block";

    btn.onclick = () => {
      const a = document.createElement("a");
      a.href = img.src;
      a.download = `QR_${data.nombre}.png`;
      a.click();
    };
  })
  
  .catch(err => {
    console.error(err);
    window.location.href = "/404";
  });
