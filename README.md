# FitnessApp

Diario personal de entrenamiento enfocado en **sobrecarga progresiva**. Es una PWA pensada para
usarse en el teléfono, entre series: registrar una serie cuesta uno o dos toques y siempre tienes a
la vista lo que hiciste la sesión anterior.

Modelo mental: **Rutina → Entrenamiento → Ejercicio → Series → Historial → Progresión**.

- Rutinas editables (crear, renombrar, agregar/crear ejercicios, reordenar, archivar, eliminar).
- Entrenamiento activo con referencia de la última sesión, sugerencia de valores y registro rápido
  de peso, reps, tipo de serie (Calentamiento / Efectiva / Drop set) y RIR opcional (0–5).
- El entrenamiento activo sobrevive a cerrar la app, bloquear el teléfono o perder internet.
- Historial inmutable: cada entrenamiento guarda su propia copia (snapshot) de rutina y ejercicios.
- Métricas: volumen, peso máximo, 1RM estimado (Epley), mejor serie, récords (PR) y comparación
  contra la sesión anterior, con gráfica por ejercicio.
- Local-first: funciona sin conexión y sincroniza al volver la red.

---

## Stack

| Área     | Tecnología                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| UI       | React 19, TypeScript (strict), React Router 7, CSS propio (sin framework)       |
| Build    | Vite 8                                                                          |
| Datos    | Cloud Firestore con `persistentLocalCache` (IndexedDB, multi-pestaña)           |
| Auth     | Firebase Authentication (Google + correo/contraseña)                            |
| PWA      | `vite-plugin-pwa` (Workbox, `generateSW`, estrategia de actualización _prompt_) |
| Gráficas | Recharts (carga diferida, solo en el detalle de ejercicio)                      |
| Tests    | Vitest + Testing Library, `@firebase/rules-unit-testing`, Playwright + axe-core |
| Calidad  | ESLint (typescript-eslint, react-hooks), Prettier                               |

> TypeScript está fijado en `~6.0` porque `typescript-eslint` todavía no soporta TypeScript 7.

## Requisitos

- Node.js ≥ 20.19 (probado con Node 22).
- Java 21 o superior, solo para el Firebase Emulator Suite (tests de reglas y E2E).
- Un proyecto de Firebase en plan Spark para producción (ya configurado: ver "Producción").

## Instalación y desarrollo local

```bash
npm install
```

### Opción A: sin credenciales (Emulator Suite)

No necesitas un proyecto real. Usa el proyecto demo `demo-fitnessapp`:

```bash
echo "VITE_USE_EMULATORS=true" > .env.local
npm run emulators      # terminal 1: Auth (9099) + Firestore (8080)
npm run dev            # terminal 2: http://localhost:5173
```

En el emulador puedes crear cuentas con correo/contraseña o usar el popup simulado de Google.
Para probar desde tu teléfono en la misma red, añade `VITE_EMULATOR_HOST=<ip-de-tu-pc>` y ejecuta
`npm run dev -- --host`.

### Opción B: con tu proyecto de Firebase

Copia `.env.example` a `.env.local` y rellena los valores de la app web del proyecto:

| Variable                            | Dónde se obtiene                                                      |
| ----------------------------------- | --------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Consola de Firebase → Configuración del proyecto → Tus apps → App web |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Mismo lugar (ver la nota sobre dominios más abajo)                    |
| `VITE_FIREBASE_PROJECT_ID`          | Mismo lugar                                                           |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Mismo lugar                                                           |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Mismo lugar                                                           |
| `VITE_FIREBASE_APP_ID`              | Mismo lugar                                                           |

Estos valores **no son secretos**: identifican el proyecto y viajan dentro del bundle. La
protección real son las reglas de Firestore. Aun así, `.env` y `.env.local` están en
`.gitignore`. Si falta alguna variable, la app muestra una pantalla que indica cuál.

## Configuración de Firebase (paso a paso)

1. Crea un proyecto en <https://console.firebase.google.com> y registra una **app web**.
2. **Authentication → Sign-in method**: habilita **Google** y **Correo electrónico/contraseña**.
3. **Authentication → Settings → Authorized domains**: agrega el dominio donde publiques
   (`<proyecto>.web.app` ya viene incluido si usas Firebase Hosting).
4. **Firestore Database**: créala en modo producción (la región es a tu elección, por ejemplo
   `us-central1` o `northamerica-south1`).
5. Instala la CLI y vincula el proyecto:
   ```bash
   npx firebase login
   npx firebase use --add        # elige tu proyecto; crea .firebaserc
   ```
6. Publica reglas e índices: `npx firebase deploy --only firestore`.

### Google Sign-In en Safari y en la PWA instalada (iOS)

Safari bloquea el almacenamiento de terceros, lo que rompe `signInWithRedirect` cuando la app vive
en un dominio distinto de `authDomain`. La configuración de producción lo evita así:

- `authDomain` es `<proyecto>.firebaseapp.com` y la app **se sirve en ese mismo dominio**, así que
  el manejador `/__/auth/handler` de Hosting es del mismo origen que la app.
- Si alguien abre `<proyecto>.web.app`, la app redirige al mismo path en `firebaseapp.com`
  (`src/config/canonicalOrigin.ts`). Así hay un solo origen para el login, la PWA instalada y la
  caché IndexedDB.
- En la PWA instalada se usa `signInWithRedirect`, porque en iOS standalone un popup se abre en una
  hoja aparte que no puede comunicarse con la app. En una pestaña del navegador se usa un popup, con
  redirect como alternativa si el popup se bloquea. Los errores del redirect se muestran en la
  pantalla de login.
- El acceso con correo y contraseña funciona siempre como alternativa.

## Firestore

### Estructura de datos

Todo vive bajo el usuario autenticado; los IDs se generan en el cliente (IDs automáticos de
Firestore), así que crear registros sin conexión es seguro.

```
users/{uid}/exercises/{exerciseId}
  name, nameKey, notes|null, archived, createdAt, updatedAt

users/{uid}/routines/{routineId}
  name, exerciseIds[] (el orden del array es el orden de la rutina), archived, createdAt, updatedAt

users/{uid}/workouts/{workoutId}
  sourceRoutineId, routineNameSnapshot, startedAt, finishedAt|null,
  status: 'active' | 'completed',
  exercises: [{ exerciseId, name, order }]      ← snapshot congelado al iniciar
  summary|null                                  ← métricas calculadas al finalizar
  createdAt, updatedAt

users/{uid}/sets/{setId}
  workoutId, exerciseId, exerciseNameSnapshot, exerciseOrder, setNumber,
  weight (kg), reps, setType: 'warmup'|'working'|'dropset', rir|null,
  workoutStartedAt, createdAt, updatedAt
```

- Las series están en una colección plana para poder consultar el historial **por ejercicio**
  (`where exerciseId in [...]`) sin cargar todo el historial al iniciar.
- Solo se usan índices de un campo (automáticos); `firestore.indexes.json` está vacío a propósito.

### Reglas de historial

- Al iniciar un entrenamiento se copia la lista de ejercicios (id, nombre, orden) y el nombre de
  la rutina. El historial se reconstruye **solo** con ese snapshot y las series; nunca con la
  rutina actual.
- Si mañana renombras un ejercicio o cambias la rutina (quitas E, agregas F), los entrenamientos
  anteriores siguen mostrando A, B, C, D, E con sus nombres originales.
- Un entrenamiento finalizado y sus series son **inmutables** (lo imponen las reglas del servidor).
- Los ejercicios no se borran, se archivan: el historial y el progreso siguen apuntando a su id.
  Las rutinas sí se pueden eliminar sin afectar al historial.

### Reglas de seguridad (`firestore.rules`)

- Nadie puede leer ni escribir fuera de `users/{su-uid}`; los accesos sin sesión se rechazan.
- Se valida la forma de cada documento (campos permitidos, tipos y rangos): peso de 0 a 1000,
  reps enteras de 0 a 999, RIR `null` o entero de 0 a 5, tipos de serie válidos y nombres de 1 a
  80 caracteres.
- Solo se pueden crear, editar o borrar series de un entrenamiento **activo**. Un entrenamiento
  completado no se puede editar ni borrar, y su snapshot no cambia ni mientras está activo.
- Se prueban con el emulador: `npm run test:rules` (14 casos).

## Reglas de cálculo

Todas las funciones son puras y están en `src/analytics/`. Las reglas se centralizan en
`src/analytics/metricRules.ts`.

| Métrica                            | Definición                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Series que cuentan                 | Efectivas y drop sets. **Los calentamientos se excluyen** de volumen, récords y comparaciones.                                                                                                                                                                                                                                                                     |
| Volumen                            | Σ peso × reps de las series que cuentan (por ejercicio y por entrenamiento).                                                                                                                                                                                                                                                                                       |
| Peso máximo                        | Mayor peso en una serie que cuenta y que tenga al menos 1 rep.                                                                                                                                                                                                                                                                                                     |
| 1RM estimado                       | Epley: `peso × (1 + reps/30)`. Con 1 rep es el propio peso. Solo se calcula de 1 a **12 reps** (más allá la fórmula pierde precisión); con 0 kg o 0 reps no se calcula. Siempre se etiqueta como "1RM estimado".                                                                                                                                                   |
| Mejor serie                        | La serie con mayor 1RM estimado (en empate, la de más peso). Si ninguna admite 1RM estimado, gana la más pesada y luego la de más reps.                                                                                                                                                                                                                            |
| Récord de reps                     | Más reps que nunca **con exactamente el mismo peso**. Un peso nunca levantado no cuenta como récord de reps (si es mayor, ya es récord de peso).                                                                                                                                                                                                                   |
| Récords (PR)                       | Peso máximo, reps a un peso, mejor 1RM estimado y volumen máximo de sesión. Se comparan **solo contra entrenamientos completados anteriores**; la primera sesión de un ejercicio no genera récords. Durante el entrenamiento, cada serie se compara contra el historial más las series anteriores del mismo día, así que una serie nunca se compara consigo misma. |
| Comparación con la sesión anterior | Cambio de volumen, peso máximo, 1RM estimado y reps totales. Si el número de series efectivas cambió, se indica "distinto nº de series" y en Inicio no se destacan ganancias de reps.                                                                                                                                                                              |
| Delta por serie                    | La n-ésima serie efectiva de hoy contra la n-ésima de la sesión anterior: `+2.5 kg` si cambió el peso y `+1 rep` si el peso es igual.                                                                                                                                                                                                                              |
| Sugerencia de la siguiente serie   | Repite la última serie de hoy; en la primera serie usa la primera de la sesión anterior. **Nunca se guarda sin que pulses "Registrar".** El RIR no se copia.                                                                                                                                                                                                       |

Los datos no válidos (NaN, Infinity, negativos) se filtran antes de cualquier cálculo.

## Arquitectura

```
src/
  config/        constantes (locale es-MX, zona America/Mexico_City, kg) y validación de env
  firebase/      inicialización (caché persistente, emuladores)
  auth/          contexto de sesión y acciones de login/logout
  domain/        tipos, validación, operaciones de rutina, snapshots y vista de historial (puro)
  analytics/     métricas, récords, comparaciones, progresión y highlights (puro, testeado)
  data/          repositorios de Firestore, converters, rutas y tracker de escrituras pendientes
  hooks/         suscripciones en vivo (useQuerySubscription, useSets, useWorkoutExercises…)
  routes/        pantallas (workout/, progress/ y el resto)
  ui/            componentes reutilizables (Dialog, BottomNav, SetForm, badges…)
  pwa/           registro del service worker y aviso de actualización
  lib/           formato (Intl es-MX) y localStorage seguro
```

Decisiones clave:

- **Escrituras sin `await`.** Offline, la promesa de Firestore no se resuelve hasta que el
  servidor confirma, así que la UI nunca la espera: la caché local refleja el cambio al instante y
  `writeTracker` cuenta las escrituras pendientes ("Sincronizando…" / "Sin conexión · cambios
  guardados en el teléfono") y muestra los errores.
- **Una sola fuente de verdad.** No hay una segunda base local: el entrenamiento activo es un
  documento de Firestore (`status: 'active'`) que la caché IndexedDB conserva. En `localStorage`
  solo va estado de UI (ejercicio actual y borrador de la serie que estás escribiendo).
- **Timestamps del cliente** (`Timestamp.now()`), no `serverTimestamp()`, para que el orden y la
  duración funcionen sin conexión.
- **Protección contra doble toque**: iniciar un entrenamiento se bloquea tras el primer toque;
  una serie idéntica en el mismo ejercicio dentro de 600 ms se ignora.
- **Carga diferida**: las pantallas secundarias se separan en chunks y Recharts solo se descarga en
  el detalle de un ejercicio. La pantalla de entrenamiento se incluye en el bundle inicial para
  abrir al instante.

## Tests

```bash
npm test             # unitarios y de componentes (Vitest): métricas, PRs, snapshots, validación…
npm run test:rules   # reglas de Firestore contra el emulador
npm run test:e2e     # Playwright con viewport de Pixel 7: build de producción + emuladores
npm run check        # lint + typecheck + unitarios + build
```

La suite E2E cubre el recorrido completo:

1. Registro.
2. Creación de ejercicios y de la rutina.
3. Entrenamiento con distintos tipos de serie y RIR.
4. Revisión del historial.
5. Edición de la rutina y verificación de que el historial no cambió.
6. Segunda sesión con referencia a la anterior.
7. Récords y progreso.

Además comprueba:

- Recarga y reanudación del entrenamiento.
- Validaciones y descarte del entrenamiento.
- Registro offline, recarga sin conexión y sincronización verificada desde otro dispositivo.
- Navegación móvil.
- Manifest, service worker e instalabilidad.
- Accesibilidad con axe (WCAG A/AA) y áreas táctiles de al menos 44 px.

Si ya tienes Chromium instalado, puedes indicar `CHROMIUM_PATH=/ruta/a/chrome` para que Playwright no lo descargue.

## Producción

| Elemento         | Valor                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Proyecto         | **FitnessApp Alonso** · ID `fitnessapp-alonso-app` (`fitnessapp-alonso` ya estaba ocupado globalmente) |
| Plan             | Spark (sin cuenta de facturación), sin Google Analytics                                                |
| URL canónica     | **https://fitnessapp-alonso-app.firebaseapp.com**                                                      |
| URL alternativa  | https://fitnessapp-alonso-app.web.app (redirige a la canónica)                                         |
| Firestore        | `(default)`, Native, edición Standard, `northamerica-south1` (Querétaro), sin PITR                     |
| Authentication   | Correo/contraseña y Google (Firebase Auth, sin Identity Platform)                                      |
| Productos usados | Solo Hosting clásico, Firestore y Auth. Sin Cloud Functions, Storage ni App Hosting                    |

Índices: todas las consultas usan índices automáticos de un campo, así que
`firestore.indexes.json` está vacío a propósito. Se verificó en producción sin errores de índice
faltante.

## Build y despliegue (Firebase Hosting)

```bash
npm run build                           # tsc + vite build → dist/ (con sw.js y manifest)
npx firebase deploy --only hosting,firestore
# o: npm run deploy
```

`firebase.json` reescribe todas las rutas a `index.html` (SPA), sirve `sw.js`, `index.html` y el
manifest sin caché y los assets con hash como `immutable`, y añade cabeceras de seguridad básicas.
Las variables `VITE_FIREBASE_*` deben estar en `.env.local` (o en el entorno) **al construir**.

## PWA

- Manifest con `display: standalone`, `start_url: /`, colores `#0e1116` e iconos 192, 512,
  512 _maskable_ y `apple-touch-icon` (180). Los iconos se generan con `npm run icons`.
- El service worker precachea todos los assets, así que la app abre sin conexión. Las rutas
  `/__/*` (manejadores de Firebase Auth) quedan fuera del _fallback_.
- **Actualizaciones**: la nueva versión se descarga en segundo plano y aparece el aviso "Hay una
  nueva versión · Actualizar". Nunca se recarga sola, para no interrumpir un entrenamiento.
- Instalación: en Android/Chrome, "Instalar app"; en iOS/Safari, Compartir → "Agregar a inicio".

## Prueba en iPhone

Dispositivo: iPhone 16 o posterior, con Safari. URL: **https://fitnessapp-alonso-app.firebaseapp.com**

1. Abre la URL de producción en Safari.
2. Inicia sesión con Google.
3. Cierra sesión (Inicio → al final de la página → "Cerrar sesión").
4. Inicia sesión con correo/contraseña (crea la cuenta con "Crear cuenta" si no existe).
5. Toca el botón **Compartir**.
6. Selecciona **"Añadir a pantalla de inicio"**.
7. Abre FitnessApp desde el icono.
8. Confirma el modo standalone: no se ve la barra de direcciones de Safari.
9. Crea o abre una rutina.
10. Inicia el entrenamiento.
11. Registra series en al menos dos ejercicios.
12. Cierra completamente la PWA (desliza hacia arriba en el selector de apps).
13. Vuelve a abrirla.
14. Verifica que aparece "Continuar entrenamiento".
15. Registra una serie.
16. Activa el modo avión.
17. Registra otra serie. Debe aparecer "Sin conexión · cambios guardados en el teléfono".
18. Cierra y vuelve a abrir la PWA.
19. Verifica que la información sigue presente.
20. Desactiva el modo avión.
21. Espera a que desaparezca el indicador de sincronización.
22. Finaliza el entrenamiento.
23. Abre Historial.
24. Confirma que la sesión está completa.

**Prueba de actualización de la PWA** (tras cualquier despliegue nuevo): abre la PWA instalada con
conexión y espera unos segundos (o ciérrala y vuelve a abrirla). Debe aparecer "Hay una nueva
versión de FitnessApp" con el botón **Actualizar**; al pulsarlo, la app se recarga con la nueva
versión. Si hay un entrenamiento activo, este sigue ahí después de actualizar.

## Limitaciones conocidas

- **Entrenamientos finalizados de solo lectura**: para corregir una serie de un entrenamiento ya
  terminado habría que añadir un flujo de edición que recalcule el resumen; queda fuera de la V1.
- **Ejercicios con peso corporal**: con 0 kg el volumen es 0 y no hay 1RM estimado. Se muestran las
  reps y los récords de reps, pero no existe un campo de "lastre" ni el peso corporal (fuera de
  alcance por diseño).
- **Unidad única (kg)**: no hay conversión a lb.
- **Historial por ejercicio**: durante un entrenamiento se cargan todas las series de los
  ejercicios de esa sesión (no de todos los ejercicios). Es adecuado para uso personal durante
  años, pero no está paginado.
- **Caché local tras cerrar sesión**: los datos quedan cacheados en IndexedDB del dispositivo (las
  reglas y las rutas por usuario impiden que otra cuenta los lea desde la app). Si cierras sesión
  con cambios pendientes, se te avisa antes.
- **Navegación privada / IndexedDB bloqueado**: sin IndexedDB no hay caché persistente, así que los
  datos offline no sobreviven a una recarga. No se probó este caso en dispositivos reales.
- **Métrica "Reps" en la gráfica**: interpreta "rendimiento histórico" como reps efectivas totales
  por sesión.
