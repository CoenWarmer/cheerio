import Foundation
import Supabase

class EventService {
    let supabase: SupabaseClient
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }
    
    func fetchEvents() async throws -> [Event] {
        let url = URL(string: "\(Config.apiBaseURL)/api/events")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        let apiResponse = try JSONDecoder().decode(APIResponse<[Event]>.self, from: data)
        return apiResponse.data
    }
    
    func joinEvent(slug: String) async throws {
        let url = URL(string: "\(Config.apiBaseURL)/api/events/\(slug)/join")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            print("EventService - Joining event '\(slug)' with user: \(session.user.id)")
        } else {
            print("EventService - WARNING: No session found when joining event '\(slug)'")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("EventService - Invalid response type")
            throw URLError(.badServerResponse)
        }
        
        print("EventService - Join response status: \(httpResponse.statusCode)")
        
        if (200...299).contains(httpResponse.statusCode) {
            if let responseString = String(data: data, encoding: .utf8) {
                print("EventService - Join success response: \(responseString)")
            }
        } else {
            if let responseString = String(data: data, encoding: .utf8) {
                print("EventService - Join error response: \(responseString)")
            }
            throw URLError(.badServerResponse)
        }
    }
}

struct APIResponse<T: Codable>: Codable {
    let data: T
}

