# Laboratorio SAST con Bearer CLI — OWASP Juice Shop

**Universidad Galileo — Curso de Ciberseguridad — PDSS**  
**Estudiante:** MasterJD · **Carné:** 17001625  
**Repositorio:** <https://github.com/MasterJD/Laboratorio-SAST_17001625>  
**Fecha:** 22 de octubre de 2026

> OWASP Juice Shop es una aplicación deliberadamente vulnerable. Este repositorio se usa únicamente con fines académicos; no debe desplegarse en producción.

## Documentos principales

| Archivo | Contenido |
|---|---|
| [`INFORME_LABORATORIO.md`](INFORME_LABORATORIO.md) | Informe completo del laboratorio: análisis local, pipeline, demo de detección/corrección, evidencias y respuestas de la Parte E. |
| [`SAST_Bearer.pdf`](SAST_Bearer.pdf) | PDF final del informe (21 páginas), con portada, tablas, pipeline y capturas. |
| [`reports/bearer-report.html`](reports/bearer-report.html) | Reporte HTML completo generado por Bearer: 333 hallazgos (12 críticos, 20 altos, 20 medios, 281 bajos). |
| [`reports/bearer-report-critical-high.html`](reports/bearer-report-critical-high.html) | Reporte HTML filtrado a severidades `critical,high`: 32 hallazgos. |
| `README.md` | Este índice de archivos y evidencias. |

Los archivos `reports/bearer-report.json` y `reports/bearer-report.sarif` se generan localmente y no se versionan; los dos HTML sí están incluidos en el repositorio.

## Evidencias

Todas las capturas están en [`evidence/`](evidence/).

| Archivo | Evidencia |
|---|---|
| [`01_PR.png`](evidence/01_PR.png) | PR #1: endpoint vulnerable fusionado en `main`. |
| [`02_Docker_Bearer.png`](evidence/02_Docker_Bearer.png) | Contenedor de Bearer ejecutándose en Docker Desktop. |
| [`03_Docker_Bearer.png`](evidence/03_Docker_Bearer.png) | Imagen local `bearer/bearer:latest-amd64`. |
| [`04_reporte_HTML.png`](evidence/04_reporte_HTML.png) | Reporte HTML de Bearer abierto en el navegador. |
| [`05_actions_main.png`](evidence/05_actions_main.png) | Ejecución de `main`: fallo esperado por hallazgos preexistentes y carga correcta de SARIF/HTML. |
| [`06_actions_pr1.png`](evidence/06_actions_pr1.png) | PR #1: fallo por SARIF vacío antes de corregir el workflow. |
| [`07-code-scanning-alerta.png`](evidence/07-code-scanning-alerta.png) | Lista de alertas en Security > Code scanning. |
| [`08-pr2-check-verde.png`](evidence/08-pr2-check-verde.png) | PR #2: check `SAST con Bearer CLI` en verde. |
| [`09-code-scanning-cerrada.png`](evidence/09-code-scanning-cerrada.png) | Alerta #397 cerrada como `fixed`. |
| [`10_terminal_bearer.png`](evidence/10_terminal_bearer.png) | Ejecución local de Bearer en la terminal: detección del `eval` en `routes/demoCalculator.ts:6`. |
| [`11_pr_alerta_linea.png`](evidence/11_pr_alerta_linea.png) | PR #3: resumen del check con `1 new alert including 1 error`. |
| [`12_pr_files_alerta.png`](evidence/12_pr_files_alerta.png) | PR #3: `Files changed` con el `eval` en la línea 6 y la anotación de Code Scanning. |
| [`13_pr3_checks_verde.png`](evidence/13_pr3_checks_verde.png) | PR #3: checks en verde después de la corrección. |
| [`14_pr3_run_verde.png`](evidence/14_pr3_run_verde.png) | PR #3: ejecución #10 en `success` (25 s). |

## Pipeline y demo

| Elemento | Descripción |
|---|---|
| [`.github/workflows/sast-bearer.yml`](.github/workflows/sast-bearer.yml) | Workflow `SAST con Bearer CLI`: push a `main`, pull requests hacia `main` y ejecución manual. Genera SARIF, lo sube a Code Scanning y publica el HTML como artefacto. |
| [`routes/demoCalculator.ts`](routes/demoCalculator.ts) | Endpoint de demostración. En `main` usa una lista blanca de operaciones; el commit vulnerable `964751a` usaba `eval`. |
| [`bearer.ignore`](bearer.ignore) | Falso positivo documentado para `javascript_lang_observable_timing` en `routes/login.ts:37`. |
| [PR #1](https://github.com/MasterJD/Laboratorio-SAST_17001625/pull/1) | Primer intento: detección y fusión del endpoint vulnerable. |
| [PR #2](https://github.com/MasterJD/Laboratorio-SAST_17001625/pull/2) | Corrección del `eval` y del workflow; fusionado en `ece6143`. |
| [PR #3](https://github.com/MasterJD/Laboratorio-SAST_17001625/pull/3) | Demostración: introduce el `eval`, muestra la alerta en la línea 6 y luego la corrige. Queda abierto como evidencia; su diff final es 0. |
| [Alerta #397](https://github.com/MasterJD/Laboratorio-SAST_17001625/security/code-scanning/397) | Alerta de Bearer cerrada como `fixed` tras la corrección. |

Ejecuciones relevantes:

- PR #3 con la alerta: <https://github.com/MasterJD/Laboratorio-SAST_17001625/actions/runs/39897794109>
- PR #3 con el check verde: <https://github.com/MasterJD/Laboratorio-SAST_17001625/actions/runs/39898670249>
- `main` con las evidencias finales: <https://github.com/MasterJD/Laboratorio-SAST_17001625/actions/runs/39899016811>

El escaneo completo de `main` falla de forma esperada por los 332 hallazgos preexistentes de Juice Shop; el SARIF y el HTML se publican igualmente. El escaneo diferencial de los pull requests solo reporta hallazgos nuevos.

## Estructura relevante

```text
.
├── INFORME_LABORATORIO.md          # Informe completo
├── SAST_Bearer.pdf                 # PDF final del informe
├── README.md                       # Este índice
├── reports/
│   ├── bearer-report.html          # Reporte completo (333 hallazgos)
│   └── bearer-report-critical-high.html  # Filtrado critical/high (32)
├── evidence/
│   └── 01_PR.png ... 14_pr3_run_verde.png
├── .github/workflows/sast-bearer.yml
├── routes/demoCalculator.ts
└── bearer.ignore
```
