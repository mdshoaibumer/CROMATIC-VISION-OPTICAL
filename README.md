# Cromatic Vision

Monorepo for the Cromatic Vision eyewear brand.

## Structure

```
apps/
├── web/        → Marketing website (Next.js 16, Tailwind CSS v4, Framer Motion)
└── platform/   → E-commerce platform (Go backend, Vite + React frontend, PostgreSQL)
```

## Getting Started

### Marketing Website (`apps/web`)

```bash
cd apps/web
npm install
npm run dev
```

### E-commerce Platform (`apps/platform`)

```bash
cd apps/platform
npm install          # Frontend dependencies
go mod download      # Backend dependencies
make dev             # Start dev server
```
