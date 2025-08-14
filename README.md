# AuraNovaDigital — Day 1: CORE & Infra Starter (v2)
Objetivo: Repos/CI, DB con RLS, n8n y túnel seguro. Este paquete sirve para pasar el **Gate 1**.

## Entregables del Día 1
- DB con **RLS 100%** (tablas CORE + políticas) + **tests**.
- **n8n** operativo (web/on-prem) con heartbeat.
- **CI verde** (build, lint, unit, E2E base, SQL dry-run, RLS tests, security/secret scan).
- **Cloudflare Tunnel** listo para exponer `app` y `n8n`.
- **Sentry** recibiendo errores de prueba.

## Pasos rápidos
1) Sube este contenido a GitHub en el repo de la app (o mono-repo).  
2) En **Settings → Secrets → Actions** define: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (y opcional `SUPABASE_ANON_KEY`, `SENTRY_DSN`).  
3) Ejecuta manualmente el workflow **Deploy DB to Supabase** (o haz push a `main`).  
4) Verifica CI: todos los checks **verdes**.  
5) Arranca local o en host web (Vercel/Railway).

## Estructura
```
.github/workflows/ci.yml
.github/workflows/deploy_db.yml
.github/workflows/gitleaks.yml
.github/CODEOWNERS
.github/pull_request_template.md
supabase/sql/init_core.sql
supabase/sql/rls_tests.sql
docker-compose.yml
app/Dockerfile
app/package.json
app/index.js
app/.eslintrc.json
app/jest.config.js
app/tests/health.test.js
app/tests/smoke-e2e.mjs
n8n/flows/heartbeat.json
cloudflared/config.yml.example
env.example
<!-- ci: trigger -->
```



```bash
cd app
npm ci
npm run typecheck
npm run lint
npm run build
npm run test
npm run preview



