const token = window.location.pathname.split("/").pop(); // Aqui se extrae el token de la url
import { PLANTILLAS, REDES_DECORCERAMICA } from "../datos-locales.js";

async function reforzarOpacidadFoto(foto) {
    if (!foto?.startsWith("data:image/png")) return foto;

    try {
        const imagen = new Image();
        imagen.src = foto;
        await imagen.decode();
        const lienzo = document.createElement("canvas");
        lienzo.width = imagen.naturalWidth;
        lienzo.height = imagen.naturalHeight;
        const contexto = lienzo.getContext("2d", { willReadFrequently: true });
        contexto.drawImage(imagen, 0, 0);
        const pixeles = contexto.getImageData(0, 0, lienzo.width, lienzo.height);

        for (let indice = 3; indice < pixeles.data.length; indice += 4) {
            const alfaOriginal = pixeles.data[indice];
            if (alfaOriginal === 0 || alfaOriginal === 255) continue;
            if (alfaOriginal <= 8) {
                pixeles.data[indice] = 0;
                continue;
            }
            if (alfaOriginal >= 55) {
                pixeles.data[indice] = 255;
                continue;
            }
            const normalizada = (alfaOriginal - 8) / (55 - 8);
            pixeles.data[indice] = Math.round(normalizada * normalizada * (3 - 2 * normalizada) * 255);
        }

        contexto.putImageData(pixeles, 0, 0);
        return lienzo.toDataURL("image/png");
    } catch (error) {
        console.warn("No fue posible reforzar la opacidad de la foto:", error);
        return foto;
    }
}

const ocultarCargador = () => {
    const cargador = document.getElementById("cargadorPagina");
    if (!cargador) return;
    cargador.classList.add("hidden");
    setTimeout(() => cargador.remove(), 350);
};

    // Configuración de empresas css y elementos para la personalizacion individual
    const empresas = {
        "Novacasa": {
        css: "/css/novacasa/perfiles/vistaNovacasa.css",
        carpeta: "/imagenes/novacasa",
        iconos: {
            telefono: "telefono.png",
            correo: "correo.png",
            decorceramica: "Decorceramica.png",
            novacasa: "Novacasa.png"
            }
        },
        "Decorceramica": {
        css: "/css/decorceramica/perfiles/vistaDecorceramica.css",
        carpeta: "/imagenes/decorceramica",
        redes: {
            facebook: "https://www.facebook.com/IdeasDECORCERAMICA/",
            instagram: "https://www.instagram.com/decorceramica_oficial/",
            twitter: "https://x.com/DECORTWITT",
            linkedin: "https://co.linkedin.com/in/decorceramica-oficial-491164126"
        },
        iconos: {
            telefono: "telefono.png",
            correo: "correo.png",
            decorceramica: "decorceramica.png",
            novacasa: "novacasa.png"
            }
        },
        "KLP": {
        css: "/css/klp/perfiles/vistaKlp.css",
        carpeta: "/imagenes/klp",
        iconos: {
            telefono: "telefono.png",
            correo: "correo.png",
            decorceramica: "decorceramica.png",
            novacasa: "novacasa.png"
            }
        },
        "Klipen": {
        css: "/css/klipen/perfiles/vistaKlipen.css",
        carpeta: "/imagenes/klipen",
        iconos: {
            telefono: "telefono.png",
            correo: "correo.png",
            decorceramica: "decorceramica.png",
            novacasa: "novacasa.png"
            }
        },
        "Kohler": {
        css: "/css/hohler/perfiles/vistaKohler.css",
        carpeta: "/imagenes/kohler",
        iconos: {
            telefono: "telefono.png",
            correo: "correo.png",
            decorceramica: "decorceramica.png",
            novacasa: "novacasa.png"
            }
        },
        "Decor Corporativo": {
        css: "/css/decor_corporativo/perfiles/vistaDecorCoorporativo.css",
        carpeta: "/imagenes/decor_corporativo",
        iconos: {
            telefono: "telefono.png",
            correo: "correo.png",
            decorceramica: "decorceramica.png",
            novacasa: "novacasa.png"
            }
        },
    };
    Promise.all([fetch(`/api/usuarios/${token}`), fetch("/api/configuraciones")])
        .then(async ([respuestaUsuario, respuestaConfig]) => {
            if (!respuestaUsuario.ok) {
                window.location.href = "/404";
                return;
            }
            const data = await respuestaUsuario.json();
            const configuraciones = respuestaConfig.ok ? await respuestaConfig.json() : [];
            // Aqui es para completar los datos en la pagina que se traen a travez del fetch
            document.getElementById("nombreCompleto").textContent = data.nombre;
            document.getElementById("areaResponsable").textContent = data.area;
            document.getElementById("descripcion").textContent = data.descripcion;
            document.getElementById("telefono").textContent = `+57 ${data.telefono}`;
            document.getElementById("correo").textContent = data.correo;
            document.getElementById("fotoPerfil").src = await reforzarOpacidadFoto(data.foto);
            document.getElementById("titulo").textContent = `Perfil - ${data.nombre_empresa}`;
            // Seleccionar empresa
            const empresaBase = empresas[data.nombre_empresa];
            const configGuardada = configuraciones.find((item) => item.empresaId === data.empresaId) || { plantillaId: data.empresaId, redes: {} };
            const plantilla = PLANTILLAS.find((item) => item.id === data.empresaId) || PLANTILLAS[0];
            const configuracion = { ...configGuardada, ...plantilla, redes: { ...REDES_DECORCERAMICA, ...(configGuardada.redes || {}) } };
            if (!empresaBase || !configuracion) {
                window.location.href = "/404";
                return;
            }
            const empresa = {
                ...empresaBase,
                css: configuracion.css,
                carpeta: configuracion.carpeta,
                redes: configuracion.redes,
                iconos: {
                    telefono: "telefono.png",
                    correo: "correo.png",
                    decorceramica: data.empresaId === 2 ? "Decorceramica.png" : "decorceramica.png",
                    novacasa: data.empresaId === 2 ? "Novacasa.png" : "novacasa.png"
                }
            };
            // Cambiar CSS personalizado
            document.getElementById("estilosEmpresa").href = empresa.css;
            // Cambiar imágenes personalizadas
            document.getElementById("logoEmpresa").src = `${empresa.carpeta}/logo.png`;
            document.getElementById("fondoEmpresa").src = `${empresa.carpeta}/abstracto.png`;
            // Cambiar iconos personalizados
            document.getElementById("iconoTelefono").src = `${empresa.carpeta}/${empresa.iconos.telefono}`;
            document.getElementById("iconoCorreo").src = `${empresa.carpeta}/${empresa.iconos.correo}`;
            document.getElementById("iconoDecorceramica").src = `${empresa.carpeta}/${empresa.iconos.decorceramica}`;
            document.getElementById("iconoNovacasa").src = `${empresa.carpeta}/${empresa.iconos.novacasa}`;
            document.getElementById("iconoDecorceramica").src = `${empresa.carpeta}/${empresa.iconos.decorceramica}`;
            // Redes sociales dinámicas
            const redes = [
                { nombre: "facebook", archivo: "facebook.png", etiqueta: "Facebook" },
                { nombre: "instagram", archivo: "instagram.png", etiqueta: "Instagram" },
                { nombre: "twitter", archivo: "twitter.png", etiqueta: "X" },
                { nombre: "linkedin", archivo: "linkedin.png", etiqueta: "LinkedIn" }
            ];
            const redesDiv = document.getElementById("redesSociales");
            redesDiv.innerHTML = "";
            redes.forEach(red => {
                const a = document.createElement("a");
                const enlace = empresa.redes?.[red.nombre];
                a.href = enlace || "#";
                a.setAttribute("aria-label", red.etiqueta);
                if (enlace) {
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                } else {
                    a.addEventListener("click", (evento) => evento.preventDefault());
                }
                a.innerHTML = `<img src="${empresa.carpeta}/${red.archivo}" alt="${red.etiqueta}">`;
                redesDiv.appendChild(a);
            });
            // Aqui se oculta el skeleton y muestra la informacion de la vcard
            const skeleton = document.getElementById("skeleton-formulario");
            const card = document.querySelector(".card");
            const imagenes = Array.from(document.images).map(
                (img) =>
                    new Promise((resolve) => {
                        if (img.complete) resolve();
                        else {
                            img.addEventListener("load", resolve, { once: true });
                            img.addEventListener("error", resolve, { once: true });
                            setTimeout(resolve, 3000);
                        }
                    })
            );
            
            Promise.all(imagenes).then(()=>{
                if (skeleton && card) {
                    skeleton.classList.remove("skeleton-visible");
                    skeleton.classList.add("skeleton-hidden");
                    card.style.display = "block";
                    ocultarCargador();
                    setTimeout(() => {
                        card.classList.add("visible");
                    }, 100);
                }
            });
        })
    // Manejo de errores en caso de no obtener los datos del backend
    .catch(err => {
    console.error("Error al cargar perfil:", err);
    ocultarCargador();
    window.location.href = "/404";
    document.getElementById("nombreCompleto").textContent = "Error al cargar datos";
});
