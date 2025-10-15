# Cheerioo iOS App

A native iOS application built with Swift and SwiftUI that connects to the Cheerioo backend.

## Features

- 🔐 **Authentication**: Sign in and register using Supabase
- 📍 **Background Location Tracking**: Share your journey even when the app is in the background
- 💬 **Real-time Chat**: Text and voice messaging with automatic audio playback
- 📊 **Activity Stats**: View speed, distance, and duration while tracking
- 🎵 **Audio Mixing**: Voice messages play over your music without interrupting

## Requirements

- Xcode 15.0 or later
- iOS 17.0 or later
- macOS for development
- Physical device recommended for location tracking

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

1. Install Supabase Swift SDK via Swift Package Manager
2. Copy `.env.local.example` to `.env.local` at repo root
3. Fill in your Supabase credentials in `.env.local`
4. Run `yarn generate-config` to generate `Config.swift` from your env file
5. Build and run in Xcode

## Configuration

The iOS app reads configuration from a shared `.env.local` file using a build script:

```bash
# Generate Config.swift from .env.local
yarn generate-config
```

The script looks for `.env.local` at:

1. Repo root (`/cheerioo/.env.local`) - **Recommended** ✨
2. Web app (`packages/web-app/.env.local`) - Fallback

This automatically:

- ✅ Reads Supabase credentials from `.env.local`
- ✅ Detects your Mac's local IP for device builds
- ✅ Generates `Config.swift` with simulator/device detection
- ✅ Keeps credentials in sync between web and iOS apps

**Auto-Generate on Build (Optional)**: Set up Xcode to regenerate Config.swift automatically on every build. See [QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md) for 5-minute setup guide.

**Detailed Documentation**:

- 📘 [CONFIG-SETUP.md](./CONFIG-SETUP.md) - Quick overview
- 📗 [ENV-VARIABLES.md](./ENV-VARIABLES.md) - Comprehensive guide
- 📙 [XCODE-BUILD-PHASE.md](./XCODE-BUILD-PHASE.md) - Auto-generation setup
- 📕 [QUICK-SETUP-XCODE.md](./QUICK-SETUP-XCODE.md) - Visual step-by-step guide

**Manual Alternative**: You can also edit `Config.swift` directly, but changes will be overwritten when you run the script again.

## Project Structure

```
ios-app/CheeriooApp/
├── Config.swift                    # API and Supabase configuration
├── AppState.swift                  # Global app state management
├── Models/                         # Data models (Room, Message, Activity)
├── Services/                       # Business logic (Auth, Location, Chat, Audio)
├── Views/                          # SwiftUI views
│   ├── Auth/                       # Login and registration
│   ├── Rooms/                      # Room list and detail views
│   └── Components/                 # Reusable UI components
└── CheeriooAppApp.swift             # App entry point
```

## Architecture

The app follows MVVM architecture:

- **Models**: Data structures matching the web-app API
- **Services**: Handle API calls, location tracking, real-time chat, and audio
- **Views**: SwiftUI views that observe services and display UI
- **AppState**: Global authentication and Supabase client management

## Dependencies

All dependencies are managed through Swift Package Manager:

- **Supabase Swift SDK**: Authentication, real-time, and database client

## Notes

- This is a native Swift/SwiftUI project
- The `package.json` file exists only for monorepo workspace compatibility
- Location tracking requires "Always" permission for background tracking
- Audio mixing allows voice messages to play over music apps
