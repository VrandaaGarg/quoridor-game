/**
 * api/room/route.ts - REST API for room management
 * 
 * POST: Create new room or join existing (action=join)
 * GET: Fetch current game state by room ID
 * PUT: HTTP fallback for move/wall actions
 * Uses: Redis for persistence, 30-min TTL on rooms
 */

import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import {
  applyGameEvent,
  fetchGameState,
  initialGameState,
  newRoomCode,
  persistGameState,
  persistRoomMeta,
} from "@/lib/server-game";
import { GameEvent } from "@/types";

export const runtime = "nodejs";

const parseBody = async <T>(req: NextRequest) => {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
};

export async function POST(req: NextRequest) {
  let redis;
  try {
    redis = getRedis();
  } catch {
    return NextResponse.json(
      { error: "Online mode unavailable. Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "join") {
    const body = await parseBody<{ roomId: string; name: string }>(req);
    if (!body?.roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const room = await redis.hgetall<Record<string, string>>(
      `room:${body.roomId}`,
    );
    if (!room || !room.status) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (room.p2Id) {
      return NextResponse.json({ error: "Room already full" }, { status: 400 });
    }

    const playerId = crypto.randomUUID();
    await persistRoomMeta(body.roomId, {
      ...room,
      status: "playing",
      p2Id: playerId,
      p2Name: body.name ?? "Guest",
    });

    const currentGame = await fetchGameState(body.roomId);
    const nextGame =
      currentGame ??
      initialGameState(
        room.p1Id ?? "",
        room.p1Name ?? "",
        playerId,
        body.name,
        "playing",
      );
    await persistGameState(body.roomId, nextGame);
    // SSE clients will pick up the new state via polling

    return NextResponse.json({ playerId, roomId: body.roomId, game: nextGame });
  }

  // Create new room
  const body = await parseBody<{ name: string }>(req);
  const roomId = newRoomCode();
  const playerId = crypto.randomUUID();
  const p1Name = body?.name ?? "Host";
  const p2Id = crypto.randomUUID(); // placeholder until join
  const game = initialGameState(playerId, p1Name, p2Id, "Guest", "waiting");

  await persistRoomMeta(roomId, {
    status: "waiting",
    p1Id: playerId,
    p1Name,
    p2Id: "",
    p2Name: "",
  });
  await persistGameState(roomId, game);

  return NextResponse.json({ roomId, playerId, game });
}

export async function GET(req: NextRequest) {
  try {
    getRedis(); // Validate Redis is configured
  } catch {
    return NextResponse.json(
      { error: "Online mode unavailable. Redis not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("id");
  if (!roomId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const game = await fetchGameState(roomId);
  if (!game) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ game });
}

export async function PUT(req: NextRequest) {
  try {
    getRedis(); // Validate Redis is configured
  } catch {
    return NextResponse.json(
      { error: "Online mode unavailable. Redis not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("id");
  if (!roomId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const body = await parseBody<GameEvent>(req);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  if (body.type !== "move" && body.type !== "wall") {
    return NextResponse.json({ error: "Unsupported" }, { status: 400 });
  }
  const next = await applyGameEvent(roomId, body);
  if (!next) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ game: next });
}

