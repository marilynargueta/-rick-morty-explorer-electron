# Rick and Morty Explorer (Electron)

Versión de escritorio de la aplicación web que consume la API pública de
[Rick and Morty](https://rickandmortyapi.com/). Desarrollada con HTML, CSS,
JavaScript y Electron.

## Requisitos

- [Node.js](https://nodejs.org/) (versión LTS)
- Conexión a internet (para consultar la API)

## Cómo ejecutarla

```bash
npm install
npm start
```

No necesita servidor web local ni Live Server: Electron carga `src/index.html`
directamente desde el disco.

## Qué muestra cada tarjeta

Imagen, nombre, estado, especie, género y origen de cada personaje. Los botones
**Anterior / Siguiente** permiten navegar por las páginas de resultados.

## Estructura

```
ejercicio_01/
├── package.json     # configuración del proyecto y script "start"
├── main.js          # proceso principal: crea la ventana
├── preload.js       # puente seguro (contextBridge) hacia la interfaz
├── src/
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js    # consumo de la API (fetch + async/await)
└── assets/
    └── icon.png     # icono de la aplicación
```

## Seguridad

`nodeIntegration` está desactivado y `contextIsolation` activado. La interfaz
solo recibe lo que `preload.js` expone mediante `contextBridge`, y el HTML
define una política de seguridad de contenido (CSP) que limita las conexiones a
la API de Rick and Morty.
