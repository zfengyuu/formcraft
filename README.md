# FormCraft Pro

FormCraft Pro is a local-first visual form builder built with Next.js App Router. It helps users create, preview, validate, import, and export complex forms without requiring a backend, database, authentication, or external form service.

The builder is designed around a nested layout model:

```txt
Form -> Sections -> Rows -> Columns -> Fields
```

This structure makes it possible to build flexible forms with sections, responsive rows, resizable columns, and a wide range of field types while keeping the exported schema clean and portable.

## Overview

FormCraft Pro provides a browser-based form building experience focused on speed, portability, and local-first workflows.

Users can create forms from templates, customize layouts visually, preview submissions, validate input with dynamic Zod schemas, and export the final form as JSON. Drafts are persisted locally in browser `localStorage`, making the app easy to run without any backend infrastructure.

## Key Features

- Local-first form builder with no backend dependency.
- Dashboard for creating, importing, searching, duplicating, exporting, renaming, and deleting forms.
- Template gallery for quickly starting common form types.
- Visual builder with nested sections, rows, columns, and fields.
- Resizable columns with percentage-based layout rules.
- Live preview page with local validation.
- Dynamic Zod schema generation based on form configuration.
- JSON import/export for portable form schemas.
- Legacy flat schema migration into the Pro nested layout model.
- Local persistence through browser `localStorage`.
- Mobile-friendly builder experience with dedicated tabs.

## Template Gallery

FormCraft Pro includes starter templates for common use cases:

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

## Builder Experience

The builder includes a left panel with organized tabs:

- `Fields`
- `Layouts`
- `Templates`
- `Outline`

The canvas supports:

- Sections
- Rows
- Resizable columns
- Column drop zones
- Empty column placeholders
- Selectable section, row, column, and field states

The settings panel changes based on the selected element type, allowing users to configure the form, layout containers, and individual fields.

## Field Library

Supported field types:

- `text`
- `textarea`
- `email`
- `number`
- `phone`
- `password`
- `select`
- `radio`
- `checkbox`
- `date`
- `switch`
- `file`
- `sectionTitle`
- `divider`

## Tech Stack

| Area | Technologies |
| --- | --- |
| Framework | Next.js App Router |
| UI | React, TypeScript, Tailwind CSS |
| Components | shadcn-style local UI primitives |
| State management | Zustand persist |
| Forms | React Hook Form |
| Validation | Zod |
| Drag and drop | dnd-kit |
| Icons | Lucide React |
| Notifications | Sonner |
| Testing | Vitest, Testing Library, Playwright |
| Persistence | Browser `localStorage` |

## Project Structure

```txt
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

The exported Pro schema uses this shape:

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

```txt
FormSchema.layout.sections[]
  FormSection.rows[]
    FormRow.columns[]
      FormColumn.fields[]
```

Selection state supports:

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
- Optional: GitHub CLI `gh`
- Optional: Vercel CLI

Check your local environment:

```bash
node --version
pnpm --version
git --version
gh --version
```

If GitHub CLI is not authenticated:

```bash
gh auth login
gh auth status
```

## Local Setup

Clone the repository:

```bash
git clone <your-github-repo-url>
cd formcraft
```

Install dependencies:

```bash
pnpm install
```

Start the local development server:

```bash
pnpm dev
```

Open the app:

```txt
http://localhost:3000
```

If port `3000` is busy, run the app on another port:

```bash
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

Then open:

```txt
http://127.0.0.1:3100
```

## Development Commands

Run lint checks:

```bash
pnpm lint
```

Run tests:

```bash
pnpm test
```

Build for production:

```bash
pnpm build
```

Recommended full check before pushing:

```bash
pnpm lint
pnpm test
pnpm build
```

Expected result:

```txt
pnpm lint   -> no errors
pnpm test   -> all tests pass
pnpm build  -> production build completes
```

## Manual QA Flow

Use this flow before every release:

```txt
Dashboard -> create template -> builder -> add section -> add row -> add field -> resize columns -> preview -> submit -> copy JSON
```

Checklist:

- Dashboard loads without a framework error overlay.
- Template gallery is visible.
- Search input is visible.
- `Create form` and `Import form` buttons are visible.
- Creating a template navigates to `/forms/<formId>/builder`.
- Builder loads sections, rows, columns, fields, and settings.
- Adding a section works.
- Adding a row works.
- Adding a field works.
- Column resizing keeps total row width valid.
- Outline selects nested elements correctly.
- Settings panel changes for form, section, row, column, and field.
- Preview loads without console errors.
- Required field validation works.
- Local submission JSON appears after successful submit.
- Reset clears the local preview form.
- Mobile layout works without overlap or clipping.

## Mobile QA

To verify the mobile experience:

1. Open browser DevTools.
2. Set the viewport to a mobile size, such as `390 x 844`.
3. Confirm the mobile tabs are visible:
   - `Fields`
   - `Canvas`
   - `Settings`
   - `Preview`
4. Confirm content does not overlap, clip, or break layout.
5. Confirm builder interactions remain usable.

## Import and Export JSON

Exported JSON uses the Pro nested layout tree:

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

## Persistence and Migration

Current storage key:

```txt
formcraft-pro-storage
```

Legacy storage key:

```txt
formcraft-storage
```

Migration behavior:

- If Pro storage already has forms, it is used as-is.
- If Pro storage is empty and legacy storage exists, legacy flat forms are migrated.
- Migration converts flat `fields` into:

```txt
one section -> one row -> one column -> migrated fields
```

Clear local data during development:

```js
localStorage.removeItem("formcraft-pro-storage");
localStorage.removeItem("formcraft-storage");
```

## GitHub Push Workflow

Check the current branch and working tree:

```bash
git branch --show-current
git status --short
```

If this repository does not have a remote yet, create a GitHub repository:

```bash
gh repo create formcraft --private --source=. --remote=origin
```

Use `--public` instead of `--private` if the repository should be public.

Run checks:

```bash
pnpm lint
pnpm test
pnpm build
```

Stage the intended files:

```bash
git add README.md next.config.ts package.json pnpm-lock.yaml vitest.config.mts src
```

Commit:

```bash
git commit -m "Build FormCraft Pro local-first form builder"
```

Push:

```bash
git push -u origin main
```

Confirm the remote:

```bash
git remote -v
git log --oneline -5
```

## Deploy to Vercel

### Option A: Deploy from the Vercel Dashboard

1. Push the repository to GitHub.
2. Open Vercel.
3. Click `Add New...`.
4. Click `Project`.
5. Import the GitHub repository.
6. Use these settings:

```txt
Framework Preset: Next.js
Build Command: pnpm build
Install Command: pnpm install
Output Directory: .next
Node.js Version: 20.x or newer
```

7. Click `Deploy`.
8. Open the production URL after deployment finishes.
9. Run the manual QA flow from this README.

### Option B: Deploy with Vercel CLI

Check the CLI:

```bash
pnpm dlx vercel --version
```

Login:

```bash
pnpm dlx vercel login
```

Link the local project:

```bash
pnpm dlx vercel link
```

Deploy a preview:

```bash
pnpm dlx vercel
```

Deploy production:

```bash
pnpm dlx vercel --prod
```

Inspect the deployment:

```bash
pnpm dlx vercel inspect <deployment-url>
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

Manual release checks:

- Dashboard template creation works.
- Builder section, row, column, and field flow works.
- Column resize works.
- Outline selects nested elements.
- Settings panel changes by selected element type.
- Preview validation works.
- Local submission JSON appears.
- Mobile tabs work.
- No browser console errors.
- Production URL opens.
- Dashboard renders in production.
- Builder route renders in production.
- Preview route renders in production.
- LocalStorage persistence works in the deployed browser.

## Product Direction

FormCraft Pro aims to become a flexible local-first form building tool for developers, product teams, and internal tools.

Future improvements may include:

- More advanced field conditions.
- Multi-page forms.
- Theme customization.
- Form schema versioning.
- Reusable field groups.
- Export to React components.
- Optional backend integrations.
- Webhook and email support.
- Real file upload storage.

## Status

FormCraft Pro is currently in MVP development.

The current version focuses on local-first persistence, visual nested layout editing, template-based creation, live preview, validation, JSON import/export, and legacy schema migration.

## License

Add your license here.

# formcraft
