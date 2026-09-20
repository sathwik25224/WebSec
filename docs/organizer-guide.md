# CyberLearn organizer guide

## Before presenting

Run `./setup.sh`, then `npm run dev`, and browse only `http://127.0.0.1:3000`. Explain that every person, address, payment ID, password, document, and key-looking string is fake. Keep browser developer tools open for request inspection. Use `npm run reset` between groups if you want a pristine state.

## Suggested presentation sequence

1. **Normal walkthrough.** Browse the catalogue, view a course, add it to the cart, use the simulated checkout, dashboard, support form, and administrator dashboard. Establish that it looks like a conventional education product.
2. **Fake database.** Log in as the administrator and open `/admin/database`. Point out the legacy plaintext and unsalted-SHA-256 `password_hash` examples. They are deliberately fake and demonstrate why password storage is a design decision, not a UI decision.
3. **IDOR.** Log in as Alice and open an order she owns, then change only the numeric order ID in `/order/1001`. The handler fetches an existing order but does not compare `orders.user_id` with the session user. Repeat with `/profile/2`.
4. **Price manipulation.** Put a course in the cart. In browser developer tools, alter the checkout form/request fields `price` and `total` before submitting. The order item and total accept the client figures. Discuss server-side canonical pricing.
5. **Weak authentication.** Show the specific “account does not exist” versus “password is incorrect” responses and source code: no local throttling, lockout, or delay. Do not automate guesses; use the provided fake accounts only.
6. **SQL injection.** In the local `/search?q=` form, use a harmless boolean test such as `' OR 1=1 -- `. Discuss how concatenation changes the query. Do not extend this beyond the local seeded SQLite database.
7. **Broken access control.** As a normal logged-in learner, request `/api/admin/users` in the same local browser. The navigation hides admin links, but the API only checks for login. Compare it with the UI routes that use `requireAdmin`.
8. **XSS.** Submit a local, harmless review containing `<b>Example review markup</b>` and reopen the course page. It renders as markup. The same pattern exists for reflected search output. Do not use payloads that steal, transmit, or exfiltrate data.
9. **CSRF.** Inspect `POST /api/profile`: it changes account state but has no token or origin validation. Explain that another local page could submit a cross-site form in an authenticated browser; do not host an external attacker page.
10. **Mass assignment.** Review the `/api/profile` payload handling. It accepts fields such as `role`, `isAdmin`, `discountPercent`, and `courseAccess` despite the profile UI requiring only basic details. Discuss allowlists.
11. **File exposure.** Open `/resources` and inspect `/download?file=`. The filename is client-selected; the resolver is deliberately weak but is hard-confined to the five harmless files in `demo-data/`. It cannot reach host files.
12. **Sensitive information.** Visit `/debug` to show synthetic configuration, route list, and schema metadata. Make clear that it intentionally contains no real secret.
13. **Application-only compromise.** Tie SQL injection, broken access control, IDOR, and debug data to the fake user rows visible in the local database viewer. This is the endpoint of the demo: application errors expose application data, never a real environment.

## Secure code discussion

Search should use `WHERE title LIKE ?` and `'%'+q+'%'` as a parameter. Checkout should query the course ID and calculate the price on the server. Authorization must verify both identity and ownership. Escape all untrusted output, add a CSP, accept only profile allowlist fields, add CSRF defenses, use opaque allowlisted download IDs, and remove debug behavior in production. Passwords require modern slow password hashing with per-user salts.
