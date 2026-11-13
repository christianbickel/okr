# Projektstruktur (Next.js App Router)

```text
okr/
├── docs/
│   ├── CONSOLIDATE_SCHEMA.md      # Datensammlungen & Felder in Consolidate
│   └── PROJECT_STRUCTURE.md
├── scripts/                       # Seed / Admin-Utilities (Service-User)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/             # API-Key Login (User)
│   │   ├── (app)/
│   │   │   ├── layout.tsx         # App-Shell (Nav, Dark Mode)
│   │   │   ├── dashboard/         # Gesamtfortschritt, überfällige Check-ins
│   │   │   ├── cycles/            # Zyklus-Management
│   │   │   ├── objectives/        # OKR-Listen & Detail
│   │   │   ├── alignment/         # Visueller Alignment-Baum
│   │   │   └── settings/          # Rollen-Hinweise, Service-Status
│   │   ├── api/
│   │   │   └── consolidate/       # BFF-Proxy (optional), nie Key an Client
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Entry / Redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui
│   │   ├── okr/
│   │   │   ├── okr-card.tsx       # Objective + KRs + Check-in
│   │   │   ├── check-in-modal.tsx
│   │   │   └── status-badge.tsx
│   │   └── layout/
│   ├── hooks/
│   └── lib/
│       ├── consolidate/
│       │   ├── client.ts          # GraphQL Client (server-only)
│       │   └── env.ts
│       ├── okr/
│       │   ├── types.ts
│       │   ├── progress.ts        # Fortschritt + Ampel-Logik
│       │   ├── status.ts
│       │   └── format.ts
│       └── utils.ts
├── .env.example
└── .env.local                     # CONSOLIDATE_API_URL + CONSOLIDATE_API_KEY
```

## Sicherheitsprinzipien

1. **Keine eigene DB** – Persistenz nur über Consolidate GraphQL.
2. **Service-User** (`CONSOLIDATE_API_KEY`) nur server-seitig (Seed, Health, Bootstrap).
3. **Endnutzer** authentifizieren sich mit ihrem persönlichen API-Key; dieser wird in einer httpOnly-Cookie-Session gehalten und für Mandanten-/Rechtekontext genutzt.
4. Client Components erhalten **niemals** den Roh-Key.
