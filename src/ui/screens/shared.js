// Fragmentos de interfaz reutilizados por varias pantallas.

/** Evita inyección de HTML al mostrar texto escrito por el usuario. */
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Barra superior con monedas y trofeos. */
export function currencyBar(app) {
  return `
    <div class="currencies">
      <div class="pill">🏆 <b>${app.save.totalTrophies}</b></div>
      <div class="pill">🪙 <b>${app.save.data.coins}</b></div>
    </div>`;
}

export function screenHeader(app, title, backScreen = 'lobby', backId = '') {
  return `
    <header class="topbar">
      <button class="btn btn-small" data-action="go" data-screen="${backScreen}" ${backId ? `data-id="${backId}"` : ''}>◀ Volver</button>
      <h1>${title}</h1>
      ${currencyBar(app)}
    </header>`;
}
