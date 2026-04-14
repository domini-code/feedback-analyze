# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm lint       # Run ESLint
```

## Architecture

This is a **Next.js 16 App Router** project with **React 19** and **Tailwind CSS v4**.

## Contrato de API — POST /api/analyze-feedback

Request:
{ "feedback": "string con uno o varios items separados por salto de línea" }

Response:
{
"items": [
{ "text": "string", "category": "bug|feature_request|elogio|pain_point|no_clasificable", "sentiment": "positive|negative|neutral" }
],
"summary": {
"total": number,
"by_category": { "bug": n, "feature_request": n, "elogio": n, "pain_point": n, "no_clasificable": n },
"overall_sentiment": "positive|negative|neutral|mixed"
}
}

## Reglas de clasificación

- Cada item va a exactamente una categoría — no a varias
- no_clasificable es la salida para feedback ambiguo o irrelevante
- El endpoint devuelve SIEMPRE el mismo schema, independientemente del número de items

### Key conventions in this version

- **`params` and `searchParams` are Promises** — always `await` them in page/layout components.
- **Route Handlers** live at `app/*/route.ts`, export named HTTP methods (`GET`, `POST`, etc.), and use the Web `Request`/`Response` APIs directly.
- **Server Components are the default** — add `'use client'` only at the boundary where interactivity or browser APIs are needed (state, event handlers, `localStorage`, etc.). Prefer keeping the directive as deep in the tree as possible.
- **Server Functions** use `'use server'` at the top of a file or inline inside a function body.

### Styling

Tailwind CSS v4 — configured via `@import "tailwindcss"` in `globals.css` with custom properties defined under `@theme inline`. There is no `tailwind.config.*` file; all theme customization goes inside the CSS file.

### Path aliases

`@/*` maps to the project root (e.g. `@/app/...`, `@/lib/...`).

### Package manager

`pnpm`. Use `pnpm add <pkg>` to install dependencies.

## OpenSpec workflow

Design artifacts live in `openspec/changes/<change-name>/`. To implement a proposed change run `/opsx:apply`; to propose a new one run `/opsx:propose`.
