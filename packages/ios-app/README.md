# Cheerio iOS App

A native iOS application built with Swift and SwiftUI that connects to the Cheerio backend.

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
2. Configure API credentials in `Config.swift`
3. Build and run in Xcode

## Project Structure

```
ios-app/CheerioApp/
├── Config.swift                    # API and Supabase configuration
├── AppState.swift                  # Global app state management
├── Models/                         # Data models (Room, Message, Activity)
├── Services/                       # Business logic (Auth, Location, Chat, Audio)
├── Views/                          # SwiftUI views
│   ├── Auth/                       # Login and registration
│   ├── Rooms/                      # Room list and detail views
│   └── Components/                 # Reusable UI components
└── CheerioAppApp.swift             # App entry point
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
