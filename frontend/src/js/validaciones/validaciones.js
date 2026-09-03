// Almaceno en variables las urls del backend y el frontend desde el .env
import { archivoADataUrl, buscarEmpresa } from "../datos-locales.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".form");
    if (!form) return;
    const modal = document.getElementById("error-modal");
    const modalMsg = document.getElementById("error-text");
    const closeBtn = document.getElementById("close-modal");
    const submitBtn = form.querySelector('button[type="submit"]');

    // Aqui se ejecuta el modal en donde muestra los mensajes de error en caso de existir
    function showError(msg, fieldName = null) {
        if (fieldName) {
            const fld = form.querySelector(`[name="${fieldName}"]`);
            if (fld) {
                fld.classList.remove("invalid");
                void fld.offsetWidth;
                requestAnimationFrame(() => {
                    fld.classList.add("invalid");
                    fld.style.backgroundColor = "#ffebeb";
                });
            }
        }
        if (modalMsg) modalMsg.textContent = msg;
        if (modal) modal.style.display = "flex";
    }

    function clearInvalids() {
        form.querySelectorAll("input").forEach(i => i.classList.remove("invalid"));
    }

    // Aqui se elimina el color rojo de los inputs cuando se corrigen
    form.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => {
            if (input.classList.contains("invalid") && input.value.trim() !== "") {
                input.classList.remove("invalid");
            }
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            if (modal) modal.style.display = "none";
        });
    }

// ------------------------------- Aqui se establece la validacion de texto en los campos ---------------------------------- //

    const minLength = 5;
    const textRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s.,'-]+$/; // Solo letras, espacios y signos válidos
    // Evita cadenas sin sentido como muchas consonantes seguidas, repeticiones o mezcla extraña de mayúsculas y minúsculas
function esTextoSinSentido(texto) {
    const letras = texto.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ]/g, "");
    if (letras.length === 0) return true;

    const consonantes = letras.replace(/[AEIOUÁÉÍÓÚaeiouáéíóú]/g, "");
    const porcentajeConsonantes = consonantes.length / letras.length;

    // Demasiadas consonantes seguidas sin vocales
    if (porcentajeConsonantes > 0.75 && letras.length > 4) return true;

    // Repetición excesiva de letras (ej: "aaa", "bbb", "pppp")
    if (/(.)\1{2,}/.test(texto)) return true;

    // Secuencias aleatorias sin vocales ni sentido tipo “jhfgd” o “ksdjf”
    if (/^[bcdfghjklmnpqrstvwxyz]{4,}$/i.test(letras)) return true;

    return false;
}

    function validarTexto(valor, min = minLength) {
        if (valor.length < min) return `Debe tener al menos ${min} caracteres`;
        if (!textRegex.test(valor)) return `Solo se permiten letras y espacios`;
        if (esTextoSinSentido(valor)) return "Texto sin sentido e invalido";
        return "";
    }

function validarNombreCompleto(nombre) {
    const partes = nombre.trim().toLowerCase().split(/\s+/);

    if (partes.length < 2)
        return "Debe ingresar al menos un nombre y un apellido";
    if (partes.length > 4)
        return "Solo se permiten hasta dos nombres y dos apellidos";

    const textRegex = /^[a-záéíóúñ\s.,'-]+$/i;
    for (const p of partes) {
        if (p.length < 2)
            return "Cada parte del nombre debe tener al menos 2 letras";
        if (!textRegex.test(p))
            return "Solo se permiten letras válidas en el nombre";
        if (esTextoSinSentido(p))
            return "El nombre contiene texto inválido";
    }

    // Si hay exactamente dos palabras y ambas parecen nombres → probablemente falta apellido
    if (partes.length === 2) {
        const terminaEnVocal = (palabra) => /[aeiouáéíóú]$/.test(palabra);
        const terminaComoApellido = (palabra) => /[zsnrdl]$/.test(palabra);
        if (terminaEnVocal(partes[0]) && terminaEnVocal(partes[1]) && !terminaComoApellido(partes[1])) {
            return "Debe incluir al menos un apellido válido";
        }
    }

    // Heurística ligera general: al menos una palabra con terminación fuerte o larga (probable apellido)
    const tieneApellidoProbable = partes.some(p => /[zsnrdl]$/.test(p) || p.length > 5);
    if (!tieneApellidoProbable)
        return "Debe incluir al menos un apellido válido";

    return "";
}

    // Crea mensajes de error debajo de los inputs
    function mostrarErrorCampo(input, mensaje) {
        let errorEl = input.parentElement.querySelector(".error-msg");
        if (!errorEl) {
            errorEl = document.createElement("small");
            errorEl.className = "error-msg";
            errorEl.style.color = "red";
            errorEl.style.display = "block";
            errorEl.style.marginTop = "4px";
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = mensaje;
    }

    function limpiarErrorCampo(input) {
        const errorEl = input.parentElement.querySelector(".error-msg");
        if (errorEl) errorEl.remove();
    }

    // Validación en tiempo real
    form.querySelectorAll("input[type='text'], input[type='email']").forEach(input => {
        input.addEventListener("input", () => {
            const valor = input.value.trim();
            let error = "";
            if (input.name === "nombre") {
                // Primero validamos que haya nombre completo antes que la longitud
                error = validarNombreCompleto(valor);
                if (!error) error = validarTexto(valor);
            } else if (input.name === "descripcion") {
                error = validarTexto(valor);
            } else if (input.name === "area") {
                error = validarTexto(valor);
            } else if (input.name === "telefono") {
                if (!/^\d+$/.test(valor) && valor.length > 0) {
                    error = "Solo se permiten números";
                } else if (valor.length > 0 && parseInt(valor, 10) <= 0) {
                    error = "El número debe ser positivo";
                } else if (valor.length > 10){
                    error = "El numero no debe ser mayor a 10 digitos";
                }
            } else if (input.name === "correo") {
                if (valor.length > 0 && !/^[^\s@]+@(novacasacenter\.com|grupodecor\.com|klipengroup\.com|klpcomercial\.com|decorceramica\.com)$/i.test(valor)) {
                    error = "Usa un correo corporativo autorizado";
                }
            }

            if (error) {
                mostrarErrorCampo(input, error);
                input.classList.add("invalid");
                input.style.backgroundColor = "#ffebeb";
            } else {
                limpiarErrorCampo(input);
                input.classList.remove("invalid");
                input.style.backgroundColor = "#e8f0fe";
            }
        });
    });

    /// Previsualización de la imagen
    const fileInput = form.querySelector('input[type="file"]');
    const preview = form.querySelector(".preview");
    const placeholder = form.querySelector(".placeholder-text");
    if (fileInput && preview && placeholder) {
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                    preview.style.display = "block";
                    placeholder.style.display = "none";
                };
                reader.readAsDataURL(file);
            } else {
                preview.src = "";
                preview.style.display = "none";
                placeholder.style.display = "block";
            }
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearInvalids();
        // Esta validacion impide que se envie el formulario en blanco haciendo exepcion del campo oculto y de la foto
        const inputs = form.querySelectorAll("input:not([type='file']):not([type='hidden'])");
        const empty = Array.from(inputs).every(input => input.value.trim() === "");
        if (empty) {
            showError("¡¡Por favor diligencie todos los campos sin exepción!!");
            return;
        }
        // Esta es la validacion individual campo por campo en caso de estar alguno de ellos vacio
        const textInputs = form.querySelectorAll("input:not([type='file'])");
        for (const input of textInputs) {
            if (!input.value.trim()) {
                showError(`El campo ${input.name} no puede estar vacío`, input.name);
                return;
            }
        }
        // Aqui se valida la imagen si esta en uno de los formatos permitidos, el peso y que si o si seleccionen una imagen
        const imagen = form.querySelector('input[type="file"]');
        if (imagen && imagen.files.length > 0) {
            const file = imagen.files[0];
            const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
            const fileExt = file.name.split(".").pop().toLowerCase();
            // localStorage tiene un limite reducido; 2 MB deja espacio para la foto en base64.
            const maxSizeMB = 2;
            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (!allowedExtensions.includes(fileExt)) {
                showError("La imagen debe ser uno de los siguientes formatos JPG, JPEG, PNG o WEBP", imagen.name);
                return;
            }
            if (file.size > maxSizeBytes) {
                showError(`La imagen no debe superar los ${maxSizeMB}MB`, imagen.name);
                return;
            }
        } else if (imagen) {
            showError("Por favor selecciona una imagen", imagen.name);
            return;
        }
        // Validación de teléfono y correo
        const formData = new FormData(form);
        if (!formData.get("empresa_id")) {
            showError("Debes seleccionar una empresa", "empresa_id");
            return;
        }
        const telefono = (formData.get("telefono") || "").toString().trim();
        const correo = (formData.get("correo") || "").toString().trim();
        if (!telefono || !/^\d+$/.test(telefono) || parseInt(telefono, 10) <= 0) {
            showError("El teléfono debe ser un número positivo", "telefono");
            return;
        } else if (telefono.length !== 10) {
            showError("El numero debe tener exactamente 10 dígitos", "telefono");
            return;
        }
        if (!correo || !/^[^\s@]+@(novacasacenter\.com|grupodecor\.com|klipengroup\.com|klpcomercial\.com|decorceramica\.com)$/i.test(correo)) {
            showError("Correo no autorizado. Usa @novacasacenter.com, @grupodecor.com, @klipengroup.com, @klpcomercial.com o @decorceramica.com", "correo");
            return;
        }

        // Validaciones adicionales antes del envío
        const nombre = (formData.get("nombre") || "").trim();
        const descripcion = (formData.get("descripcion") || "").trim();
        const area = (formData.get("area") || "").trim();
        let errorMsg = validarNombreCompleto(nombre) || validarTexto(nombre);
        if (errorMsg) { showError(`Nombre: ${errorMsg}`, "nombre"); return; }
        errorMsg = validarTexto(descripcion);
        if (errorMsg) { showError(`Descripción: ${errorMsg}`, "descripcion"); return; }
        errorMsg = validarTexto(area);
        if (errorMsg) { showError(`Cargo: ${errorMsg}`, "area"); return; }
        // Esto evita que se envie muchas veces el formulario
        if (submitBtn) submitBtn.disabled = true;
        try {
            const empresa = buscarEmpresa(formData.get("empresa_id"));
            if (!empresa) {
                showError("La empresa seleccionada no es valida");
                return;
            }

            const foto = await archivoADataUrl(imagen.files[0]);
            const respuesta = await fetch("/api/usuarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, descripcion, area, telefono, correo, foto, empresaId: empresa.id })
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok) {
                showError(resultado.error || "No fue posible guardar el perfil");
                return;
            }
            window.location.href = `/mostrarQR/${resultado.token}`;
        } catch (err) {
            console.error("Error al guardar:", err);
            showError("No fue posible conectar con la base de datos");
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});

// Esto es solo detalle del diseño para quitar el color rojo de los inputs al escribir
document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
        if (input.value.trim() !== "") {
            input.classList.remove("invalid");
            input.style.removeProperty("background-color");
            input.style.removeProperty("border-bottom-color");
            input.style.backgroundColor = "#e8f0fe";
        }
    });
});
