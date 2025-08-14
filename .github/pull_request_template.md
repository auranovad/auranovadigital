# Objetivo
_Describe en 1–2 líneas el resultado que se busca con este PR._

## Alcance
- **Autor:** ( ) Yo  ( ) lovable-dev[bot]  ( ) Externo
- **Áreas tocadas:** _enumera módulos/rutas_
- **Tipo:** ( ) feat  ( ) fix  ( ) chore  ( ) docs  ( ) test  ( ) refactor
- **Breaking changes:** ( ) Sí  ( ) No

---

## Checklist (marca con [x])

### Calidad y CI
- [ ] `npm ci && npm run typecheck && npm run lint && npm run build` pasan en `app/`.
- [ ] Tests de unidad / smoke (`npm run test`) pasan; se añadieron/ajustaron tests si aplica.
- [ ] Preview de Vercel OK; rutas `/`, `/admin`, `/admin/wizard` sin 404.
- [ ] No se introducen warnings/errores nuevos en consola.

### Seguridad, datos y DB
- [ ] Sin secretos nuevos en el repo; variables solo `VITE_*` / `NEXT_PUBLIC_*`.
- [ ] Secret/Dependabot sin hallazgos **críticos**.
- [ ] **Si toca `supabase/**`:** SQL dry-run + **RLS** tests pasan en CI.
- [ ] Impacto en **RLS/privacidad** evaluado (si aplica) y documentado abajo.

### Guardrails del repo
- [ ] **Si el autor es `lovable-dev[bot]`:** SOLO hay cambios en `app/**`.
- [ ] No se tocó `supabase/**`, `.github/**`, `cloudflared/**`, `n8n/**`, `docker*`, `deploy_db.yml`, `ci.yml` salvo aprobación explícita.
- [ ] Archivos de **infra** (si aplica) con aprobación de **CODEOWNERS**.

### Documentación y operación
- [ ] README/CHANGELOG/Runbooks actualizados cuando aplica.
- [ ] Incluye *capturas o video* si hay cambios de UI.
- [ ] **Plan de rollback** y riesgos documentados.

## Pruebas manuales
_Pasos reproducibles y resultado esperado._
1. …
2. …
3. …

## Riesgos y mitigación
- Riesgo:
- Mitigación / Rollback:

## Notas de seguridad/privacidad (RLS, tokens, datos)
_Describe acceso a datos, scopes, RLS, etc._

## Notas de despliegue
- ¿Requiere env vars, migraciones, reindex, jobs?

## Referencias
Fixes #<issue>, enlaces a diseños/tickets/docs, etc.
