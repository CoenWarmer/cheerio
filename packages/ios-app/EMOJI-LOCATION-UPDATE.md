# iOS App - Emoji Location Update

## Overview

Updated the iOS app to send the user's location with emoji messages when actively tracking, matching the web app's behavior.

## Changes Made

### 1. LocationService.swift

**Added `currentLocation` property:**

```swift
@Published var currentLocation: CLLocation?
```

**Updated location tracking:**

- Sets `currentLocation` when location updates are received
- Clears `currentLocation` when tracking stops
- Makes current location accessible to other components

### 2. ChatService.swift

**Updated `sendMessage` method:**

```swift
func sendMessage(eventSlug: String, content: String, location: [String: Double]? = nil) async throws
```

**Changes:**

- Added optional `location` parameter (`[String: Double]` format: `["lat": latitude, "long": longitude]`)
- Includes location in request body if provided
- Uses `JSONSerialization` instead of `JSONEncoder` to handle mixed types

### 3. EventDetailView.swift

**Added emoji detection helper:**

```swift
private func isEmoji(_ string: String) -> Bool {
    let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard trimmed.count <= 4 else { return false }
    return trimmed.unicodeScalars.allSatisfy { $0.properties.isEmoji }
}
```

**Updated `sendMessage()` method:**

- Checks if message content is an emoji
- If emoji AND user is tracking, includes current location
- Location format: `["lat": latitude, "long": longitude]`

**Updated `handleEmojiTap()` method:**

- Always checks if user is tracking when emoji button is tapped
- Includes location with emoji if tracking is active

## How It Works

### Sending a Regular Message

1. User types message in chat input
2. If message is NOT an emoji → sent without location
3. If message IS an emoji AND user is tracking → sent with location

### Sending via Emoji Buttons (2x3 Grid)

1. User taps emoji button
2. If user is tracking → emoji sent with current location
3. If user is NOT tracking → emoji sent without location

### Location Format

```json
{
  "content": "🎉",
  "location": {
    "lat": 52.3676,
    "long": 4.9041
  }
}
```

## Testing

### Test Case 1: Tracker Sends Emoji

1. Open iOS app, log in as tracker/admin
2. Join a event
3. Tap "Start Tracking"
4. Wait for location to be acquired (check tracking stats)
5. Tap an emoji button or type an emoji
6. ✅ All users (iOS + web) should see emoji marker on map

### Test Case 2: Tracker Sends Emoji Without Tracking

1. Open iOS app, log in as tracker/admin
2. Join a event
3. DON'T start tracking
4. Tap an emoji button or type an emoji
5. ✅ Emoji appears in chat, but NO marker on map

### Test Case 3: Supporter Sends Emoji

1. Open iOS app, log in as supporter
2. Join a event
3. Type an emoji (tracking button should not be visible)
4. ✅ Emoji appears in chat, but NO marker on map

### Test Case 4: Mixed Content

1. Open iOS app, log in as tracker
2. Start tracking
3. Type "Hello 👋" (text + emoji)
4. ✅ Message appears in chat, but NO marker (not a single emoji)

## Notes

- Location is only sent for **single emoji** messages
- User must be **actively tracking** for location to be included
- Location is **automatically included** - no user action needed
- Emoji detection uses Swift's Unicode scalar properties
- Works with all Unicode emojis, including multi-byte ones (up to 4 bytes)

## Compatibility

- iOS 15.0+
- Requires location permissions ("Always" for background tracking)
- Works with web app emoji markers (shared database)
- Real-time updates via Supabase Realtime
