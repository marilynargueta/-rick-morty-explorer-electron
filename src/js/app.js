// ============================================================
// app.js — Lógica de la interfaz (proceso de renderizado)
// Consume la API de Rick and Morty con fetch + async/await,
// y pinta las tarjetas con <template> + DocumentFragment.
// ============================================================

const API_URL = "https://rickandmortyapi.com/api/character";

const card = document.querySelector("#card-dinamica");
const templateCard = document.querySelector("#template-card").content;
const mensajeError = document.querySelector("#mensaje-error");
const btnAnterior = document.querySelector("#btn-anterior");
const btnSiguiente = document.querySelector("#btn-siguiente");
const paginaActualEl = document.querySelector("#pagina-actual");

const btnReintentar = document.querySelector("#btn-reintentar");

let paginaActual = 1;
let totalPaginas = 1;
let paginaPedida = 1;          // ultima pagina solicitada (para "Reintentar")
let idPeticion = 0;            // evita que una respuesta lenta pise a una mas reciente
const cachePaginas = new Map(); // pagina -> datos ya descargados

const TIMEOUT_MS = 10000;
const MAX_REINTENTOS = 3;
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

document.addEventListener("DOMContentLoaded", () => {
    // Version de Electron expuesta de forma segura desde preload.js
    if (window.appInfo) {
        document.querySelector("#electron-version").textContent =
            `Electron v${window.appInfo.electron}`;
    }
    fetchData(paginaActual);
});

// ------------------------------------------------------------
// fetch con timeout y reintentos. La API es gratuita y a veces
// responde lento, con 429 (limite) o 5xx: se reintenta con espera
// creciente (0.8 s, 1.6 s...) antes de mostrar el error.
// ------------------------------------------------------------
async function fetchConReintentos(url) {
    let ultimoError;

    for (let intento = 0; intento < MAX_REINTENTOS; intento++) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

            if (response.ok) return await response.json();

            // 404 = pagina inexistente, 4xx (menos 429) = error definitivo
            if (response.status !== 429 && response.status < 500) {
                const error = new Error(`La API respondió con el estado ${response.status}`);
                error.definitivo = true;
                throw error;
            }
            ultimoError = new Error(
                response.status === 429
                    ? "Demasiadas peticiones a la API, espera unos segundos"
                    : `El servidor de la API tiene problemas (${response.status})`
            );
        } catch (error) {
            if (error.definitivo) throw error;
            ultimoError = error.name === "TimeoutError"
                ? new Error("La API tardó demasiado en responder")
                : new Error("No hay conexión con la API");
        }
        if (intento < MAX_REINTENTOS - 1) await esperar(800 * 2 ** intento);
    }
    throw ultimoError;
}

// ------------------------------------------------------------
// Consulta a la API (mismo patron que la version web)
// ------------------------------------------------------------
const fetchData = async (pagina) => {
    const miPeticion = ++idPeticion;
    paginaPedida = pagina;

    try {
        loadingData(true);
        mensajeError.classList.add("d-none");
        btnReintentar.classList.add("d-none");
        bloquearPaginacion(true);

        let data = cachePaginas.get(pagina);
        if (!data) {
            data = await fetchConReintentos(`${API_URL}?page=${pagina}`);
            if (!data || !Array.isArray(data.results) || !data.info) {
                throw new Error("La API devolvió un formato inesperado");
            }
            cachePaginas.set(pagina, data);
        }

        if (miPeticion !== idPeticion) return; // llego una peticion mas nueva

        paginaActual = pagina;
        totalPaginas = data.info.pages;

        showData(data);
        window.scrollTo({ top: 0 });
    } catch (error) {
        if (miPeticion !== idPeticion) return;
        console.log(error);
        mensajeError.textContent =
            `No se pudo cargar la información: ${error.message}. Revisa tu conexión a internet e inténtalo de nuevo.`;
        mensajeError.classList.remove("d-none");
        btnReintentar.classList.remove("d-none");
    } finally {
        // finally siempre se ejecuta: aqui se oculta el spinner
        if (miPeticion === idPeticion) {
            loadingData(false);
            bloquearPaginacion(false);
            actualizarPaginacion();
        }
    }
};

function loadingData(estado) {
    const loading = document.querySelector("#loading-data");
    loading.classList.toggle("d-none", !estado);
}

function bloquearPaginacion(bloqueado) {
    if (bloqueado) {
        btnAnterior.disabled = true;
        btnSiguiente.disabled = true;
    }
}

// ------------------------------------------------------------
// Pinta una tarjeta por personaje
// ------------------------------------------------------------
function showData(data) {
    card.textContent = "";
    const fragment = document.createDocumentFragment();

    data.results.forEach((item) => {
        const clone = templateCard.cloneNode(true);

        const img = clone.querySelector("img");
        img.setAttribute("src", item.image);
        img.setAttribute("alt", item.name);

        clone.querySelector(".tarjeta-nombre").textContent = item.name;
        clone.querySelector(".estado-texto").textContent = traducirEstado(item.status);
        clone.querySelector(".especie").textContent = item.species;
        clone.querySelector(".genero").textContent = traducirGenero(item.gender);
        clone.querySelector(".origen").textContent = item.origin.name;

        // El color del punto depende del estado (alive / dead / unknown)
        const estado = clone.querySelector(".estado");
        if (item.status === "Alive") estado.classList.add("alive");
        if (item.status === "Dead") estado.classList.add("dead");

        fragment.appendChild(clone);
    });

    card.appendChild(fragment);
}

function traducirEstado(status) {
    const mapa = { Alive: "Vivo", Dead: "Muerto", unknown: "Desconocido" };
    return mapa[status] || status;
}

function traducirGenero(gender) {
    const mapa = { Male: "Masculino", Female: "Femenino", Genderless: "Sin género", unknown: "Desconocido" };
    return mapa[gender] || gender;
}

// ------------------------------------------------------------
// Navegacion entre paginas de resultados
// ------------------------------------------------------------
function actualizarPaginacion() {
    paginaActualEl.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaActual <= 1;
    btnSiguiente.disabled = paginaActual >= totalPaginas;
}

btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) fetchData(paginaActual - 1);
});

btnSiguiente.addEventListener("click", () => {
    if (paginaActual < totalPaginas) fetchData(paginaActual + 1);
});

btnReintentar.addEventListener("click", () => fetchData(paginaPedida));
