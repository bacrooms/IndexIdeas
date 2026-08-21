# Stack Overflow Instagram Effect

A Pen created on CodePen.

Original URL: [https://codepen.io/Andrea-Catanzaro/pen/bNgyqbp](https://codepen.io/Andrea-Catanzaro/pen/bNgyqbp).

## Index Ideas deployment

The production site is served from `dist/`. Registration submissions are sent
to the Vercel Function at `/api/register`, which writes to Supabase without
exposing the Supabase secret key in browser code.

1. Link the project to Vercel and install the Supabase Marketplace integration.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Confirm `SUPABASE_URL` and `SUPABASE_SECRET_KEY` exist in the Vercel project.
4. Run `vercel dev` for local testing. A static file server cannot run `/api/register`.
5. Deploy a preview with `vercel`, verify a row in `public.registrations`, then
   deploy production with `vercel --prod`.

Never commit `.env.local` or place `SUPABASE_SECRET_KEY` in `src/` or `dist/`.
