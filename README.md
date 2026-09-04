# TrackIt

A simple, private, offline-first habit tracker built with React Native and Expo.

No accounts. No cloud. No paywall. Your data never leaves your device.

## Features

- **Offline-first** — all data is stored locally on-device, no login or internet connection required
- **Task management** — create, edit, delete, and reorder habits with a custom score (5–30 pts), color, and icon
- **Daily logs** — immutable per-day completion history, mark tasks complete or failed with undo support
- **Reminders** — per-task local notifications with configurable time and repeat days
- **Analytics** — weekly and monthly charts, streaks, completion rate, and a per-task breakdown
- **Task locking** — optionally lock a task to make it harder for future-you to edit or delete it
- **Dark mode**
- Free and open source, with every feature available to everyone

## Tech stack

- [Expo](https://expo.dev) (SDK 54) with Expo Router (file-based routing)
- React Native + TypeScript
- AsyncStorage for local, offline persistence
- expo-notifications for local reminders
- React Context + useReducer for state management

## Getting started

Requires [Node.js](https://nodejs.org) 20+ and npm.

```bash
npm install
npm run dev
```

This starts the Expo dev server. Scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone, or press `i` / `a` / `w` in the terminal to open an iOS simulator, Android emulator, or web browser.

Other scripts:

```bash
npm run ios       # open in iOS simulator
npm run android   # open in Android emulator
npm run web       # open in a web browser
npm run typecheck # run the TypeScript compiler
```

## Project structure

```
app/
├── _layout.tsx          # Root layout with all providers
├── privacy.tsx           # Privacy policy screen
└── (tabs)/
    ├── _layout.tsx       # Tab navigation
    ├── index.tsx         # Today screen
    ├── analytics.tsx     # Analytics screen
    ├── history.tsx       # History log screen
    └── settings.tsx      # Settings screen
components/                # Reusable UI components
context/
├── HabitContext.tsx      # Central app state (tasks, logs, streak)
└── ThemeContext.tsx      # Light/dark theme
lib/
├── storage.ts            # AsyncStorage persistence helpers
├── dateUtils.ts           # Date formatting and generation
├── analytics.ts           # Analytics computation
├── notifications.ts       # Notification scheduling
└── streakUtils.ts         # Streak calculation
types/habit.ts              # TypeScript types for all entities
constants/colors.ts          # Design tokens (light/dark)
```

## Contributing

Contributions are welcome! Feel free to open an issue or pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE).
