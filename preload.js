// ============================================================
// preload.js — Puente seguro entre Electron y la interfaz
// Solo se expone la informacion que la interfaz necesita,
// sin darle acceso directo a Node.js.
// ============================================================

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("appInfo", {
    nombre: "Rick and Morty Explorer",
    electron: process.versions.electron
});
