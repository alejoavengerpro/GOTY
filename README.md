# 🎉 Jarana Arena

Brawler 3D de arena con sabor peruano, hecho con **Three.js** y **Vite**. Elige a tu luchador,
pelea en partidas rápidas contra bots, gana trofeos y monedas, sube de nivel y desbloquea
nuevos personajes.

> Los personajes son **originales**, inspirados en arquetipos de la cultura popular peruana
> (el cobrador de combi, el chef cevichero, la streamer, la cantante de cumbia…).
> No representan a personas reales.

## 🚀 Cómo jugar

```bash
npm install
npm run dev      # abre http://localhost:5173
```

Para generar la versión de producción (carpeta `dist/`, lista para GitHub Pages o cualquier hosting estático):

```bash
npm run build
npm run preview
```

### Controles

| Acción   | PC                           | Móvil                                         |
| -------- | ---------------------------- | --------------------------------------------- |
| Moverse  | `WASD` / flechas             | Joystick izquierdo                            |
| Disparar | Clic izquierdo (apunta el ratón) | Joystick derecho: arrastra y suelta. Toque rápido = auto-apuntado |
| Súper    | `Espacio`, `Q` o clic derecho | Botón **SÚPER**                               |

## 🎮 Contenido

**Modos de juego**

- 💀 **Supervivencia** — 10 luchadores, todos contra todos. Rompe cajas para conseguir cubos de
  poder (+10 % vida y daño) y escapa de la neblina que se cierra.
- ⚽ **Pichanga 3v3** — Equipos de 3 con reaparición. Gana el primero en llegar a 8 KOs o el que
  vaya arriba a los 2 minutos.

**Luchadores**

| Luchador      | Rol                    | Ataque              | Súper                              |
| ------------- | ---------------------- | ------------------- | ---------------------------------- |
| Tío Combi     | Tanque de corto alcance | Lluvia de sencillo  | Hora punta (embestida)             |
| Chef Limón    | Tirador medio          | Limonazo            | Leche de tigre (explosión en área) |
| Pixelina      | Francotiradora         | Donación            | Spam del chat (ráfaga)             |
| Reina Cumbia  | Apoyo                  | Coro pegajoso (perfora) | El estribillo (cura al equipo) |
| El Crack      | Tirador con rebotes    | Pelotazo            | Chalaca (perfora todo)             |
| Doña Brasa    | Ráfagas                | Palitos al toque    | Abanico de brasas                  |
| Máscara Inka  | Tanque cuerpo a cuerpo | Manazo              | Tercera cuerda (salto + impacto)   |
| Brillo        | Asesina veloz          | Doble like          | Filtro viral (cura + velocidad)    |

**Mecánicas**

- 3 cargas de munición que se recargan solas; el súper se carga haciendo daño.
- Arbustos que te ocultan del enemigo, muros, proyectiles que rebotan o perforan.
- Regeneración de vida fuera de combate.
- Bots con búsqueda de caminos, que huyen con poca vida y mejoran según tus trofeos.

**Progresión** (se guarda en `localStorage`)

- 🏆 Trofeos por personaje y **camino de trofeos** con recompensas y desbloqueos.
- 🪙 Monedas para **mejorar luchadores** (niveles 1–9, +10 % vida y daño por nivel) o comprarlos.
- ⭐ Experiencia y nivel de cuenta, regalo diario y estadísticas.

## 🗂️ Estructura del proyecto

```
├── index.html
├── vite.config.js
└── src/
    ├── main.js                 # App: renderer, bucle principal, flujo menú ↔ partida
    ├── core/
    │   ├── Match.js            # Partida: reglas de cada modo, combate, cámara
    │   ├── Input.js            # Teclado, ratón y joysticks táctiles
    │   ├── PlayerController.js # Entrada del jugador → intención de combate
    │   ├── AudioManager.js     # Efectos de sonido sintetizados (WebAudio)
    │   └── SaveManager.js      # Guardado en localStorage
    ├── data/                   # Datos puros, fáciles de balancear
    │   ├── characters.js       # Luchadores, estadísticas y costes de mejora
    │   ├── modes.js            # Modos, temas de arena, nombres de bots
    │   └── progression.js      # Recompensas, XP y camino de trofeos
    ├── entities/
    │   ├── Fighter.js          # Luchador: vida, munición, súper, animación
    │   └── Projectile.js       # Proyectiles rectos, con rebote y bombeados
    ├── characters/
    │   ├── ModelFactory.js     # Modelos 3D procedurales + animación
    │   └── Portraits.js        # Retratos renderizados para la interfaz
    ├── world/
    │   ├── Arena.js            # Mapa procedural, colisiones, pathfinding
    │   └── MenuScene.js        # Escena 3D del lobby
    ├── ai/
    │   └── BotController.js    # Inteligencia artificial de los bots
    ├── systems/
    │   ├── Progression.js      # Recompensas, mejoras, desbloqueos
    │   └── Effects.js          # Partículas y ondas expansivas
    ├── ui/
    │   ├── UIManager.js        # Navegación entre pantallas y acciones
    │   ├── HUD.js              # Interfaz dentro de la partida
    │   └── screens/            # Lobby, luchadores, ficha, trofeos, resultados
    ├── styles/main.css
    └── utils/math.js
```

## ➕ Cómo añadir un luchador

1. Añade una entrada en `src/data/characters.js` (estadísticas, `attack`, `super` y `look`).
2. Si necesita un peinado u objeto nuevo, agrégalo en `buildHead` / `buildItem` de
   `src/characters/ModelFactory.js`.
3. Listo: aparece solo en la colección, en la tienda y entre los bots.

## 🛠️ Tecnologías

- [Three.js](https://threejs.org/) — render 3D (todo el arte es procedural, sin assets externos)
- [Vite](https://vitejs.dev/) — servidor de desarrollo y build
