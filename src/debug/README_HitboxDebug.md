# HitboxDebug - Sistema de Visualización de Hitboxes

Sistema ligero y reutilizable para visualizar hitboxes en todos los juegos de LifeArcade.

## Características

- ✅ **Independiente del Debug UI**: Funciona con o sin `?debug=true`
- ✅ **Toggle con tecla H**: Presiona `H` para mostrar/ocultar hitboxes
- ✅ **Múltiples formas**: Soporta hitboxes rectangulares y circulares
- ✅ **Reutilizable**: Un solo módulo para todos los juegos
- ✅ **Sin dependencias**: Solo requiere p5.js (modo global)

## Instalación

### 1. Importar el módulo

```javascript
import {
  initHitboxDebug,
  drawHitboxRect,
  drawHitboxes
} from '../src/debug/HitboxDebug.js'
```

### 2. Inicializar en setup()

```javascript
function setup() {
  createCanvas(1200, 1920)
  frameRate(60)

  // Inicializar hitbox debugging
  initHitboxDebug()

  // ... resto de la configuración
}
```

### 3. Dibujar hitboxes en función de renderizado

```javascript
function renderGame() {
  // ... renderizar sprites

  // Dibujar hitboxes (solo se muestran si está activado con H)
  drawHitboxRect(player.x, player.y, player.width, player.height, 'player', '#00FF00')
  drawHitboxes(obstacles, 'obstacle', '#FF0000')
  drawHitboxes(bullets, 'bullet', '#FFFF00')
}
```

## API

### `initHitboxDebug()`

Inicializa el sistema de debugging. Configura el listener de teclado para la tecla `H`.

```javascript
initHitboxDebug()
```

**Nota:** Solo necesitas llamar esto una vez en `setup()`.

---

### `drawHitboxRect(x, y, width, height, label, color)`

Dibuja un hitbox rectangular.

**Parámetros:**
- `x` (number): Posición X (esquina superior izquierda)
- `y` (number): Posición Y (esquina superior izquierda)
- `width` (number): Ancho del hitbox
- `height` (number): Alto del hitbox
- `label` (string, opcional): Etiqueta a mostrar (ej: "player", "enemy")
- `color` (string, opcional): Color en formato hex (por defecto: '#00FF00')

**Ejemplo:**
```javascript
// Hitbox del jugador (verde)
drawHitboxRect(player.x, player.y, player.width, player.height, 'player', '#00FF00')

// Hitbox de enemigo (rojo)
drawHitboxRect(enemy.x, enemy.y, enemy.width, enemy.height, 'enemy', '#FF0000')
```

---

### `drawHitboxCircle(x, y, radius, label, color)`

Dibuja un hitbox circular.

**Parámetros:**
- `x` (number): Posición X del centro
- `y` (number): Posición Y del centro
- `radius` (number): Radio del círculo
- `label` (string, opcional): Etiqueta a mostrar
- `color` (string, opcional): Color en formato hex (por defecto: '#00FF00')

**Ejemplo:**
```javascript
// Bala circular (amarillo)
drawHitboxCircle(bullet.x, bullet.y, bullet.radius, 'bullet', '#FFFF00')
```

---

### `drawHitbox(entity, label, color)`

Dibuja hitbox detectando automáticamente la forma (rect o circle).

**Parámetros:**
- `entity` (object): Entidad con propiedades de hitbox
- `label` (string, opcional): Etiqueta
- `color` (string, opcional): Color

**Formas de entidad soportadas:**

```javascript
// Rectangular (usando x, y, width, height)
const player = { x: 100, y: 200, width: 50, height: 50 }
drawHitbox(player, 'player', '#00FF00')

// Circular (usando radius)
const bullet = { x: 300, y: 400, radius: 10 }
drawHitbox(bullet, 'bullet', '#FFFF00')

// Con hitbox object (rectangular)
const enemy = {
  hitbox: { x: 500, y: 600, width: 80, height: 80 }
}
drawHitbox(enemy, 'enemy', '#FF0000')

// Con hitbox object (circular)
const powerup = {
  hitbox: { x: 700, y: 800, radius: 25 }
}
drawHitbox(powerup, 'powerup', '#00FFFF')
```

---

### `drawHitboxes(entities, label, color)`

Dibuja hitboxes para un array de entidades.

**Parámetros:**
- `entities` (Array): Array de entidades
- `label` (string): Prefijo de etiqueta (se agrega índice automáticamente)
- `color` (string, opcional): Color (por defecto: '#00FF00')

**Ejemplo:**
```javascript
// Dibujar todos los obstáculos
drawHitboxes(obstacles, 'obstacle', '#FF0000')
// Resultado: "obstacle 0", "obstacle 1", "obstacle 2", ...

// Dibujar todas las balas
drawHitboxes(bullets, 'bullet', '#FFFF00')
```

---

### `isHitboxDebugEnabled()`

Verifica si el debugging está actualmente activado.

```javascript
if (isHitboxDebugEnabled()) {
  console.log('Hitboxes visibles')
}
```

## Paleta de Colores Sugerida

Para mantener consistencia visual entre juegos:

```javascript
const HITBOX_COLORS = {
  PLAYER: '#00FF00',    // Verde - jugador
  ENEMY: '#FF0000',     // Rojo - enemigos
  BULLET: '#FFFF00',    // Amarillo - proyectiles
  POWERUP: '#00FFFF',   // Cian - power-ups
  OBSTACLE: '#FF00FF',  // Magenta - obstáculos estáticos
  ZONE: '#FFA500'       // Naranja - zonas/áreas
}

// Uso:
drawHitboxRect(player.x, player.y, player.width, player.height, 'player', HITBOX_COLORS.PLAYER)
```

## Ejemplo Completo: Dino Runner

```javascript
import { initHitboxDebug, drawHitboxRect, drawHitboxes } from '../src/debug/HitboxDebug.js'

function setup() {
  createCanvas(1200, 1920)
  frameRate(60)
  initHitboxDebug()  // ← Inicializar debugging
  // ...
}

function renderGame() {
  // Renderizar sprites primero
  image(dinoSprite, player.x, player.y, player.width, player.height)
  obstacles.forEach(obs => {
    // renderizar obstáculo
  })

  // Dibujar hitboxes (solo visibles si H está activado)
  drawHitboxRect(player.x, player.y, player.width, player.height, 'player', '#00FF00')
  drawHitboxes(obstacles, 'obstacle', '#FF0000')
}
```

## Teclas

| Tecla | Acción |
|-------|--------|
| `H` | Toggle hitboxes (mostrar/ocultar) |

## Tests

Ubicación: `tests/debug/test_HitboxDebug.js`

```bash
npm test -- test_HitboxDebug
```

## Notas de Implementación

### Compatibilidad con p5.js Global Mode

El módulo usa funciones globales de p5.js:
- `push()` / `pop()`
- `stroke()` / `strokeWeight()` / `noStroke()`
- `fill()` / `noFill()`
- `rect()` / `circle()` / `line()`
- `textAlign()` / `textSize()` / `text()`

### Performance

- Las funciones de dibujado solo ejecutan cuando `hitboxDebugEnabled === true`
- Costo de performance mínimo cuando está desactivado (solo un if check)
- Dibujar hitboxes tiene impacto visual pero no afecta la física del juego

### Estado Global

El sistema usa una variable global `hitboxDebugEnabled` para mantener el estado.
La inicialización solo ocurre una vez (flag `window.__hitboxDebugInitialized`).

## Integración con Debug UI

Si el juego usa el sistema de Debug UI (`?debug=true`), ambos sistemas funcionan independientemente:

- Debug UI: Control detallado de parámetros + apariencias
- HitboxDebug: Visualización rápida de hitboxes (tecla H)

Ambos pueden estar activos simultáneamente.

## Próximas Mejoras

- [ ] Soporte para hitboxes de polígonos arbitrarios
- [ ] Visualización de vectores de velocidad
- [ ] Colores automáticos según tipo de entidad
- [ ] Opción de mostrar dimensiones numéricas
