# Qwen Code Context for `schoolajws`

## Project Overview

This is a Next.js 14+ (App Router) web application for a School Management System. It's built with TypeScript and Tailwind CSS, utilizing modern React patterns and tools like React Query and Zustand for state management. The application is designed to serve three primary user roles: Teachers, Admins, and Principals, integrating with an existing backend API.

Key documentation files include:
- `README.md`: High-level project summary and getting started guide.
- `PRD.md`: Detailed Product Requirements Document with user roles, features, and requirements.
- `TECH_SPEC.md`: Technical specification covering stack, architecture, and API integration.
- `ROADMAP.md`: 10-week development timeline and phased implementation plan.

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query) for server state, Zustand/Context API for client state
- **UI Components**: shadcn/ui v2 (configured with `components.json`), built on Radix UI primitives
- **Authentication**: JWT Bearer token
- **API Communication**: RESTful API (`https://school-app-backend-d143b785b631.herokuapp.com/`)
- **Icons**: Lucide React
- **Development Tools**: ESLint, Prettier, TypeScript compiler

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/             # Authentication routes (likely contains login, register pages)
│   ├── layout.tsx          # Root layout (includes AuthProvider)
│   └── page.tsx            # Home page
├── components/             # Shared UI components (shadcn/ui components likely here)
├── lib/                    # Utility functions and helpers
│   ├── auth/               # Authentication utilities (context, API service)
│   ├── api/                # General API client and service functions
│   ├── utils/              # General utility functions
│   └── hooks/              # Custom React hooks
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

Key files observed:
- `src/app/layout.tsx`: Root layout wrapping the app with `AuthProvider`.
- `src/lib/auth/context.tsx`: Authentication context provider managing user state, token, login/logout logic, and localStorage persistence.

## UI Components

The project uses shadcn/ui v2 components which are built on top of Radix UI primitives. The components are located in `src/components/ui` and include:
- Button (`button.tsx`)
- Label (`label.tsx`)
- Card (`card.tsx`)
- Input (`input.tsx`)
- Alert (`alert.tsx`)
- Dropdown Menu (`dropdown-menu.tsx`)

These components use the new shadcn/ui v2 syntax with `data-slot` attributes for styling. The Radix UI dependencies in `package.json` are required for these components to work properly.

## Building and Running

- **Development Server**: `npm run dev` (Runs `next dev`)
- **Build**: `npm run build` (Runs `next build`)
- **Production Server**: `npm run start` (Runs `next start`)
- **Linting**: `npm run lint` (Runs `next lint`)

## Development Conventions

- Uses `@/*` path alias mapping to `./src/*` for imports.
- Implements a custom `AuthProvider` for authentication state management.
- Follows shadcn/ui v2 component patterns (using `data-slot` attributes) and Tailwind CSS utility classes.
- TypeScript is used with strict mode enabled (`tsconfig.json`).
- Project setup includes Geist fonts.

This context file was generated on Friday, August 15, 2025.