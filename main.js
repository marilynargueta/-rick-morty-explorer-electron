// ============================================================
// main.js — Proceso principal de Electron
// Crea la ventana de la aplicación y carga la interfaz HTML.
// ============================================================

const { app, BrowserWindow } = require("electron");
const path = require("path");

function crearVentana() {
    const ventana = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 700,
        minHeight: 500,
        title: "Rick and Morty Explorer",
        icon: path.join(__dirname, "assets", "icon.png"),
        backgroundColor: "#141820",
        webPreferences: {
            // Buenas practicas de seguridad:
            // el renderizador NO tiene acceso a Node.js
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    // Quita el menu por defecto para que se vea como una app propia
    ventana.setMenuBarVisibility(false);

    // Carga el HTML directamente desde el disco (sin servidor web local)
    ventana.loadFile(path.join(__dirname, "src", "index.html"));
}

app.whenReady().then(() => {
    crearVentana();

    // En macOS, se vuelve a crear la ventana al hacer clic en el icono del dock
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) crearVentana();
    });
});

// En Windows y Linux, cerrar todas las ventanas cierra la aplicacion
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
