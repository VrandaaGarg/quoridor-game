# Redis in Quoridor

## What is Redis?

Redis (Remote Dictionary Server) is an **in-memory data store** used as a database, cache, and message broker. It stores data in RAM for extremely fast read/write operations (sub-millisecond latency).

### Key Characteristics
- **In-Memory**: Data lives in RAM (fast) with optional disk persistence
- **Key-Value Store**: Simple data model - keys map to values
- **Data Structures**: Supports strings, hashes, lists, sets, sorted sets
- **Atomic Operations**: Single commands are atomic (thread-safe)
- **TTL Support**: Keys can auto-expire after a set time

## Upstash Redis

We use **Upstash Redis** - a serverless Redis service with a **REST API**.

### Why Upstash?
| Feature | Traditional Redis | Upstash Redis |
|---------|------------------|---------------|
| Connection | TCP persistent connection | HTTP REST API |
| Serverless | Requires server management | Fully managed |
| Scaling | Manual | Automatic |
| Pricing | Per-server | Pay-per-request |
| Edge Compatible | No | Yes |

### Limitations
Upstash REST API does **NOT** support:
- Real-time Pub/Sub subscriptions (HTTP is request/response)
- Persistent connections
- Blocking commands (BLPOP, BRPOP)

This is why we use **SSE polling** instead of Redis Pub/Sub for real-time updates.

## How We Use Redis

### Data Model

```
room:{roomId}     # Hash - Room metadata
├── status        # "waiting" | "playing" | "finished"
├── p1Id          # Player 1 UUID
├── p1Name        # Player 1 display name
├── p2Id          # Player 2 UUID
└── p2Name        # Player 2 display name

game:{roomId}     # Hash - Game state
├── turn          # "player1" | "player2"
├── winner        # "" | "player1" | "player2"
├── p1Row         # Player 1 row position (0-8)
├── p1Col         # Player 1 column position (0-8)
├── p1Walls       # Player 1 remaining walls (0-10)
├── p2Row         # Player 2 row position
├── p2Col         # Player 2 column position
├── p2Walls       # Player 2 remaining walls
└── walls         # JSON array of wall objects
```

### Redis Operations Used

```typescript
// Read entire hash
redis.hgetall("game:ABC123")

// Write multiple hash fields
redis.hset("game:ABC123", {
  turn: "player2",
  p1Row: 3,
  walls: '[{"row":2,"col":4,"dir":"h"}]'
})

// Set TTL (30 minutes)
redis.expire("game:ABC123", 1800)
```

### Code Example

```typescript
// src/lib/redis.ts
import { Redis } from "@upstash/redis";

export const getRedis = () => {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
};
```

## Real-Time Communication Options

### 1. WebSockets

```
Client <------ Persistent TCP Connection ------> Server
       <-------- Bi-directional Messages ------->
```

**How it works:**
- Single HTTP request upgrades to WebSocket protocol
- Full-duplex: both sides can send anytime
- Connection stays open until explicitly closed

**Pros:**
- Lowest latency (~10-50ms)
- True real-time, bi-directional
- Efficient for frequent updates

**Cons:**
- Requires WebSocket server support
- Not supported by Next.js API routes natively
- Connection management complexity
- Harder to scale (sticky sessions)

**When to use:** Chat apps, live gaming, collaborative editing

### 2. Socket.IO

```
Client <------ Socket.IO Protocol ------> Server
       <-- WebSocket with fallbacks -->
```

**How it works:**
- Library built on top of WebSockets
- Automatic fallback to HTTP long-polling
- Built-in reconnection, rooms, namespaces

**Pros:**
- Easier API than raw WebSockets
- Automatic reconnection
- Room-based broadcasting
- Fallback mechanisms

**Cons:**
- Additional library dependency
- Requires custom server (not serverless-friendly)
- Overhead from abstraction layer

**When to use:** When you need WebSocket features with fallbacks

### 3. Server-Sent Events (SSE)

```
Client -------- HTTP Request --------> Server
       <--- Streaming Response --------
       <--- Event 1 ---
       <--- Event 2 ---
       <--- Event 3 ---
```

**How it works:**
- Client opens HTTP connection with `EventSource`
- Server keeps connection open, sends events as text
- One-way: server to client only
- Client uses separate HTTP requests to send data

**Pros:**
- Works with standard HTTP (serverless compatible)
- Native browser API (`EventSource`)
- Auto-reconnection built-in
- Simple to implement

**Cons:**
- One-way only (server → client)
- Limited concurrent connections per domain (~6)
- Text-only (no binary data)

**When to use:** Live feeds, notifications, dashboards

### 4. Polling

```
Client -----> Request -----> Server
       <----- Response <-----
       ... wait interval ...
Client -----> Request -----> Server
       <----- Response <-----
```

**How it works:**
- Client repeatedly requests data at fixed intervals
- Server responds with current state
- Simple request/response cycle

**Pros:**
- Works everywhere (any HTTP server)
- Simplest to implement
- No special server requirements
- Stateless and scalable

**Cons:**
- Higher latency (interval dependent)
- Wasted requests when no changes
- More server load
- Not true real-time

**When to use:** When other options aren't available, low-frequency updates

### 5. Long Polling

```
Client -----> Request ----------------> Server
              (server holds request)
       <----- Response when data ready <-----
Client -----> New Request -------------> Server
```

**How it works:**
- Client sends request, server holds it open
- Server responds only when new data available
- Client immediately sends new request after response

**Pros:**
- Lower latency than regular polling
- Reduces unnecessary requests
- Works with any HTTP server

**Cons:**
- More complex than regular polling
- Server resource usage (open connections)
- Timeout handling needed

**When to use:** When SSE/WebSockets unavailable, need better than polling

## Our Solution: SSE + HTTP

We use a **hybrid approach**:

```
┌─────────────────────────────────────────────────────────┐
│                      Client                              │
├─────────────────────────────────────────────────────────┤
│  EventSource (SSE)              fetch (HTTP PUT)        │
│  - Receives game updates        - Sends moves/walls     │
│  - Auto-reconnects              - Fire and forget       │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js Server                         │
├─────────────────────────────────────────────────────────┤
│  /api/room/stream (SSE)         /api/room (REST)        │
│  - Polls Redis every 400ms      - Handles PUT requests  │
│  - Sends updates on change      - Updates Redis         │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Upstash Redis                          │
│  - Stores game state                                     │
│  - Source of truth                                       │
└─────────────────────────────────────────────────────────┘
```

### Why This Approach?

1. **Next.js Compatibility**: SSE works with API routes, WebSockets don't
2. **Serverless Friendly**: No persistent connections to manage
3. **Upstash Compatible**: REST API works with polling pattern
4. **Simple Implementation**: Standard browser APIs, no extra libraries
5. **Acceptable Latency**: ~400ms is fine for turn-based games

### Trade-offs

| Aspect | Our Solution | WebSocket Solution |
|--------|--------------|-------------------|
| Latency | ~400ms | ~10-50ms |
| Complexity | Low | High |
| Serverless | Yes | Difficult |
| Scalability | Easy | Needs sticky sessions |
| Cost | Per-request | Per-connection-time |

For a **turn-based game** like Quoridor, 400ms latency is perfectly acceptable. Real-time games (FPS, racing) would need WebSockets.

## Comparison Summary

| Method | Latency | Direction | Serverless | Complexity |
|--------|---------|-----------|------------|------------|
| WebSocket | ~10-50ms | Bi-directional | Hard | High |
| Socket.IO | ~10-50ms | Bi-directional | Hard | Medium |
| SSE | ~100ms+ | Server → Client | Easy | Low |
| Long Polling | ~100ms+ | Client → Server | Easy | Medium |
| Polling | Interval-based | Client → Server | Easy | Low |

## Further Reading

- [Upstash Redis Docs](https://upstash.com/docs/redis/overall/getstarted)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
