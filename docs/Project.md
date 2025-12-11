# Quoridor - Project Overview

## What is Quoridor?

Quoridor is a strategic board game where two players race to reach the opposite side of a 9x9 grid while placing walls to block their opponent's path. Each player has 10 walls and must ensure a valid path always exists for both players.

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router for server/client components |
| **React 19** | UI component library |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Framer Motion** | Animation library for smooth pawn/wall animations |
| **Zustand** | Lightweight state management |

### Backend

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | REST API endpoints (`/api/room`) |
| **Server-Sent Events (SSE)** | Real-time server-to-client updates (`/api/room/stream`) |
| **Upstash Redis** | Serverless Redis for game state persistence |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Upstash Redis** | Managed serverless Redis (REST API based) |
| **Vercel** (optional) | Deployment platform optimized for Next.js |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── room/
│   │       ├── route.ts    # REST API (POST/GET/PUT)
│   │       └── stream/
│   │           └── route.ts # SSE endpoint for real-time updates
│   ├── local/
│   │   └── page.tsx        # Local 2-player mode
│   ├── online/
│   │   ├── page.tsx        # Online lobby (create/join room)
│   │   └── [roomId]/
│   │       └── page.tsx    # Online game room
│   └── page.tsx            # Home page
├── components/
│   ├── Board.tsx           # Game board with drag-and-drop walls
│   ├── GameUI.tsx          # Turn indicator, winner display
│   └── Lobby.tsx           # Room creation/joining UI
├── lib/
│   ├── game.ts             # Core game logic (validation, moves, walls)
│   ├── redis.ts            # Upstash Redis client singleton
│   ├── server-game.ts      # Server-side state management
│   └── socket.ts           # Client-side SSE + HTTP helper
├── store.ts                # Zustand global state
└── types.ts                # TypeScript type definitions
```

## Game Modes

### Local Mode (`/local`)
- Two players share the same device
- No server communication needed
- State managed entirely in Zustand

### Online Mode (`/online`)
- Create or join rooms with 6-character codes
- Real-time synchronization via SSE polling
- State persisted in Redis with 30-minute TTL

## Key Features

1. **Drag-and-Drop Walls** - Intuitive wall placement with preview validation
2. **Move Highlighting** - Valid moves shown with visual indicators
3. **Jump Mechanics** - Proper Quoridor jump rules when pawns are adjacent
4. **Path Validation** - BFS algorithm ensures walls don't block all paths
5. **Real-time Sync** - ~400ms latency for online multiplayer updates
6. **Auto-reconnect** - SSE connection auto-recovers on disconnect

## Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Dependencies

### Production
- `next` - React framework
- `react` / `react-dom` - UI library
- `zustand` - State management
- `framer-motion` - Animations
- `@upstash/redis` - Redis client

### Development
- `typescript` - Type checking
- `tailwindcss` - Styling
- `eslint` - Code linting
