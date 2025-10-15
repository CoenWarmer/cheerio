# Cheerioo iOS App Setup

## Prerequisites

- macOS with Xcode 15.0 or later
- iOS 17.0+ device or simulator
- Access to the Supabase project used by the web app

## Step 1: Install Dependencies

1. Open `CheeriooApp.xcodeproj` in Xcode
2. Go to **File** → **Add Package Dependencies**
3. Add the following package:
   - **Supabase Swift SDK**: `https://github.com/supabase-community/supabase-swift`
   - Version: Latest (2.0.0+)

Xcode will automatically download and integrate the Supabase SDK.

## Step 2: Configure Supabase Credentials

1. Open `packages/web-app/.env.local` and copy the values for:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Open `CheeriooApp/Config.swift` in Xcode
3. Replace the placeholder values:

   ```swift
   static let supabaseURL = "YOUR_SUPABASE_URL_HERE"
   static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY_HERE"
   ```

4. If testing on a physical device, update the `apiBaseURL`:
   - Find your Mac's local IP address (System Settings → Network)
   - Update `Config.swift`:
     ```swift
     static let apiBaseURL = "http://192.168.X.X:3001" // Replace with your IP
     ```

## Step 3: Configure Project Settings

1. In Xcode, select the **CheeriooApp** target
2. Go to **Signing & Capabilities**:
   - Select your Development Team
   - Ensure a unique Bundle Identifier (e.g., `com.yourname.cheerioo`)
3. Go to **Info** tab:
   - Verify the following keys are present (they should be if Info.plist is properly linked):
     - `NSLocationAlwaysAndWhenInUseUsageDescription`
     - `NSLocationWhenInUseUsageDescription`
     - `NSMicrophoneUsageDescription`

4. Go to **Signing & Capabilities** again:
   - Click **+ Capability**
   - Add **Background Modes**
   - Enable:
     - ✅ Location updates
     - ✅ Audio, AirPlay, and Picture in Picture

## Step 4: Build and Run

1. Ensure the Next.js web app is running:

   ```bash
   cd packages/web-app
   yarn dev
   ```

2. In Xcode:
   - Select a simulator or connected device
   - Press **Cmd + R** to build and run

## Testing Features

### Authentication

- Register a new account or sign in with existing credentials
- The app will show the event list after successful authentication

### Event Tracking

1. Select a event from the list
2. Tap **"Start Tracking"**
3. Grant location permission when prompted (select "Allow While Using App" or "Always Allow")
4. The app will:
   - Track your location in the background
   - Display real-time stats (speed, distance, duration)
   - Send updates to the activity API every 10-15 seconds

### Chat & Voice Messages

1. Scroll to the chat section in the event detail view
2. Type a text message and tap send, or
3. Tap the microphone button to record a voice message
4. Grant microphone permission when prompted
5. Tap "Stop Recording" to upload and send
6. Voice messages from others will auto-play over your music

### Background Tracking

- Lock your device or switch apps
- Location tracking continues in the background
- Music/podcasts continue playing
- Voice messages will interrupt with audio mixing

## Troubleshooting

### "Cannot connect to API"

- Verify the Next.js server is running on port 3001
- Check `apiBaseURL` in Config.swift matches your local IP
- Ensure both devices are on the same network

### "Location permission denied"

- Go to iOS Settings → Privacy & Security → Location Services
- Find Cheerioo and set to "Always" or "While Using App"

### "Microphone permission denied"

- Go to iOS Settings → Privacy & Security → Microphone
- Enable access for Cheerioo

### Build errors about missing Supabase

- Ensure Supabase Swift SDK is properly added via Swift Package Manager
- Try Product → Clean Build Folder and rebuild

### "Invalid Supabase credentials"

- Double-check the URL and anon key in Config.swift
- Ensure there are no extra spaces or quotes

## File Structure

```
ios-app/CheeriooApp/
├── Config.swift                    # API and Supabase configuration
├── AppState.swift                  # Global app state management
├── Models/
│   ├── Event.swift                 # Event data model
│   ├── Message.swift               # Message data model
│   └── Activity.swift              # Activity data models
├── Services/
│   ├── AuthService.swift           # Authentication logic
│   ├── EventService.swift          # Event API calls
│   ├── LocationService.swift       # Background location tracking
│   ├── ChatService.swift           # Real-time chat via Supabase
│   └── AudioService.swift          # Audio recording and playback
├── Views/
│   ├── Auth/
│   │   ├── LoginView.swift         # Login screen
│   │   └── RegisterView.swift      # Registration screen
│   ├── Events/
│   │   ├── EventListView.swift      # List of all events
│   │   └── EventDetailView.swift    # Event details with tracking
│   └── Components/
│       ├── ChatMessageRow.swift    # Chat message display
│       └── TrackingStatsView.swift # Speed/distance/time display
├── Info.plist                      # Permissions and capabilities
└── CheeriooAppApp.swift             # App entry point
```
