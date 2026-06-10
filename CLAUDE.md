# AlanOS — Wedding Event App

Interactive web app for use on the wedding day. Guests use it on their phones; the admin (best man) controls the quiz and approves photos from the same app. Two dedicated projector views run on big screens.

## Stack
- React 18 + TypeScript + Vite (SPA, no router library)
- Firebase: Auth (anonymous + email/password) + Firestore (realtime)
- Cloudinary: permanent photo storage (after admin approval)
- Deployed to Netlify/Vercel via `vite build` → `dist/`

## Commands
```bash
npm run dev      # Dev server — exposed on LAN (--host) so phones can connect
npm run build    # Production build → dist/
npm test         # Jest + coverage
npm run test:ci  # CI mode, 2 workers
```

## Environment Variables
Sensitive values live in `.env.local` (gitignored). Non-sensitive values are in `.env`.

Required in `.env.local`:
```
VITE_ADMIN_EMAIL            # Email of the admin Firebase account
VITE_CLOUDINARY_NAME        # Cloudinary cloud name
```

## Routing
No React Router. All routing is manual in `src/App.tsx` via `window.location`:

| URL | Renders |
|-----|---------|
| `/` | Guest flow (loading terminal → menu → quiz / upload / message) |
| `/admin` or `/?admin` | Admin login then dashboard |
| `/projector` | Full-screen quiz projector (no auth required) |
| `/photo-projector` | Full-screen photo slideshow |

The Netlify/Vercel config must have a catch-all redirect to `index.html`.

## Auth
- **Guests** — signed in anonymously on page load (Firebase anonymous auth)
- **Admin** — signs in with email/password; admin status is checked by:
  1. Firebase custom claim `admin: true` on the ID token (preferred), OR
  2. Email matching `VITE_ADMIN_EMAIL` (current working fallback — custom claims not yet configured)
- All auth state lives in `src/contexts/AuthContext.tsx` via `useAuth()`

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root: URL routing, auth gate, guest view switcher |
| `src/contexts/AuthContext.tsx` | Firebase auth wrapper, `isAdmin` logic |
| `src/lib/firebase.ts` | Firebase app init — import services from here, never re-instantiate |
| `src/lib/env.ts` | Env var accessor (use this, not `import.meta.env` directly — it's mockable in Jest) |
| `src/lib/photoStorage.ts` | All Firestore photo ops + Cloudinary upload logic |
| `src/admin/AdminQuizPanel.tsx` | Set active question, reveal answer, clear responses |
| `src/components/AdminDashboard.tsx` | Tabbed admin UI (quiz / photos / messages) |
| `src/guest/GuestQuizLive.tsx` | Guest-side live quiz with realtime Firestore listener |
| `src/components/QuizProjector.tsx` | Big-screen quiz display with live vote bars |
| `src/components/PhotoProjector.tsx` | Big-screen photo slideshow (loads from localStorage + postMessage) |
| `src/data/quizQuestions.ts` | Static quiz question data — edit here to change questions |

## Firestore Collections

| Collection | Shape | Notes |
|-----------|-------|-------|
| `quiz/state` | `{ activeQuestionIndex: number\|null, revealAnswer: bool }` | Single doc |
| `quiz_responses/{id}` | `{ questionIndex, answer, userId, timestamp }` | One per vote |
| `messages/{id}` | `{ name, message, createdAt }` | Guest wall messages |
| `uploaded_photos/{id}` | `{ url, fileName, uploadedAt, vetted, cloudinaryUrl, publicId }` | `vetted: false` until admin approves |
| `photo_upload/state` | `{ enabled: bool }` | Single doc — toggles guest upload |

## Photo Flow
1. Guest picks image → compressed client-side (max 1920×1080, JPEG 0.8)
2. Stored as **base64 data URL** in Firestore `uploaded_photos` with `vetted: false`
3. Admin reviews in dashboard → approve or reject
4. **Approve**: base64 uploaded to Cloudinary → doc updated with CDN URL, `vetted: true`
5. Vetted photos appear in `PhotoCarousel` and `PhotoProjector`

> **Known limit**: Firestore docs cap at 1 MB. Compressed base64 images can approach this. Large originals may fail to save.

## Quiz Flow
1. Admin selects question → writes `quiz/state.activeQuestionIndex`
2. All guest `GuestQuizLive` components update via realtime listener; each guest votes once
3. Admin clicks Reveal → `revealAnswer: true` written to Firestore
4. `QuizProjector` highlights correct answer and shows live vote percentages

## Conventions
- **All inline styles** — no CSS modules, no Tailwind
- **No routing library** — URL checks done in `App.tsx`
- **`confirm()` / `alert()`** for admin destructive actions — intentional, keeps it simple
- **Env vars** always via `env` object from `src/lib/env.ts`, never `import.meta.env` directly
- **Firebase services** imported from `src/lib/firebase.ts` only

## Known Limitations / Open TODOs
- `deletePhoto()` removes the Firestore doc but does **not** delete the Cloudinary asset — orphaned files accumulate
- Firebase custom claims not configured — admin relies on `VITE_ADMIN_EMAIL` match
- Base64 photo storage in Firestore is a stop-gap; large images risk hitting the 1 MB doc limit
