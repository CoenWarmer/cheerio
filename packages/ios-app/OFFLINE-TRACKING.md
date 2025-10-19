# Offline Location Tracking

## Overview

The iOS app now supports **offline location tracking** with automatic sync when connection is restored. Location updates are never lost, even during network interruptions.

## How It Works

### 1. **Network Monitoring**

```swift
// Uses Apple's Network framework to monitor connectivity
private let networkMonitor = NWPathMonitor()

networkMonitor.pathUpdateHandler = { path in
    self.isOnline = path.status == .satisfied
}
```

### 2. **Local Storage Queue**

```swift
// Activities are stored in UserDefaults
struct StoredActivity: Codable {
    let id: String
    let eventSlug: String
    let type: ActivityType
    let data: ActivityData
    let timestamp: Date
}
```

### 3. **Smart Sending Logic**

```swift
// When tracking:
if isOnline {
    // Try to send immediately
    let success = await sendActivityDirect(...)

    if !success {
        // Failed → Queue it
        addToQueue(...)
    }
} else {
    // Offline → Queue immediately
    addToQueue(...)
}
```

### 4. **Automatic Sync**

```swift
// When connection is restored:
if wasOffline && isOnline && !queue.isEmpty {
    print("📤 Connection restored! Processing \(queue.count) activities...")
    await processQueue()
}
```

---

## Features

### ✅ **Never Lose Location Data**

- All location updates are logged locally first
- Queued activities persist across app restarts
- Activities are sent in chronological order

### ✅ **Visual Feedback**

```swift
// Network Status Indicator
if !locationService.isOnline {
    HStack {
        Image(systemName: "wifi.slash")
        Text("Offline")
    }
}

// Pending Activities Counter
if locationService.pendingActivitiesCount > 0 {
    HStack {
        Image(systemName: "arrow.clockwise.circle.fill")
        Text("\(pendingActivitiesCount) pending")
    }
}
```

### ✅ **Smart Retry Logic**

- Automatic retry when connection restored
- Failed activities remain in queue
- Stops processing if connection drops again during sync

### ✅ **Efficient Processing**

- Sequential processing to maintain order
- 10-second timeout per request
- No overwhelming the server

---

## User Experience

### **Tracking Online:**

1. User starts tracking ✅
2. Location updates sent immediately ✅
3. Real-time path appears on map ✅

### **Connection Lost During Tracking:**

1. User starts tracking ✅
2. Connection drops 📴
3. "Offline" indicator appears 🟠
4. Location updates queued locally 💾
5. Counter shows "5 pending" 🔵
6. User continues tracking ✅

### **Connection Restored:**

1. Connection comes back 📶
2. "Processing 5 activities..." 🔄
3. Activities sent one by one ✅
4. Counter decreases: "4 pending... 3... 2... 1..." 🔵
5. "All queued activities sent!" ✅
6. Counter disappears ✅

---

## Technical Details

### **Storage**

- **Location:** `UserDefaults` with key `com.cheerioo.activityQueue`
- **Format:** JSON-encoded array of `StoredActivity`
- **Persistence:** Survives app restarts

### **Network Monitoring**

- **Framework:** Apple's `Network.framework`
- **Monitor:** `NWPathMonitor`
- **Detection:** Real-time connection status changes

### **Queue Processing**

```swift
// Process queue when:
1. Connection is restored
2. App comes to foreground (if online)
3. User manually triggers (future feature)

// Stop processing when:
1. Connection lost during sync
2. All activities sent successfully
3. Queue is empty
```

### **Activity Order**

Activities are sent in **chronological order** (FIFO - First In, First Out):

```
Queue: [Activity1, Activity2, Activity3, ...]
       ↓
Send Activity1 → Success? ✅ → Remove from queue
       ↓
Send Activity2 → Success? ✅ → Remove from queue
       ↓
Send Activity3 → Failed? ❌ → Keep in queue, stop processing
```

---

## Published Properties

The `LocationService` now exposes:

```swift
@Published var isOnline = true
// Current network status

@Published var pendingActivitiesCount = 0
// Number of activities waiting to be sent
```

**UI can observe these for:**

- Showing offline indicators
- Displaying sync progress
- User notifications

---

## Console Logging

### **Queue Operations:**

```
💾 Queued activity (total: 5)
📦 Loaded 5 activities from local storage
```

### **Network Events:**

```
📡 Network status: Offline
📡 Network status: Online
📤 Connection restored! Processing 5 activities...
```

### **Sync Progress:**

```
🔄 Processing queue: 5 activities...
✅ Successfully sent queued activity: ABC-123
✅ Successfully sent queued activity: DEF-456
⚠️ 3 activities remain in queue
```

### **Completion:**

```
✅ All queued activities sent successfully!
```

---

## Error Handling

### **Network Errors**

```swift
// Caught and logged, activity added to queue
catch {
    print("❌ Error sending activity: \(error)")
    addToQueue(...)
}
```

### **HTTP Errors**

```swift
// 4xx/5xx responses → activity queued
if !(200...299).contains(statusCode) {
    print("❌ Failed to send: \(statusCode)")
    addToQueue(...)
}
```

### **Timeout**

```swift
// 10-second timeout prevents hanging
request.timeoutInterval = 10
```

---

## Future Enhancements

### **Potential Additions:**

1. **Manual Retry Button**

   ```swift
   Button("Retry Pending (\(count))") {
       await locationService.processQueue()
   }
   ```

2. **Queue Size Limit**

   ```swift
   // Prevent queue from growing indefinitely
   let maxQueueSize = 1000
   if activityQueue.count >= maxQueueSize {
       activityQueue.removeFirst()
   }
   ```

3. **Batch Upload**

   ```swift
   // Send multiple activities in one request
   POST /api/events/:slug/activity/batch
   Body: [activity1, activity2, ...]
   ```

4. **Storage Optimization**

   ```swift
   // Use Core Data or file storage for larger queues
   // Current UserDefaults is fine for ~100-200 activities
   ```

5. **Background Sync**
   ```swift
   // Sync queue when app is in background
   BGTaskScheduler.shared.register(...)
   ```

---

## Testing

### **Simulate Offline:**

1. **Airplane Mode:** Turn on airplane mode during tracking
2. **Network Link Conditioner:** Use Xcode tool to simulate poor connectivity
3. **WiFi Toggle:** Rapidly toggle WiFi on/off

### **Verify Queue:**

1. Start tracking
2. Go offline
3. Track for 30 seconds (~3-5 location updates)
4. Check console: "💾 Queued activity (total: X)"
5. Go back online
6. Verify: "📤 Connection restored! Processing X activities..."
7. Check: "✅ All queued activities sent successfully!"

### **Verify Persistence:**

1. Start tracking offline
2. Queue some activities
3. Force quit app
4. Reopen app
5. Check console: "📦 Loaded X activities from local storage"
6. Go online
7. Verify sync

---

## Summary

✅ **Reliable:** Location updates never lost  
✅ **Automatic:** No user intervention needed  
✅ **Transparent:** Visual feedback on status  
✅ **Efficient:** Smart retry and queue management  
✅ **Persistent:** Survives app restarts

**Your tracking data is safe, even when offline!** 🛰️💾
