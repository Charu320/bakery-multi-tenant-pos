# Architectural System Design: Serverless Multi-Tenant POS

 1. Technical Stack Overview
- **Runtime Environment & Package Manager:** Bun v1.x (`bun.lockb`)
- **Frontend Bundler Framework:** React (TypeScript) via Vite
- **Styling Architecture:** Tailwind CSS
- **Backend as a Service (BaaS):** Supabase (PostgreSQL Ecosystem)

---

 2. Direct-to-Database Client Data Highway
Because the platform relies on a serverless Single Page Application (SPA) architecture, data processing bypasses intermediate middleware servers:

1. **Client Actions:** The UI layer captures operational transactions (such as order checkout) inside React context state engines.
2. **Gateway Transport:** The application utilizes the `@supabase/supabase-js` Client SDK to dispatch type-safe asynchronous network calls directly to the hosted Postgres layer.
3. **Authorization Layer:** Security validation is enforced natively at the database tier using PostgreSQL **Row-Level Security (RLS)** policies, verifying incoming user identity claims against localized access roles before processing mutations.
4. **Real-Time Distribution:** Upon successful execution, database rows broadcast updates over persistent **WebSockets pipelines** via Supabase Realtime, immediately updating listening kitchen display cards.
