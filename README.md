# FormCraft Pro

FormCraft Pro is a local-first visual form builder built with Next.js App Router. It lets you create forms in a nested layout tree:

```text
Form -> Sections -> Rows -> Columns -> Fields
```

The app stores drafts in browser `localStorage`, supports JSON import/export, renders a live preview, validates submissions with dynamic Zod schemas, and does not require a backend.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [How To Test Locally](#how-to-test-locally)
- [Manual QA Flow](#manual-qa-flow)
- [GitHub Push Workflow](#github-push-workflow)
- [Deploy To Vercel](#deploy-to-vercel)
- [Import And Export JSON](#import-and-export-json)
- [Persistence And Migration](#persistence-and-migration)
- [Troubleshooting](#troubleshooting)
- [Release Checklist](#release-checklist)

## Features

- Dashboard for creating, importing, searching, duplicating, exporting, renaming, and deleting forms.
- Template gallery with:
  - Contact Form
  - Job Application
  - Customer Intake
  - Feedback
  - Event Registration
  - Newsletter Signup
  - Support Request
  - Survey
  - Lead Capture
  - Bug Report
- Builder with left panel tabs:
  - Fields
  - Layouts
  - Templates
  - Outline
- Nested layout canvas:
  - Sections
  - Rows
  - Resizable columns
  - Column drop zones
  - Empty column placeholders
  - Selectable section, row, column, and field states
- Field library:
  - text
  - textarea
  - email
  - number
  - phone
  - password
  - select
  - radio
  - checkbox
  - date
  - switch
  - file
  - sectionTitle
  - divider
- Preview page with local validation and temporary submitted JSON output.
- Local-only persistence with no auth, backend, database, email, webhook, or real file upload storage.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Zustand persist
- React Hook Form
- Zod
- dnd-kit
- Lucide React
- Sonner
- Vitest
- Testing Library
- Playwright
- `localStorage`

## Project Structure

```text
src/
  app/
    page.tsx
    forms/[formId]/builder/page.tsx
    forms/[formId]/preview/page.tsx
    providers.tsx
  components/ui/
    badge.tsx
    button.tsx
    input.tsx
    label.tsx
    select.tsx
    separator.tsx
    textarea.tsx
  features/
    builder/
      BuilderPage.tsx
      BuilderPage.test.tsx
    dashboard/
      Dashboard.tsx
      Dashboard.test.tsx
    preview/
      PreviewPage.tsx
      PreviewPage.test.tsx
  lib/
    field-definitions.ts
    generate-zod-schema.ts
    get-all-fields.ts
    import-export.ts
    layout-presets.ts
    migrate-form-schema.ts
    templates.ts
    utils.ts
  stores/
    form-builder-store.ts
  types/
    form.ts
```

## Data Model

The exported Pro schema shape is:

```ts
type FormSchema = {
  id: string;
  title: string;
  description?: string;
  layout: {
    sections: FormSection[];
  };
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
};
```

Layout nesting:

```text
FormSchema.layout.sections[]
  FormSection.rows[]
    FormRow.columns[]
      FormColumn.fields[]
```

Selection state uses:

```ts
{ type: "form"; id: string }
{ type: "section"; id: string }
{ type: "row"; id: string }
{ type: "column"; id: string }
{ type: "field"; id: string }
```

Column widths are numeric percentages and must sum to `100` within each row.

## Prerequisites

Use these versions or newer compatible versions:

- Node.js 20+
- pnpm 9+
- Git
- Optional for GitHub push: GitHub CLI `gh`
- Optional for CLI deployment: Vercel CLI

Check your environment:

```bash
node --version
pnpm --version
git --version
gh --version
```

If `gh` is not authenticated:

```bash
gh auth login
gh auth status
```

## Local Setup

1. Clone the repository:

```bash
git clone <your-github-repo-url>
cd formcraft
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the local dev server:

```bash
pnpm dev
```

4. Open the app:

```text
http://localhost:3000
```

If port `3000` is busy, use another port:

```bash
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

Then open:

```text
http://127.0.0.1:3100
```

## How To Test Locally

Run the automated checks in this order:

```bash
pnpm lint
pnpm test
pnpm build
```

What each command checks:

- `pnpm lint`: ESLint and React/Next.js lint rules.
- `pnpm test`: Vitest unit and component tests.
- `pnpm build`: production Next.js build and TypeScript type checking.

Expected result:

```text
pnpm lint   -> no errors
pnpm test   -> all tests pass
pnpm build  -> production build completes
```

Run local browser QA:

1. Start the dev server:

```bash
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

2. Open:

```text
http://127.0.0.1:3100
```

3. Verify the dashboard:

- The page title says `FormCraft`.
- The template gallery is visible.
- Search input is visible.
- `Create form` and `Import form` buttons are visible.

4. Verify template creation:

- Click `Contact Form`.
- Confirm the app navigates to `/forms/<formId>/builder`.
- Confirm the builder shows sections, rows, columns, fields, and settings.

5. Verify builder behavior:

- Click `Add section`.
- Click `2 columns`.
- Select a column.
- Add a `Text Input`.
- Drag or use resize handle between columns.
- Select a field and edit its label or field name.
- Click `Outline` and select nested elements.
- Confirm the settings panel changes for form, section, row, column, and field.

6. Verify preview and validation:

- Click `Preview`.
- Submit without required values and confirm validation errors appear.
- Fill required values.
- Click `Submit locally`.
- Confirm the Submitted JSON panel displays the local payload.
- Click `Reset` and confirm the form clears.

7. Verify mobile layout:

- Open browser dev tools.
- Set viewport to a mobile size such as `390 x 844`.
- Confirm tabs show `Fields`, `Canvas`, `Settings`, and `Preview`.
- Confirm content does not overlap or clip.

## Manual QA Flow

Use this flow before every release:

```text
Dashboard -> create template -> builder -> add section -> add row -> add field -> resize columns -> preview -> submit -> copy JSON
```

Checklist:

- Dashboard loads without a framework error overlay.
- Builder loads without console errors.
- Preview loads without console errors.
- No text overlaps at desktop width.
- No text overlaps at mobile width.
- Column widths stay valid after resize.
- Exported JSON contains `layout.sections`.
- Imported Pro JSON restores the layout tree.
- Imported legacy flat JSON migrates into one section, one row, and one column.

## GitHub Push Workflow

1. Check the current branch and working tree:

```bash
git branch --show-current
git status --short
```

2. If this repository does not have a remote yet, create a GitHub repository:

```bash
gh repo create formcraft --private --source=. --remote=origin
```

Use `--public` instead of `--private` if the repository should be public.

3. Run the checks:

```bash
pnpm lint
pnpm test
pnpm build
```

4. Stage the intended files:

```bash
git add README.md next.config.ts package.json pnpm-lock.yaml vitest.config.mts src
```

5. Commit:

```bash
git commit -m "Build FormCraft Pro local-first form builder"
```

6. Push:

```bash
git push -u origin main
```

7. Confirm the remote:

```bash
git remote -v
git log --oneline -5
```

## Deploy To Vercel

### Option A: Deploy From Vercel Dashboard

1. Push the repository to GitHub.
2. Open Vercel.
3. Click `Add New...`.
4. Click `Project`.
5. Import the GitHub repository.
6. Use these settings:

```text
Framework Preset: Next.js
Build Command: pnpm build
Install Command: pnpm install
Output Directory: .next
Node.js Version: 20.x or newer
```

7. Click `Deploy`.
8. After deploy finishes, open the production URL.
9. Run the manual QA flow from this README.

### Option B: Deploy With Vercel CLI

1. Install the CLI if needed:

```bash
pnpm dlx vercel --version
```

2. Login:

```bash
pnpm dlx vercel login
```

3. Link the local project:

```bash
pnpm dlx vercel link
```

4. Deploy a preview:

```bash
pnpm dlx vercel
```

5. Deploy production:

```bash
pnpm dlx vercel --prod
```

6. Inspect the deployment:

```bash
pnpm dlx vercel inspect <deployment-url>
```

## Import And Export JSON

Exported JSON uses the Pro layout tree:

```json
{
  "id": "form_...",
  "title": "Contact Form",
  "description": "Name, email, phone, and message",
  "layout": {
    "sections": []
  },
  "settings": {
    "submitButtonText": "Submit"
  },
  "createdAt": "2026-05-15T00:00:00.000Z",
  "updatedAt": "2026-05-15T00:00:00.000Z"
}
```

Legacy flat schemas with `fields` are accepted during import and migrated automatically.

Legacy field compatibility:

- `section` becomes `sectionTitle`.
- `divider` remains `divider`.
- Legacy `width` moves to `field.settings.width`.

## Persistence And Migration

Current storage key:

```text
formcraft-pro-storage
```

Legacy storage key:

```text
formcraft-storage
```

Migration behavior:

- If Pro storage already has forms, it is used as-is.
- If Pro storage is empty and legacy storage exists, legacy flat forms are migrated.
- Migration converts flat `fields` into:

```text
one section -> one row -> one column -> migrated fields
```

Clear local data during development:

```js
localStorage.removeItem("formcraft-pro-storage");
localStorage.removeItem("formcraft-storage");
```

## Troubleshooting

### Port 3000 is already in use

Run another port:

```bash
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

### Tests fail after changing field definitions

Run:

```bash
pnpm test
```

Check these files first:

- `src/lib/field-definitions.ts`
- `src/lib/generate-zod-schema.ts`
- `src/lib/import-export.ts`
- `src/stores/form-builder-store.ts`

### Imported JSON fails

Confirm the JSON has either:

- Pro shape with `layout.sections`
- Legacy shape with `fields`

Malformed field types are rejected.

### Vercel build fails

Run the same build locally:

```bash
pnpm install
pnpm build
```

Then check:

- Node.js version
- pnpm lockfile
- TypeScript errors
- missing environment variables

This app currently requires no environment variables.

### GitHub push fails

Check auth:

```bash
gh auth status
```

Check remote:

```bash
git remote -v
```

If no remote exists:

```bash
gh repo create formcraft --private --source=. --remote=origin
```

Then push:

```bash
git push -u origin main
```

## Release Checklist

Before pushing or deploying:

```bash
pnpm lint
pnpm test
pnpm build
```

Manual checks:

- Dashboard template creation works.
- Builder section/row/column/field flow works.
- Column resize works.
- Outline selects nested elements.
- Settings panel changes by selected element type.
- Preview validation works.
- Local submission JSON appears.
- Mobile tabs work.
- No browser console errors.

Deployment checks:

- Production URL opens.
- Dashboard renders.
- Builder route renders.
- Preview route renders.
- LocalStorage persistence works in the deployed browser.
# formcraft
