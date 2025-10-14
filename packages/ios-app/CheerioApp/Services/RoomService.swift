import Foundation
import Supabase

class RoomService {
    let supabase: SupabaseClient
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }
    
    func fetchRooms() async throws -> [Room] {
        let url = URL(string: "\(Config.apiBaseURL)/api/rooms")!
        
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
        
        let apiResponse = try JSONDecoder().decode(APIResponse<[Room]>.self, from: data)
        return apiResponse.data
    }
    
    func joinRoom(slug: String) async throws {
        let url = URL(string: "\(Config.apiBaseURL)/api/rooms/\(slug)/join")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}

struct APIResponse<T: Codable>: Codable {
    let data: T
}

