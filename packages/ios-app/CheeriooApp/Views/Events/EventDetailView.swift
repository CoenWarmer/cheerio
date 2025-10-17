import SwiftUI
import Supabase

struct EventDetailView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var locationService: LocationService
    @StateObject private var chatService: ChatService
    @StateObject private var audioService: AudioService
    
    let event: Event
    
    @State private var newMessage = ""
    @State private var showingRecordButton = false
    @State private var hasJoinedEvent = false
    @State private var activeUsersCount = 0
    
    init(event: Event) {
        self.event = event
        
        // Initialize services with a temporary state - will be properly set in .task
        let tempSupabase = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey
        )
        _locationService = StateObject(wrappedValue: LocationService(supabase: tempSupabase))
        _chatService = StateObject(wrappedValue: ChatService(supabase: tempSupabase))
        _audioService = StateObject(wrappedValue: AudioService(supabase: tempSupabase))
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Section (scrollable when needed)
            ScrollView {
                VStack(spacing: 16) {                    
                    // Tracking Stats (when tracking)
                    if locationService.isTracking {
                        TrackingStatsView(
                            speed: locationService.currentSpeed,
                            distance: locationService.totalDistance,
                            duration: locationService.trackingDuration
                        )
                    }
                    
                    // Start/Stop Tracking Button
                    Button(action: toggleTracking) {
                        HStack {
                            Image(systemName: locationService.isTracking ? "stop.circle.fill" : "location.circle.fill")
                            Text(locationService.isTracking ? "Stop Tracking" : "Start Tracking")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(locationService.isTracking ? Color.red : Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    
                    // Emoji Status Buttons
                    VStack(spacing: 8) {
                        HStack(spacing: 8) {
                            EmojiButton(emoji: "😎") { handleEmojiTap("😎") }
                            EmojiButton(emoji: "🙁") { handleEmojiTap("🙁") }
                            EmojiButton(emoji: "😫") { handleEmojiTap("😫") }
                        }
                        HStack(spacing: 8) {
                            EmojiButton(emoji: "😮‍💨") { handleEmojiTap("😮‍💨") }
                            EmojiButton(emoji: "😤") { handleEmojiTap("😤") }
                            EmojiButton(emoji: "🥵") { handleEmojiTap("🥵") }
                        }
                    }
                }
                .padding()
            }
            .frame(maxHeight: 240) // Limit top section height (increased for emoji buttons)
            
            Divider()
            
            // Chat Section (fills remaining space)
            VStack(spacing: 0) {
                HStack {
                    Text("Chat")
                        .font(.headline)
                    
                    Spacer()
                    
                    // Active users count
                    HStack(spacing: 4) {
                        Image(systemName: "person.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                        Text("\(activeUsersCount) active")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 4)
                
                // Messages ScrollView (fills remaining vertical space)
                ScrollView {
                    if chatService.messages.isEmpty {
                        Text("No messages yet")
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        LazyVStack(spacing: 8) {
                            // Reverse order to show newest at top
                            ForEach(chatService.messages.reversed()) { message in
                                // Case-insensitive UUID comparison
                                let isCurrentUser = message.userId.lowercased() == appState.currentUser?.id.uuidString.lowercased()
                                
                                ChatMessageRow(
                                    message: message,
                                    isCurrentUser: isCurrentUser,
                                    userName: chatService.userNames[message.userId] ?? "User",
                                    onAudioTap: { audioUrl in
                                        Task {
                                            await audioService.playAudio(from: audioUrl)
                                        }
                                    }
                                )
                            }
                        }
                        .padding(.top, 8)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Message Input (fixed at bottom)
                VStack(spacing: 0) {
                    Divider()
                    
                    HStack(spacing: 12) {
                        if audioService.isRecording {
                            Button(action: stopRecordingAndSend) {
                                HStack {
                                    Image(systemName: "stop.circle.fill")
                                        .foregroundColor(.red)
                                    Text("Stop Recording")
                                }
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                            }
                        } else {
                            TextField("Type a message...", text: $newMessage)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                            
                            Button(action: startRecording) {
                                Image(systemName: "mic.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                            }
                            
                            Button(action: sendMessage) {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(newMessage.isEmpty ? .gray : .blue)
                            }
                            .disabled(newMessage.isEmpty)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                }
            }
        }
        .navigationTitle(event.title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await joinEventAndSubscribe()
        }
        .onDisappear {
            if locationService.isTracking {
                locationService.stopTracking()
            }
            Task {
                await chatService.unsubscribe()
                await removePresence()
            }
        }
    }
    
    private func joinEventAndSubscribe() async {
        guard !hasJoinedEvent else { return }
        hasJoinedEvent = true
        
        // Join the event
        do {
            let eventService = EventService(supabase: appState.supabase)
            try await eventService.joinEvent(slug: event.slug)
        } catch {
            print("Failed to join event: \(error)")
        }
        
        // Subscribe to chat (use slug for API, but event.id for realtime channel)
        await chatService.subscribeToEvent(eventId: event.id, eventSlug: event.slug) { audioUrl in
            Task {
                await audioService.playAudio(from: audioUrl)
            }
        }
        
        // Update presence and fetch active users
        await updatePresence()
        await fetchActiveUsers()
        
        // Start presence timer (update every 20 seconds)
        startPresenceTimer()
    }
    
    private func updatePresence() async {
        do {
            let url = URL(string: "\(Config.apiBaseURL)/api/events/\(event.slug)/presence")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            if let session = try? await appState.supabase.auth.session {
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            }
            
            let body = ["status": "online"]
            request.httpBody = try JSONEncoder().encode(body)
            
            let (_, _) = try await URLSession.shared.data(for: request)
        } catch {
            print("Failed to update presence: \(error)")
        }
    }
    
    private func fetchActiveUsers() async {
        do {
            let url = URL(string: "\(Config.apiBaseURL)/api/events/\(event.slug)/presence")!
            var request = URLRequest(url: url)
            
            if let session = try? await appState.supabase.auth.session {
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            }
            
            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder().decode(ActiveUsersResponse.self, from: data)
            
            await MainActor.run {
                activeUsersCount = response.data.count
            }
        } catch {
            print("Failed to fetch active users: \(error)")
        }
    }
    
    private func startPresenceTimer() {
        Timer.scheduledTimer(withTimeInterval: 20.0, repeats: true) { _ in
            Task {
                await self.updatePresence()
            }
        }
    }
    
    private func removePresence() async {
        do {
            let url = URL(string: "\(Config.apiBaseURL)/api/events/\(event.slug)/presence")!
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            
            if let session = try? await appState.supabase.auth.session {
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            }
            
            let (_, _) = try await URLSession.shared.data(for: request)
        } catch {
            print("Failed to remove presence: \(error)")
        }
    }
    
    private func toggleTracking() {
        if locationService.isTracking {
            locationService.stopTracking()
        } else {
            locationService.requestPermission()
            Task {
                await locationService.startTracking(eventSlug: event.slug)
            }
        }
    }
    
    // Helper to check if a string is a single emoji
    private func isEmoji(_ string: String) -> Bool {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count <= 4 else { return false } // Emojis can be multi-byte
        return trimmed.unicodeScalars.allSatisfy { $0.properties.isEmoji }
    }
    
    private func sendMessage() {
        guard !newMessage.isEmpty else { return }
        
        Task {
            do {
                var location: [String: Double]?
                
                // If this is an emoji and user is tracking, include location
                if isEmoji(newMessage), locationService.isTracking,
                   let currentLocation = locationService.currentLocation {
                    location = [
                        "lat": currentLocation.coordinate.latitude,
                        "long": currentLocation.coordinate.longitude
                    ]
                }
                
                try await chatService.sendMessage(eventSlug: event.slug, content: newMessage, location: location)
                newMessage = ""
            } catch {
                print("Failed to send message: \(error)")
            }
        }
    }
    
    private func startRecording() {
        Task {
            let hasPermission = await audioService.requestMicrophonePermission()
            guard hasPermission else {
                print("Microphone permission denied")
                return
            }
            
            do {
                try audioService.startRecording()
            } catch {
                print("Failed to start recording: \(error)")
            }
        }
    }
    
    private func stopRecordingAndSend() {
        guard let fileURL = audioService.stopRecording() else { return }
        
        Task {
            do {
                let uploadResult = try await audioService.uploadAudio(fileURL: fileURL, eventSlug: event.slug)
                
                // Send message with audio attachment (matching web app format)
                let url = URL(string: "\(Config.apiBaseURL)/api/events/\(event.slug)/messages")!
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                if let session = try? await appState.supabase.auth.session {
                    request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
                }
                
                let body: [String: Any] = [
                    "content": "🎤 Voice message",
                    "attachment": uploadResult
                    
                ]
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
                
                let (_, _) = try await URLSession.shared.data(for: request)
            } catch {
                print("Failed to send voice message: \(error)")
            }
        }
    }
    
    private func statusIcon(for status: EventStatus) -> String {
        switch status {
        case .awaiting: return "clock"
        case .inProgress: return "play.circle"
        case .finished: return "checkmark.circle"
        }
    }
    
    private func statusColor(for status: EventStatus) -> Color {
        switch status {
        case .awaiting: return .orange
        case .inProgress: return .green
        case .finished: return .gray
        }
    }
    
    private func handleEmojiTap(_ emoji: String) {
        Task {
            do {
                var location: [String: Double]?
                
                // If user is tracking, include location with emoji
                if locationService.isTracking,
                   let currentLocation = locationService.currentLocation {
                    location = [
                        "lat": currentLocation.coordinate.latitude,
                        "long": currentLocation.coordinate.longitude
                    ]
                }
                
                try await chatService.sendMessage(eventSlug: event.slug, content: emoji, location: location)
            } catch {
                print("Failed to send emoji: \(error)")
            }
        }
    }
}

// MARK: - Emoji Button Component
struct EmojiButton: View {
    let emoji: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(emoji)
                .font(.system(size: 32))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color(.systemGray6))
                .cornerRadius(10)
        }
    }
}

// MARK: - API Response Types
struct ActiveUsersResponse: Codable {
    let data: [PresenceUser]
}

struct PresenceUser: Codable {
    let userId: String
    let status: String
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case status
    }
}

