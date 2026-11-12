# ProductLab

ProductLab is an early-stage workspace for tracking e-commerce products, campaigns, store metrics, creative concepts, prompts, and team discussions. It is built with HTML, CSS, JavaScript, and Supabase.

## Run locally

1. Copy `config.example.js` to `config.local.js`.
2. Put your Supabase project URL and publishable key in `config.local.js`. Never put a secret or service-role key in browser code.
3. Serve this folder with a local static web server and open its address in your browser. For example, with Node installed, run `npx serve .` from this folder.
4. Run the SQL setup files in Supabase SQL Editor in this order when creating a fresh project: `supabase-setup.sql`, `supabase-profile-setup.sql`, `supabase-workspace-settings.sql`, then `supabase-cloud-data.sql`.

`config.local.js` is ignored by Git. Keep it on your computer and do not commit it.

## Current status

This is a prototype under active development. Some older sections were originally stored in browser storage; the cloud adapter and backup import/export are being integrated. Verify account isolation, workspace sharing, uploads, and restore flows before relying on it for important data.

Google Search Console ownership verification is intentionally not included in the repository. It is specific to the owner's hosting property.

## Data transfer

The app includes a backup export/import flow in Workspace settings. Keep the exported backup until the imported records have been confirmed in the destination account. Prompts and winner concepts are shared with workspace members; the other listed collections are scoped to the signed-in account.

## Files

- `index.html`, `style.css`: page and styling.
- `app.js`: ProductLab sections and interactions.
- `auth.js`, `group.js`: sign-in, profiles, membership, and chat.
- `cloud.js`: account and workspace collection storage plus backup transfer.
- `supabase-*.sql`: database setup and policy scripts.
- `config.example.js`: safe configuration template.
