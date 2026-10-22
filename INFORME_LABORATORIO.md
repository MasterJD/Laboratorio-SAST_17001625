# Laboratorio: SAST local y pipeline CI con Bearer CLI

**Universidad Galileo — Curso de Ciberseguridad — PDSS**

- **Estudiante:** MasterJD
- **Carné:** 17001625
- **Repositorio:** `https://github.com/MasterJD/Laboratorio-SAST_17001625` (renombrar a `juice-shop-sast` en GitHub si el catedrático lo exige)
- **Pull Request de la Parte D:** `https://github.com/MasterJD/Laboratorio-SAST_17001625/pull/1` (completar al abrirlo)
- **Fecha:** 22 de octubre de 2026

---

## Parte A — Repositorio propio

Se clonó OWASP Juice Shop, se eliminaron la carpeta `.git` original y la carpeta `.github/workflows`, y se inicializó un repositorio nuevo con el código en la raíz.

```powershell
git clone https://github.com/juice-shop/juice-shop.git
# Se eliminaron .git y .github/workflows del clon original
git init
git add .
git commit -s -m "Initial commit: OWASP Juice Shop para laboratorio SAST"
git remote add origin https://github.com/MasterJD/Laboratorio-SAST_17001625.git
git push -u origin main
```

Como se usa **GitHub Desktop**, el push se puede hacer desde la interfaz:

1. `File > Add local repository...` y seleccionar `D:\PERSONAL_FILES\UNIVERSIDAD\2026\Ciberseguridad\Laboratorio-SAST_17001625`.
2. Cambiar a la rama `main` y usar `Publish branch` o `Push origin`.
3. Cambiar a la rama `demo-vulnerabilidad` y volver a usar `Publish branch`.

Se agregaron al `.gitignore` los reportes locales:

```gitignore
# SAST reports (local / CI artifacts)
reports/
*.sarif
```

---

## Parte B — Análisis local con Bearer CLI

Se utilizó **Docker Desktop** en lugar de WSL, que es una alternativa permitida por el laboratorio. La imagen utilizada fue `bearer/bearer:latest-amd64`.

### Comandos ejecutados

```powershell
# Reporte HTML completo, excluyendo pruebas y recursos que no son código de la aplicación
docker run --rm -v "${PWD}:/tmp/scan" bearer/bearer:latest-amd64 scan /tmp/scan `
  --format html --output /tmp/scan/reports/bearer-report.html `
  --skip-path "test,cypress,data/static,i18n,frontend/src/assets" `
  --exit-code 0 --hide-progress-bar

# Reporte SARIF
docker run --rm -v "${PWD}:/tmp/scan" bearer/bearer:latest-amd64 scan /tmp/scan `
  --format sarif --output /tmp/scan/reports/bearer-report.sarif `
  --skip-path "test,cypress,data/static,i18n,frontend/src/assets" `
  --exit-code 0 --hide-progress-bar

# Reporte JSON (para obtener severidad, CWE y fingerprint)
docker run --rm -v "${PWD}:/tmp/scan" bearer/bearer:latest-amd64 scan /tmp/scan `
  --format json --output /tmp/scan/reports/bearer-report.json `
  --skip-path "test,cypress,data/static,i18n,frontend/src/assets" `
  --exit-code 0 --hide-progress-bar

# Reporte HTML filtrado solo a severidades critical y high
docker run --rm -v "${PWD}:/tmp/scan" bearer/bearer:latest-amd64 scan /tmp/scan `
  --format html --output /tmp/scan/reports/bearer-report-critical-high.html `
  --severity critical,high `
  --skip-path "test,cypress,data/static,i18n,frontend/src/assets" `
  --exit-code 0 --hide-progress-bar
```

### Resumen del análisis

| Severidad | Hallazgos |
|---|---:|
| Crítica | 12 |
| Alta | 20 |
| Media | 20 |
| Baja | 281 |
| **Total** | **333** |

### Tabla de los 5 hallazgos más importantes

| # | Regla / ID | Severidad | CWE | Archivo:línea | ¿Verdadero o falso positivo? | ¿Por qué? |
|---:|---|---|---|---|---|---|
| 1 | `javascript_lang_sql_injection` | Crítica | CWE-89 | `routes/login.ts:34` | Verdadero positivo | Concatena el correo y el hash de la contraseña directamente en la consulta SQL. Permite inyección y bypass de autenticación. |
| 2 | `javascript_lang_sql_injection` | Crítica | CWE-89 | `routes/search.ts:23` | Verdadero positivo | Concatena `req.query.q` dentro de un `LIKE`. Permite inyección SQL tipo `UNION` y extracción de datos. |
| 3 | `javascript_lang_eval_user_input` | Crítica | CWE-95 | `routes/b2bOrder.ts:23` | Verdadero positivo | Ejecuta `orderLinesData` del cuerpo de la petición dentro de `vm.runInContext`. Es la base del reto de RCE de Juice Shop; aunque usa `notevil` y timeout, no valida la entrada. |
| 4 | `javascript_express_hardcoded_secret` | Crítica | CWE-798 | `lib/insecurity.ts:54` | Verdadero positivo | Firma los JWT con una clave privada embebida en el código. Cualquiera con acceso al repositorio puede forjar tokens. En Juice Shop es intencional; en producción sería crítico. |
| 5 | `javascript_express_server_side_request_forgery` | Alta | CWE-918 | `routes/profileImageUrlUpload.ts:24` | Verdadero positivo | Hace `fetch(url)` con una URL controlada por el usuario sin validar el destino. Permite SSRF hacia servicios internos. |

> Nota: Juice Shop es una aplicación deliberadamente vulnerable. Varios de estos hallazgos son intencionales y forman parte de sus retos; el análisis demuestra que Bearer los detecta correctamente.

### Evidencias

- Ejecución local de Bearer: `capturas/01-bearer-local.png`
- Reporte HTML abierto en el navegador: `capturas/02-reporte-html.png`
- Reporte SARIF generado: `reports/bearer-report.sarif`

---

## Parte C — Pipeline de GitHub Actions

Archivo: `.github/workflows/sast-bearer.yml`

El workflow cumple con los requisitos del laboratorio:

| # | Requisito | Implementación |
|---:|---|---|
| 1 | Push a `main`, pull request hacia `main` y ejecución manual | Bloque `on:` con `push`, `pull_request` y `workflow_dispatch`. |
| 2 | Permisos mínimos | `permissions: contents: read` y `security-events: write`. |
| 3 | Descargar el código y ejecutar Bearer sobre todo el repositorio | `actions/checkout@v4` y `bearer/bearer-action@v2` con `path: .`. |
| 4 | Generar SARIF y subirlo a Security > Code scanning | `format: sarif`, `output: results.sarif` y `github/codeql-action/upload-sarif@v3`. |
| 5 | Generar HTML y guardarlo como artefacto descargable | Segundo paso de Bearer con `format: html` y `actions/upload-artifact@v4`. |
| 6 | Subir resultados aunque Bearer encuentre vulnerabilidades | Los pasos de carga usan `if: always()`. El paso de Bearer usa `exit-code: 1`, pero la carga no se omite. |
| 7 | Cada línea del YAML lleva un comentario | Todas las líneas del archivo tienen un comentario explicativo. |

**Funcionamiento del control de fallos:** Bearer devuelve un código de salida distinto de cero cuando encuentra hallazgos. El paso `Ejecutar Bearer y generar SARIF` usa `exit-code: 1`, por lo que el job queda marcado como fallido. Los pasos de carga usan `if: always()` para ejecutarse de todos modos. El último paso comprueba `steps.bearer-sarif.outcome == 'failure'` y fuerza el fallo del job para que el check del PR refleje el resultado del análisis.

**Escaneo diferencial en pull requests:** en eventos `pull_request`, el workflow activa `diff: true`, de modo que Bearer informa únicamente los hallazgos nuevos respecto a `main`. Esto es importante porque Juice Shop ya contiene cientos de hallazgos intencionales en `main`; sin el modo diferencial, el PR de la Parte D nunca podría pasar aunque se corrigiera la vulnerabilidad nueva. En `push` a `main` y en `workflow_dispatch` se ejecuta el escaneo completo.

### Evidencias

- Pestaña Actions con el workflow ejecutado: `capturas/03-actions.png`
- Security > Code scanning con los hallazgos: `capturas/04-code-scanning.png`

---

## Parte D — Ciclo cambio → detección → corrección

### 1. Rama y versión vulnerable

```powershell
git checkout -b demo-vulnerabilidad
```

Archivo agregado: `routes/demoCalculator.ts`

```ts
import { type Request, type Response } from 'express'

export function demoCalculator () {
  return (req: Request, res: Response) => {
    const expression = String(req.query.expression ?? '')
    const result = eval(expression) // eslint-disable-line no-eval
    res.json({ result })
  }
}
```

### 2. Detección local

```powershell
docker run --rm -w /tmp/scan -v "${PWD}:/tmp/scan" bearer/bearer:latest-amd64 scan routes/demoCalculator.ts `
  --format json --only-rule javascript_lang_eval_user_input --exit-code 0 --hide-progress-bar
```

Resultado local (también se confirmó con un escaneo completo de la rama):

```json
{
  "critical": [
    {
      "id": "javascript_lang_eval_user_input",
      "full_filename": "routes/demoCalculator.ts",
      "line_number": 6,
      "fingerprint": "f530593303718d2f25fd6186f459db00_0"
    }
  ]
}
```

### 3. Commit vulnerable y Pull Request

El commit vulnerable ya está creado en la rama local:

```text
995681b demo: agrega endpoint de calculadora con eval
```

Para subirlo con **GitHub Desktop**:

1. Cambiar a `main` y hacer `Publish branch` / `Push origin` (si aún no está publicado).
2. Cambiar a `demo-vulnerabilidad` y hacer `Publish branch`.
3. En GitHub, abrir el Pull Request de `demo-vulnerabilidad` hacia `main`.

El pipeline detectará el hallazgo y GitHub lo mostrará como alerta de Code Scanning sobre la línea 6 de `routes/demoCalculator.ts`. Esta alerta se conserva en la pestaña Security > Code scanning.

> Para que el ciclo se vea completo, primero se sube solo el commit vulnerable y se espera a que GitHub ejecute el análisis y cree la alerta. Después se crea el commit de corrección y se vuelve a hacer push.

### 4. Corrección

Después de observar la alerta en el PR, se reemplaza `eval` por una lista blanca de operaciones y operandos numéricos:

```ts
import { type Request, type Response } from 'express'

export function demoCalculator () {
  return (req: Request, res: Response) => {
    const a = Number(req.query.a)
    const b = Number(req.query.b)
    const op = String(req.query.op ?? '')
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return res.status(400).json({ error: 'Operandos inválidos' })
    }
    let result: number
    switch (op) {
      case '+': result = a + b; break
      case '-': result = a - b; break
      case '*': result = a * b; break
      case '/': result = b === 0 ? NaN : a / b; break
      default: return res.status(400).json({ error: 'Operador no permitido' })
    }
    res.json({ result })
  }
}
```

```powershell
git add routes/demoCalculator.ts
git commit -s -m "fix: reemplaza eval por operaciones permitidas"
git push
```

Con GitHub Desktop, el segundo commit se sube con `Push origin` sobre la misma rama `demo-vulnerabilidad`.

Resultado local después de la corrección:

```text
0 hallazgos para javascript_lang_eval_user_input
```

En el Pull Request, la alerta de la versión vulnerable queda cerrada después del nuevo push, porque el análisis diferencial ya no encuentra el `eval` introducido por la rama.

### Evidencias

- Pull Request con la alerta sobre la línea vulnerable: `capturas/05-pr-alerta.png`
- Pull Request con la alerta cerrada después de la corrección: `capturas/06-pr-corregido.png`

---

## Parte E — Preguntas de análisis

### 14. ¿Qué diferencias encontraste entre el análisis local y el del pipeline? ¿Por qué conviene tener los dos?

El análisis local es inmediato y permite experimentar con opciones, rutas, severidades y reglas antes de subir cambios. También sirve para revisar el código con calma y entender los hallazgos. El pipeline, en cambio, se ejecuta siempre en un entorno limpio y reproducible, sobre cada push y cada pull request, y deja evidencia centralizada en GitHub Actions y en Code Scanning.

Conviene tener los dos porque se complementan: el local da retroalimentación temprana al desarrollador (shift-left) y el pipeline actúa como control obligatorio que no depende de que alguien recuerde ejecutar la herramienta. Además, el pipeline conserva historial, aplica los mismos permisos y puede bloquear la integración de cambios inseguros.

### 15. ¿Qué ventajas y limitaciones tiene SAST frente a DAST?

**Ventajas de SAST:** analiza el código sin ejecutar la aplicación, detecta problemas en etapas tempranas, cubre rutas y archivos que quizá no se ejercitan en pruebas manuales, y señala la línea exacta del código. Es útil para inyectar seguridad en el ciclo de desarrollo y para revisar cambios en pull requests.

**Limitaciones de SAST:** puede producir falsos positivos porque no conoce el contexto de ejecución, la configuración real ni los controles externos; depende del lenguaje y de las reglas disponibles; y no siempre demuestra que la vulnerabilidad sea explotable.

**Ventajas de DAST:** prueba la aplicación en ejecución, por lo que valida la explotabilidad real, incluye configuración del servidor, autenticación, sesiones y problemas que solo aparecen en tiempo de ejecución.

**Limitaciones de DAST:** requiere una aplicación desplegada y accesible, llega más tarde en el ciclo, puede no cubrir todas las rutas y estados, y no siempre indica la línea de código que originó el problema.

La conclusión es que SAST y DAST no son excluyentes: SAST ayuda a prevenir y DAST ayuda a validar.

### 16. ¿Bloquearías el merge de un PR si el SAST encuentra hallazgos? ¿Con qué criterio (severidad, tipo)?

Sí, bloquearía el merge para hallazgos **críticos y altos confirmados** que afecten código de producción y sean explotables. Para hallazgos medios, permitiría el merge con revisión y un plazo de corrección; para los bajos, no bloquearía, pero los registraría.

El criterio no debería ser solo la severidad. También consideraría: si el código está en una ruta realmente expuesta, si el dato llega desde el usuario, si existe una mitigación compensatoria, y si el hallazgo fue revisado y marcado como falso positivo. Además, usaría protección de rama para exigir que el check de SAST esté en verde, y un proceso documentado de excepciones con justificación y fecha de revisión.

### 17. Elige un hallazgo que consideres falso positivo y explica cómo lo gestionarías en Bearer sin desactivar la regla para todo el proyecto.

Elegiría el hallazgo `javascript_lang_observable_timing` en `routes/login.ts:37`:

```ts
if (user.data?.id && user.data.totpSecret !== '') {
```

Bearer lo marca como una posible discrepancia de tiempo al comparar un secreto. En realidad, esa comparación solo comprueba si el usuario tiene configurado un segundo factor (`totpSecret !== ''`); no está validando el valor del secreto ni comparándolo con una entrada del atacante. Por eso lo considero un falso positivo en este contexto.

Para gestionarlo sin desactivar la regla globalmente, usaría el fingerprint del hallazgo y el archivo `bearer.ignore`:

```powershell
bearer ignore add d1bc10543b48b63f88106e770ff22029_0 `
  --false-positive `
  --author MasterJD `
  --comment "Solo verifica si el 2FA está configurado; no compara un secreto"
```

Esto genera una entrada en `bearer.ignore` asociada al hallazgo concreto (archivo, línea y huella), no a la regla completa. El archivo se versiona en el repositorio y Bearer lo lee tanto en local como en el pipeline. Así se documenta la decisión, se mantiene la regla activa para el resto del proyecto y se evita que el mismo falso positivo vuelva a aparecer en cada ejecución.

---

## Checklist de capturas para el PDF

- [ ] Ejecución local de Bearer en la terminal (Docker o WSL).
- [ ] Reporte HTML abierto en el navegador.
- [ ] Pestaña Actions con el workflow ejecutado correctamente.
- [ ] Security > Code scanning con los hallazgos de Bearer.
- [ ] Pull Request con la alerta sobre la línea vulnerable.
- [ ] Pull Request con la alerta cerrada después de la corrección.
