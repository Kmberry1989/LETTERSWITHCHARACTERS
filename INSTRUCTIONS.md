# Letters with Characters - Project Instructions & Analysis

## 1. Project Overview
**Letters with Characters** is a turn-based word game (similar to Scrabble) built using **Next.js 15**, **TypeScript**, and **Firebase**. It features real-time gameplay, user authentication, and AI-powered word suggestions using **Genkit**.

### Key Technologies
-   **Frontend**: Next.js (App Router), React, Tailwind CSS, Radix UI (shadcn/ui).
-   **Backend / Database**: Firebase (Authentication, Firestore).
-   **AI Integration**: Genkit (Google GenAI) for word hints and validation.
-   **State Management**: React Hooks + Firebase real-time listeners.
-   **Deployment**: Configured for Firebase App Hosting.

---

## 2. File Structure
The project follows a standard Next.js App Router structure with feature-based organization.

```
/
├── src/
│   ├── ai/                 # AI integration (Genkit)
│   │   ├── ai-suggest-word.ts  # Logic for AI word suggestions
│   │   └── validate-word.ts    # Logic for word validation
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # Backend API routes (game logic, hints)
│   │   ├── dashboard/      # User dashboard (active games)
│   │   ├── game/           # Main game interface (board, rack, chat)
│   │   ├── lobby/          # Game lobby (matchmaking)
│   │   ├── page.tsx        # Landing / Login page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── game/           # Game-specific components (Board, Tile, Rack)
│   │   ├── ui/             # Reusable UI components (Buttons, Cards, Dialogs)
│   │   └── ...             # Layout components (Nav, Header)
│   ├── firebase/           # Firebase configuration & hooks
│   │   ├── auth/           # Authentication logic
│   │   ├── firestore/      # Firestore hooks and utilities
│   │   └── config.ts       # Firebase initialization
│   ├── lib/                # Utility functions
│   │   ├── game-logic.ts   # Core game rules (Tile bag, scoring)
│   │   └── utils.ts        # Helper functions
│   └── hooks/              # Custom React hooks (e.g., use-toast)
├── public/                 # Static assets
├── firebase.json           # Firebase configuration
├── firestore.rules         # Database security rules
└── package.json            # Dependencies and scripts
```

---

## 3. Development Workflow

### Prerequisites
-   Node.js (v20+ recommended)
-   Firebase CLI installed and logged in
-   A Firebase project with Firestore and Auth enabled

### Getting Started
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    -   Ensure `.env` or `.env.local` is configured with Firebase credentials.
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    -   Access the app at `http://localhost:3000` (or the port specified in the terminal).
4.  **Run Genkit (AI)**:
    ```bash
    npm run genkit:dev
    ```

---

## 4. Future Development Opportunities

The project has a solid foundation but several areas are ripe for expansion:

### A. Gameplay Enhancements
-   **Advanced Bot Logic**: Currently, "Bitty Botty" exists. Implementing a more challenging AI opponent with difficulty levels would improve single-player retention.
-   **Special Tiles**: Introduce bonus tiles (Double Word Score, Triple Letter Score) visually on the board and in the scoring logic.
-   **Timed Mode**: Add a blitz mode with turn timers to increase excitement.

### B. Social Features
-   **Friends System**: Allow users to add friends and challenge them directly.
-   **Enhanced Chat**: Add emoji support, reactions, and persistent chat history in the lobby.
-   **Profile Customization**: Expand the `shop` and `profile` sections to allow users to buy/unlock avatars, tile skins, or board themes.

### C. Infrastructure
-   **Presence System**: Show when users are online/offline in the lobby using Firebase Realtime Database (better for presence than Firestore).
-   **Notifications**: Implement push notifications for "Your Turn" alerts.

---

## 5. Suggestions for Improvement

### Code Quality & Architecture
-   **State Management**: The `Game` component (`src/app/game/page.tsx`) is becoming large. Consider extracting complex game state logic (tile movement, validation) into a custom hook (e.g., `useGameState`) or a reducer.
-   **Type Safety**: Ensure strict typing for all Firestore data models to prevent runtime errors.
-   **Error Handling**: The `errorEmitter` pattern is interesting. Ensure it's consistently used across all async operations to provide user-friendly feedback.

### User Experience (UX)
-   **Optimistic UI**: When placing a tile or playing a word, update the UI immediately before waiting for the server response to make the game feel snappier.
-   **Mobile Responsiveness**: Verify that the drag-and-drop mechanics for tiles work seamlessly on touch devices. Consider a "tap-to-select, tap-to-place" alternative for mobile.
-   **Accessibility**: Ensure all game elements (tiles, board cells) are keyboard navigable and screen reader friendly.

### Security
-   **Server-Side Validation**: Ensure all moves sent to `/api/games/...` are strictly validated on the server to prevent cheating (e.g., verifying the user actually has the tiles they are trying to play).
