# Quoridor Architecture

## System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│  ┌─────────────────┐                      ┌─────────────────┐          │
│  │   Player 1      │                      │   Player 2      │          │
│  │   Browser       │                      │   Browser       │          │
│  │                 │                      │                 │          │
│  │  ┌───────────┐  │                      │  ┌───────────┐  │          │
│  │  │  Zustand  │  │                      │  │  Zustand  │  │          │
│  │  │   Store   │  │                      │  │   Store   │  │          │
│  │  └───────────┘  │                      │  └───────────┘  │          │
│  └────────┬────────┘                      └────────┬────────┘          │
│           │                                        │                    │
│     SSE   │  HTTP PUT                        SSE   │  HTTP PUT          │
│   (recv)  │  (send)                        (recv)  │  (send)            │
└───────────┼────┼───────────────────────────────────┼────┼───────────────┘
            │    │                                   │    │
            ▼    ▼                                   ▼    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS SERVER                                  │
│                                                                         │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐   │
│  │   /api/room/stream          │    │      /api/room              │   │
│  │   (SSE Endpoint)            │    │      (REST API)             │   │
│  │                             │    │                             │   │
│  │  - Polls Redis every 400ms  │    │  POST - Create/Join room    │   │
│  │  - Compares state changes   │    │  GET  - Fetch game state    │   │
│  │  - Streams updates to client│    │  PUT  - Apply move/wall     │   │
│  └──────────────┬──────────────┘    └──────────────┬──────────────┘   │
│                 │                                   │                   │
│                 │         ┌─────────────────┐       │                   │
│                 │         │  server-game.ts │       │                   │
│                 └────────►│                 │◄──────┘                   │
│                           │ - fetchGameState│                           │
│                           │ - persistGameState                          │
│                           │ - applyGameEvent│                           │
│                           └────────┬────────┘                           │
│                                    │                                    │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         UPSTASH REDIS                                   │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐               │
│  │   room:{roomId}     │         │   game:{roomId}     │               │
│  │                     │         │                     │               │
│  │   status: "playing" │         │   turn: "player1"   │               │
│  │   p1Id: "uuid-1"    │         │   winner: ""        │               │
│  │   p1Name: "Alice"   │         │   p1Row: 0          │               │
│  │   p2Id: "uuid-2"    │         │   p1Col: 4          │               │
│  │   p2Name: "Bob"     │         │   p1Walls: 10       │               │
│  │                     │         │   p2Row: 8          │               │
│  │   TTL: 30 minutes   │         │   p2Col: 4          │               │
│  │                     │         │   p2Walls: 10       │               │
│  └─────────────────────┘         │   walls: "[...]"    │               │
│                                  │                     │               │
│                                  │   TTL: 30 minutes   │               │
│                                  └─────────────────────┘               │
└────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Creating a Room

```
Player 1                    Server                      Redis
   │                          │                           │
   │  POST /api/room          │                           │
   │  { name: "Alice" }       │                           │
   │ ─────────────────────────►                           │
   │                          │                           │
   │                          │  HSET room:ABC123         │
   │                          │  { status, p1Id, p1Name } │
   │                          │ ─────────────────────────►│
   │                          │                           │
   │                          │  HSET game:ABC123         │
   │                          │  { turn, positions... }   │
   │                          │ ─────────────────────────►│
   │                          │                           │
   │  { roomId, playerId }    │                           │
   │ ◄─────────────────────────                           │
   │                          │                           │
```

### 2. Joining a Room

```
Player 2                    Server                      Redis
   │                          │                           │
   │  POST /api/room?action=join                          │
   │  { roomId, name }        │                           │
   │ ─────────────────────────►                           │
   │                          │                           │
   │                          │  HGETALL room:ABC123      │
   │                          │ ─────────────────────────►│
   │                          │ ◄─────────────────────────│
   │                          │                           │
   │                          │  HSET room:ABC123         │
   │                          │  { p2Id, p2Name, status } │
   │                          │ ─────────────────────────►│
   │                          │                           │
   │  { roomId, playerId, game }                          │
   │ ◄─────────────────────────                           │
   │                          │                           │
```

### 3. Real-Time Updates (SSE)

```
Player 1                    Server                      Redis
   │                          │                           │
   │  GET /api/room/stream    │                           │
   │  ?roomId=ABC123          │                           │
   │ ─────────────────────────►                           │
   │                          │                           │
   │  ◄─── SSE Connection ────│                           │
   │                          │                           │
   │                          │     Poll Loop (400ms)     │
   │                          │  ┌──────────────────────┐ │
   │                          │  │                      │ │
   │                          │  │  HGETALL game:ABC123 │ │
   │                          │  │ ────────────────────►│ │
   │                          │  │ ◄────────────────────│ │
   │                          │  │                      │ │
   │                          │  │  Compare with last   │ │
   │                          │  │  If changed:         │ │
   │  data: {"type":"state",  │  │    Send SSE event    │ │
   │         "game":{...}}    │  │                      │ │
   │ ◄─────────────────────────  │                      │ │
   │                          │  │  Wait 400ms          │ │
   │                          │  │  Repeat...           │ │
   │                          │  └──────────────────────┘ │
   │                          │                           │
```

### 4. Making a Move

```
Player 1                    Server                      Redis
   │                          │                           │
   │  User clicks cell        │                           │
   │  ┌────────────────────┐  │                           │
   │  │ 1. Update Zustand  │  │                           │
   │  │    (optimistic)    │  │                           │
   │  │ 2. Send to server  │  │                           │
   │  └────────────────────┘  │                           │
   │                          │                           │
   │  PUT /api/room?id=ABC123 │                           │
   │  { type:"move",          │                           │
   │    player:"player1",     │                           │
   │    to:{row:1,col:4} }    │                           │
   │ ─────────────────────────►                           │
   │                          │                           │
   │                          │  HGETALL game:ABC123      │
   │                          │ ─────────────────────────►│
   │                          │ ◄─────────────────────────│
   │                          │                           │
   │                          │  Validate move            │
   │                          │  Apply to state           │
   │                          │                           │
   │                          │  HSET game:ABC123         │
   │                          │  { turn, p1Row, p1Col }   │
   │                          │ ─────────────────────────►│
   │                          │                           │
   │  { game: {...} }         │                           │
   │ ◄─────────────────────────                           │
   │                          │                           │
   │                          │                           │
   │     Meanwhile, Player 2's SSE detects change...      │
   │                          │                           │
```

### 5. Player 2 Receives Update

```
Player 2                    Server                      Redis
   │                          │                           │
   │  (SSE connection open)   │                           │
   │                          │                           │
   │                          │  Poll: HGETALL game:...   │
   │                          │ ─────────────────────────►│
   │                          │ ◄─────────────────────────│
   │                          │                           │
   │                          │  State changed!           │
   │                          │  (p1Row: 0→1)             │
   │                          │                           │
   │  data: {"type":"state",  │                           │
   │         "game":{         │                           │
   │           turn:"player2",│                           │
   │           ...}}          │                           │
   │ ◄─────────────────────────                           │
   │                          │                           │
   │  ┌────────────────────┐  │                           │
   │  │ Update Zustand     │  │                           │
   │  │ Re-render Board    │  │                           │
   │  └────────────────────┘  │                           │
   │                          │                           │
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           App Layout                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      RoomPage                                  │  │
│  │  /online/[roomId]                                              │  │
│  │                                                                │  │
│  │  - Manages SSE connection                                      │  │
│  │  - Sets online context in Zustand                              │  │
│  │  - Determines which player user is                             │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                      GameUI                              │  │  │
│  │  │  - Shows turn indicator                                  │  │  │
│  │  │  - Shows winner message                                  │  │  │
│  │  │  - Reset button                                          │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                      Board                               │  │  │
│  │  │                                                          │  │  │
│  │  │  ┌──────────┐  ┌────────────────────┐  ┌──────────┐     │  │  │
│  │  │  │ Player   │  │                    │  │ Player   │     │  │  │
│  │  │  │ Panel 1  │  │    9x9 Grid        │  │ Panel 2  │     │  │  │
│  │  │  │          │  │                    │  │          │     │  │  │
│  │  │  │ - Name   │  │  - Cells           │  │ - Name   │     │  │  │
│  │  │  │ - Walls  │  │  - Pawns (motion)  │  │ - Walls  │     │  │  │
│  │  │  │ - Drag   │  │  - Walls           │  │ - Drag   │     │  │  │
│  │  │  │   walls  │  │  - Wall preview    │  │   walls  │     │  │  │
│  │  │  │          │  │  - Move highlights │  │          │     │  │  │
│  │  │  └──────────┘  └────────────────────┘  └──────────┘     │  │  │
│  │  │                                                          │  │  │
│  │  │  Event Handlers:                                         │  │  │
│  │  │  - handleCellClick → movePawn() + sendSocket()           │  │  │
│  │  │  - handleDragStateChange → placeWall() + sendSocket()    │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## State Management

### Zustand Store Structure

```typescript
interface GameStore {
  // Mode & Identity
  mode: "local" | "online" | null;
  roomId: string | null;
  myId: string | null;           // Current user's player ID

  // Game State
  game: GameState | null;
  validMoves: Position[];        // Computed for current turn
  wallPreview: Wall | null;      // Wall being dragged

  // Actions
  initLocal(p1Name, p2Name);     // Start local game
  setOnlineContext(roomId, myId); // Set online identity
  setGame(game);                  // Update from server
  movePawn(to);                   // Local + triggers sendSocket
  placeWall(wall);                // Local + triggers sendSocket
  isMyTurn();                     // Check if current user can act
}
```

### State Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZUSTAND STORE                             │
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐    ┌───────────────┐ │
│  │                │    │                │    │               │ │
│  │  User Action   │───►│  Local Update  │───►│  Send to      │ │
│  │  (click/drag)  │    │  (optimistic)  │    │  Server       │ │
│  │                │    │                │    │               │ │
│  └────────────────┘    └────────────────┘    └───────┬───────┘ │
│                                                       │         │
│                                                       ▼         │
│                                              ┌───────────────┐ │
│                                              │  HTTP PUT     │ │
│                                              │  /api/room    │ │
│                                              └───────┬───────┘ │
│                                                       │         │
│  ┌────────────────┐    ┌────────────────┐            │         │
│  │                │    │                │            │         │
│  │  UI Re-render  │◄───│  setGame()     │◄───────────┼─────────│
│  │                │    │                │    SSE     │         │
│  │                │    │                │  Update    │         │
│  └────────────────┘    └────────────────┘            │         │
│                                                       │         │
└───────────────────────────────────────────────────────┼─────────┘
                                                        │
                                               Server updates
                                               Redis, SSE polls
                                               and broadcasts
```

## File Responsibilities

### API Layer

| File | Responsibility |
|------|----------------|
| `/api/room/route.ts` | REST endpoints for room CRUD and game actions |
| `/api/room/stream/route.ts` | SSE endpoint for real-time updates |

### Library Layer

| File | Responsibility |
|------|----------------|
| `lib/redis.ts` | Upstash Redis client singleton |
| `lib/server-game.ts` | Server-side state operations (fetch, persist, apply) |
| `lib/game.ts` | Pure game logic (validation, moves, walls, pathfinding) |
| `lib/socket.ts` | Client-side SSE connection + HTTP send helper |

### Client Layer

| File | Responsibility |
|------|----------------|
| `store.ts` | Zustand global state and actions |
| `components/Board.tsx` | Game board rendering and interaction |
| `components/GameUI.tsx` | Turn indicator and game status |
| `components/Lobby.tsx` | Room creation and joining UI |

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SSE Connection Lost                                          │
│     └─► Auto-reconnect after 2 seconds                          │
│                                                                  │
│  2. HTTP Request Failed                                          │
│     └─► Error logged to console                                 │
│     └─► Local state may be ahead of server (self-corrects on    │
│         next SSE update)                                         │
│                                                                  │
│  3. Invalid Move/Wall                                            │
│     └─► Server rejects, returns unchanged state                 │
│     └─► SSE update corrects client state                        │
│                                                                  │
│  4. Room Not Found                                               │
│     └─► 404 response shown to user                              │
│                                                                  │
│  5. Redis Unavailable                                            │
│     └─► 503 response with helpful message                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Architecture

- **Stateless server**: Each request is independent
- **Shared state in Redis**: Single source of truth
- **Polling-based updates**: No sticky sessions needed

### Scaling Options

1. **Horizontal scaling**: Add more Next.js instances (works out of the box)
2. **Reduce poll interval**: Trade latency for lower Redis costs
3. **Edge deployment**: Deploy closer to users with Vercel Edge
4. **Redis cluster**: Upstash handles this automatically

### Limitations

1. **Poll interval**: ~400ms minimum latency
2. **Redis requests**: 2-3 requests per poll per connection
3. **SSE connections**: Browser limits (~6 per domain)

For higher scale/lower latency, consider:
- Cloudflare Durable Objects
- Dedicated WebSocket server (Railway, Fly.io)
- Managed real-time services (Pusher, Ably, Liveblocks)
