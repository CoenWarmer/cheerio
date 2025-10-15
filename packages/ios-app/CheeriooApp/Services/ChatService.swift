import Foundation
import Supabase
import Realtime

@MainActor
class ChatService: ObservableObject {
    @Published var messages: [Message] = []
    @Published var userNames: [String: String] = [:] // Map of user ID to display name
    
    private let supabase: SupabaseClient
    private var channel: RealtimeChannelV2?
    private var onAudioMessage: ((String) -> Void)?
    private let profileService: ProfileService
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
        self.profileService = ProfileService(supabase: supabase)
    }
    
    func subscribeToEvent(eventId: String, eventSlug: String, onAudioMessage: @escaping (String) -> Void) async {
        self.onAudioMessage = onAudioMessage
        
        // Fetch existing messages first
        await fetchMessages(eventSlug: eventSlug)
        
        // Subscribe to real-time updates (use eventId UUID for channel and filtering)
        let channel = supabase.realtimeV2.channel("messages:\(eventId)")
        
        let insertions = channel.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "messages",
            filter: "event_id=eq.\(eventId)"
        )
        
        self.channel = channel
        
        do {
            try await channel.subscribeWithError()
            
            // Listen for insertions
            Task {
                for await insertion in insertions {
                    // The record is already a dictionary
                    await handleNewMessage(record: insertion.record)
                }
            }
        } catch {
            print("Failed to subscribe to channel: \(error)")
        }
    }
    
    func unsubscribe() async {
        if let channel = channel {
            await supabase.realtimeV2.removeChannel(channel)
        }
        channel = nil
        messages = []
    }
    
    func sendMessage(eventSlug: String, content: String, location: [String: Double]? = nil) async throws {
        let url = URL(string: "\(Config.apiBaseURL)/api/events/\(eventSlug)/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        var body: [String: Any] = ["content": content]
        if let location = location {
            body["location"] = location
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
    
    private func fetchMessages(eventSlug: String) async {
        do {
            let url = URL(string: "\(Config.apiBaseURL)/api/events/\(eventSlug)/messages")!
            var request = URLRequest(url: url)
            
            // Add auth token
            if let session = try? await supabase.auth.session {
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            }
            
            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder().decode(APIResponse<[Message]>.self, from: data)
            messages = response.data
            
            // Fetch user names for all unique user IDs
            await fetchUserNamesForMessages()
        } catch {
            print("Failed to fetch messages: \(error)")
        }
    }
    
    private func fetchUserNamesForMessages() async {
        // Get unique user IDs from messages
        let userIds = Set(messages.map { $0.userId })
        
        // Fetch names for users we don't have yet
        let missingUserIds = userIds.filter { userNames[$0] == nil }
        
        if !missingUserIds.isEmpty {
            let fetchedNames = await profileService.fetchUserNames(userIds: Array(missingUserIds))
            
            // Merge with existing names
            for (userId, name) in fetchedNames {
                userNames[userId] = name
            }
        }
    }
    
    private func handleNewMessage(record: [String: Any]) async {
        // Helper function to extract string from AnyJSON
        func extractString(_ value: Any?) -> String? {
            if let str = value as? String {
                return str
            }
            // Handle AnyJSON wrapped values by converting to string
            return "\(value ?? "")"
                .replacingOccurrences(of: "<null>", with: "")
                .trimmingCharacters(in: .whitespaces)
                .isEmpty ? nil : "\(value ?? "")"
        }
        
        // Extract fields (values come as AnyJSON from Supabase Realtime)
        guard let id = extractString(record["id"]),
              let eventId = extractString(record["event_id"]),
              let userId = extractString(record["user_id"]),
              let content = extractString(record["content"]),
              let createdAt = extractString(record["created_at"]) else {
            print("Failed to extract required message fields from record")
            return
        }
        
        // Check if message already exists
        if messages.contains(where: { $0.id == id }) {
            return
        }
        
        // Extract optional attachment (also handle AnyJSON)
        var attachmentUrl: String?
        var attachmentType: String?
        
        if let attachment = record["attachment"] as? [String: Any] {
            attachmentUrl = extractString(attachment["url"])
            attachmentType = extractString(attachment["type"])
        }
        
        // Create JSON structure that matches Message's Codable structure
        var messageDict: [String: Any] = [
            "id": id,
            "event_id": eventId,
            "user_id": userId,
            "content": content,
            "created_at": createdAt
        ]
        
        if let url = attachmentUrl, let type = attachmentType {
            messageDict["attachment"] = ["url": url, "type": type]
        }
        
        do {
            let data = try JSONSerialization.data(withJSONObject: messageDict)
            let message = try JSONDecoder().decode(Message.self, from: data)
            
            messages.append(message)
            
            // Fetch user name if we don't have it yet
            if userNames[message.userId] == nil {
                let names = await profileService.fetchUserNames(userIds: [message.userId])
                if let name = names[message.userId] {
                    userNames[message.userId] = name
                }
            }
            
            // Check if it's an audio message
            if message.isAudioMessage, let audioUrl = message.attachmentUrl {
                onAudioMessage?(audioUrl)
            }
        } catch {
            print("Failed to decode message: \(error)")
        }
    }
}

