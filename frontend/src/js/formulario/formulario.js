import { buscarEmpresa } from "../datos-locales.js";

document.addEventListener("DOMContentLoaded", () => {
  const empresaId = window.location.pathname.split("/").pop();
  console.log("Id detectado:", empresaId);

  // Configuraciones por empresa
  const empresas = {
    "Decorceramica": { 
      css: "/css/decorceramica/formulario/FormularioDecorceramica.css", 
      logo: "/imagenes/decorceramica.png" 
    },
    "Novacasa": { 
      css: "/css/novacasa/formulario/FormularioNovacasa.css", 
      logo: "/imagenes/novacasa.png" 
    },
    "KLP": { 
      css: "/css/klp/formulario/FormularioKlp.css", 
      logo: "/imagenes/klp.png" 
    },
    "Klipen": { 
      css: "/css/klipen/formulario/FormularioKlipen.css", 
      logo: "/imagenes/klipen.png" 
    },
    "Kohler": { 
      css: "/css/hohler/formulario/FormularioKohler.css", 
      logo: "/imagenes/kohler.png" 
    },
    "Decor Corporativo": { 
      css: "/css/decor_corporativo/formulario/FormularioDecorCoorporativo.css", 
      logo: "/imagenes/decor_coorporativo.png" 
    },
  };

  // Si no hay Id en la URL se redirige a la pagina personalizada 404
  if (!empresaId) {
    window.location.href = "/404";
    return;
  }
  // Se hace un fetch al backend para obtener los datos de la empresa
  Promise.resolve(buscarEmpresa(empresaId))
    .then((empresa) => {
      if (!empresa || empresa.error || !empresa.nombre) throw new Error("not-found");
      console.log("Empresa recibida:", empresa);

      const config = empresas[empresa.nombre];
      const estilo = document.getElementById("estilosEmpresa");
      const skeleton = document.getElementById("skeleton-formulario");
      const formContainer = document.getElementById("form-container");

      // Función para mostrar formulario y ocultar el skeleton
      const mostrarFormulario = () => {
  document.body.classList.add("formulario-visible");
  skeleton?.classList.remove("skeleton-visible");
  skeleton?.classList.add("skeleton-hidden");

  setTimeout(() => {
    // Ocultar el HTML del skeleton
    skeleton?.style.setProperty("display", "none");

    // Eliminar el CSS del skeleton para que no interfiera
    const skeletonCss = document.querySelector('link[href="/css/skeleton/skeleton.css"]');
    skeletonCss?.remove();

    // Mostrar el formulario con su layout original
    formContainer?.removeAttribute("style");
    formContainer?.classList.add("visible");
  }, 420); // coincide con la transición del skeleton
};

      document.getElementById("empresaId").value = empresaId;
      document.getElementById("page-title").textContent = `Formulario QR - ${empresa.nombre}`;

      if (config) {
        document.getElementById("logoEmpresa").src = config.logo;

        estilo.onload = () => {
          mostrarFormulario();
        };

        estilo.href = config.css;

        // Fallback por si el CSS ya está cacheado y no dispara onload
        setTimeout(() => {
          if (getComputedStyle(formContainer).opacity === "0") {
            mostrarFormulario();
          }
        }, 1500);

        // Fallback final por si todo falla
        setTimeout(mostrarFormulario, 3000);
      } else {
        mostrarFormulario();
      }

      document.getElementById("empresaId")?.addEventListener("change", (event) => {
        const nuevaEmpresa = buscarEmpresa(event.target.value);
        const nuevaConfig = nuevaEmpresa && empresas[nuevaEmpresa.nombre];
        if (!nuevaEmpresa || !nuevaConfig) return;
        document.getElementById("page-title").textContent = `Formulario QR - ${nuevaEmpresa.nombre}`;
        document.getElementById("logoEmpresa").src = nuevaConfig.logo;
        document.getElementById("estilosEmpresa").href = nuevaConfig.css;
        window.history.replaceState({}, "", `/formulario/${nuevaEmpresa.id}`);
      });
    })
    .catch((err) => {
      console.error(err);
      if (err.message === "not-found") {
        window.location.href = "/404";
      } else {
        document.getElementById("error-msg")?.style.setProperty("display", "block");
      }
    });
});
