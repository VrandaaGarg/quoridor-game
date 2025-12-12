# Quoridor Online 

![Quoridor Banner](https://res.cloudinary.com/dyetf2h9n/image/upload/v1765577464/Quoridor_gctz2q.png)

A beautiful, animated implementation of the classic strategy board game **Quoridor**, built with Next.js, Framer Motion, and Redis. Play locally on a single device or invite a friend for a real-time online match.

🔗 **Live Demo:** [quoridor.vrandagarg.in](https://quoridor.vrandagarg.in)  
👤 **Creator:** [Vranda Garg](https://vrandagarg.in/)

## 💡 Motivation & Learning Journey

The main goal of this project wasn't just to build a game that already exists, but to deeply understand **how real-time systems work under the hood**, specifically without requiring user sign-ups or complex authentication.

I wanted to explore how to synchronize game state instantly between two players. Through this journey, I researched various real-time communication patterns:
*   **Short Polling:** Repeatedly asking the server for updates.
*   **Long Polling:** Holding a request open until data is available.
*   **WebSockets / Socket.io:** Full duplex communication channels.
*   **Server-Sent Events (SSE):** A unidirectional stream from server to client.

**Implementation Details:**
For this project, I implemented a **Serverless-friendly approach using HTTP + SSE (Server-Sent Events)**.
*   **Redis** acts as the single source of truth for game state.
*   **SSE** pushes updates instantly to clients without them needing to refresh or poll.
*   The system is completely stateless and frictionless—users can jump in via a link and play immediately.

## 🎮 Game Features

- **Local Pass & Play:** Two-player mode on a single device.
- **Online Multiplayer:** Real-time matches with friends via shareable room codes.
- **Animated UI:** Smooth ghost animations, wobble text effects, and 3D wooden board design.
- **Rule Validation:** Fully validated moves and wall placements (walls cannot block all paths).
- **Responsive Design:** Optimized for both desktop and mobile play.
- **Confetti Celebration:** Fun victory effects when a player wins.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** Tailwind CSS, Framer Motion (animations)
- **State Management:** Zustand
- **Real-time Backend:** Redis (Upstash) + Server-Sent Events (SSE)
- **Icons:** React Icons
- **Fonts:** Geist Sans, Fredoka, Rubik Bubbles

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VrandaaGarg/quoridor-game.git
   cd quoridor-game
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file and add your Redis credentials (required for online mode):
   ```env
   UPSTASH_REDIS_REST_URL=your_url_here
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

5. **Open:** [http://localhost:3000](http://localhost:3000)

## 🎲 How to Play

The goal is to be the first pawn to reach any cell on the opposite side of the board.

1. **Move:** On your turn, move your pawn one square horizontally or vertically.
2. **Place a Wall:** Instead of moving, you can place a wall to block your opponent or create a path for yourself.
   - You have 10 walls.
   - Walls span two squares.
   - **Rule:** You cannot completely block off a player from reaching their goal. There must always be at least one path to victory.

## 📄 License

This project is open-source and available under the MIT License.
