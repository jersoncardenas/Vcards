import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

const RUTA_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const RUTA_MODELO = "/mediapipe/models/selfie_segmenter.tflite";
const MAXIMO_LADO = 1000;

let promesaSegmentador;

export function prepararRecortePersona() {
  if (!promesaSegmentador) {
    promesaSegmentador = (async () => {
      const vision = await FilesetResolver.forVisionTasks(RUTA_WASM);
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: RUTA_MODELO, delegate: "CPU" },
        runningMode: "IMAGE",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    })();
  }
  return promesaSegmentador;
}

async function cargarImagen(archivo) {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    return { imagen: bitmap, cerrar: () => bitmap.close() };
  }

  const url = URL.createObjectURL(archivo);
  const imagen = new Image();
  imagen.src = url;
  await imagen.decode();
  return { imagen, cerrar: () => URL.revokeObjectURL(url) };
}

function crearLienzo(ancho, alto) {
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  return lienzo;
}

function mascaraDePersona(segmentador, resultado) {
  const mascaras = resultado.confidenceMasks || [];
  if (!mascaras.length) throw new Error("El modelo no devolvió una máscara de persona");

  const etiquetas = segmentador.getLabels().map((etiqueta) => etiqueta.toLowerCase());
  const indicePersona = etiquetas.findIndex((etiqueta) => etiqueta.includes("person"));
  return mascaras[indicePersona >= 0 ? indicePersona : mascaras.length - 1];
}

function crearMascaraSuave(mascara) {
  const lienzo = crearLienzo(mascara.width, mascara.height);
  const contexto = lienzo.getContext("2d");
  const pixeles = contexto.createImageData(mascara.width, mascara.height);
  const confianza = mascara.getAsFloat32Array();

  for (let indice = 0; indice < confianza.length; indice += 1) {
    // La persona debe quedar opaca. Solo conservamos transparencia en la
    // pequeña franja de confianza que corresponde al borde del cabello/cuerpo.
    const normalizada = Math.max(0, Math.min(1, (confianza[indice] - 0.06) / 0.24));
    const alfa = Math.round(normalizada * normalizada * (3 - 2 * normalizada) * 255);
    const posicion = indice * 4;
    pixeles.data[posicion] = 255;
    pixeles.data[posicion + 1] = 255;
    pixeles.data[posicion + 2] = 255;
    pixeles.data[posicion + 3] = alfa;
  }

  contexto.putImageData(pixeles, 0, 0);
  return lienzo;
}

function limitesTransparentes(lienzo) {
  const contexto = lienzo.getContext("2d", { willReadFrequently: true });
  const { data } = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
  let minimoX = lienzo.width;
  let minimoY = lienzo.height;
  let maximoX = -1;
  let maximoY = -1;

  for (let y = 0; y < lienzo.height; y += 1) {
    for (let x = 0; x < lienzo.width; x += 1) {
      if (data[(y * lienzo.width + x) * 4 + 3] < 18) continue;
      minimoX = Math.min(minimoX, x);
      minimoY = Math.min(minimoY, y);
      maximoX = Math.max(maximoX, x);
      maximoY = Math.max(maximoY, y);
    }
  }

  if (maximoX < minimoX || maximoY < minimoY) throw new Error("No se detectó una persona en la fotografía");
  const anchoPersona = maximoX - minimoX + 1;
  const altoPersona = maximoY - minimoY + 1;
  const margenX = Math.round(anchoPersona * 0.05);
  const margenY = Math.round(altoPersona * 0.04);
  const x = Math.max(0, minimoX - margenX);
  const y = Math.max(0, minimoY - margenY);
  const derecha = Math.min(lienzo.width, maximoX + margenX + 1);
  const abajo = Math.min(lienzo.height, maximoY + margenY + 1);
  return { x, y, ancho: derecha - x, alto: abajo - y };
}

function lienzoAPng(lienzo) {
  return new Promise((resolver, rechazar) => {
    lienzo.toBlob((archivo) => {
      if (archivo) resolver(archivo);
      else rechazar(new Error("No fue posible generar la fotografía recortada"));
    }, "image/png");
  });
}

export async function removerFondoPersona(archivo) {
  let recursoImagen;
  let resultado;
  try {
    const segmentador = await prepararRecortePersona();
    recursoImagen = await cargarImagen(archivo);
    const anchoOriginal = recursoImagen.imagen.width || recursoImagen.imagen.naturalWidth;
    const altoOriginal = recursoImagen.imagen.height || recursoImagen.imagen.naturalHeight;
    const escala = Math.min(1, MAXIMO_LADO / Math.max(anchoOriginal, altoOriginal));
    const ancho = Math.max(1, Math.round(anchoOriginal * escala));
    const alto = Math.max(1, Math.round(altoOriginal * escala));
    const lienzo = crearLienzo(ancho, alto);
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    contexto.drawImage(recursoImagen.imagen, 0, 0, ancho, alto);

    resultado = segmentador.segment(lienzo);
    const mascara = crearMascaraSuave(mascaraDePersona(segmentador, resultado));
    contexto.globalCompositeOperation = "destination-in";
    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(mascara, 0, 0, ancho, alto);
    contexto.globalCompositeOperation = "source-over";

    const limites = limitesTransparentes(lienzo);
    const recorte = crearLienzo(limites.ancho, limites.alto);
    recorte.getContext("2d").drawImage(
      lienzo,
      limites.x,
      limites.y,
      limites.ancho,
      limites.alto,
      0,
      0,
      limites.ancho,
      limites.alto,
    );
    return await lienzoAPng(recorte);
  } catch (error) {
    console.error("Error al recortar la fotografía:", error);
    const errorVisible = new Error("No fue posible recortar el fondo de la foto. Verifica tu conexión e inténtalo de nuevo.");
    errorVisible.name = "PhotoSegmentationError";
    throw errorVisible;
  } finally {
    resultado?.close();
    recursoImagen?.cerrar();
  }
}
