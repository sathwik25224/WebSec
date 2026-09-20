# CyberLearn — local web security demonstration

CyberLearn is a realistic, local-only cybersecurity course marketplace for a university web-security presentation. It intentionally places insecure implementation choices beneath an ordinary e-commerce interface so the discussion can focus on how everyday application features fail when security is treated as an afterthought.

**Safety:** bind address is `127.0.0.1`; all records, payment references, contact details, documents, and credentials are fictional; SQLite is local; checkout is simulated; there is no external network attack, command execution, or host-file access.

## Run it

```bash
chmod +x setup.sh
./setup.sh
npm run dev
```

Open `http://127.0.0.1:3000`.

Demo accounts:

- Administrator: `admin@cyberlearn.local` / `DemoAdmin123!`
- Learner: `alice@cyberlearn.local` / `alice123`
- Another learner: `ben@cyberlearn.local` / `ben123`

Commands: `npm run setup`, `npm run dev`, `npm run start`, `npm run seed`, `npm run reset`, `npm run db:init`.

## Architecture and data

Express serves server-rendered HTML and JSON APIs. `better-sqlite3` stores local data in `data/cyberlearn.db`; `scripts/seed.js` creates categories, courses, users, orders, order items, carts, reviews, support messages, uploaded-file records, and audit logs. The seed uses fifteen fictional learner records plus the demo administrator, twenty orders, thirty order items, twenty reviews, ten support messages, and five local documents.

Some seed accounts deliberately use plaintext passwords and others unsalted standard SHA-256 hashes. This is intentionally insecure legacy-data simulation only; no authentic credential is present.

## Demonstration-only weaknesses and remediation

| Feature | Vulnerable local behavior | Secure remediation |
|---|---|---|
| Login | No throttling/lockout and verbose failures | Rate limit, generic responses, lockout/backoff, bcrypt/Argon2 |
| Search | Concatenates the search term into SQLite SQL | Parameterized query (`LIKE ?`) |
| Orders / profiles | Object existence is checked, not ownership | Authorize every object against session user/role |
| Checkout | Uses browser-supplied price/total | Load canonical course prices server-side and calculate total |
| Admin API | `/api/admin/users` requires login but not role | Server-side `requireAdmin` for every admin route/API |
| Reviews | Stored review text is rendered as HTML | Escape/sanitize output and use a CSP |
| Search output | Reflected query is rendered as HTML | Encode all untrusted output |
| Profile API | Broad field list includes privilege fields | Explicit allowlist: name, bio, phone, preferences |
| Profile update | No CSRF token/origin verification | CSRF tokens, Origin checks, strict SameSite cookies |
| Downloads | Caller supplies a demo file path/name | Map opaque IDs to allowlisted files, normalize/reject traversal |
| Debug | Development schema/config metadata exposed | Disable in production, minimize errors, never return secrets |

Vulnerable source code is marked `INTENTIONALLY VULNERABLE FOR WEB SECURITY DEMONSTRATION`; adjacent secure-remediation guidance is in comments and the organizer guide. The download resolver is additionally sandboxed to `demo-data/`, so it cannot read host files even for the demonstration.

## Reset

Use `npm run reset` to recreate the database from the original fake seed. The local event-only `POST /api/reset` is available for a presenter and rebuilds the seed database; restart the server after it returns because the live SQLite connection is intentionally closed during the reset.

See [the organizer guide](docs/organizer-guide.md) for presentation flow and safe demonstration notes.
