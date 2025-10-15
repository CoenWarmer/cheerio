import Foundation
import Supabase

@MainActor
class ProfileService: ObservableObject {
    private let supabase: SupabaseClient
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }
    
    func fetchUserNames(userIds: [String]) async -> [String: String] {
        guard !userIds.isEmpty else { return [:] }
        
        do {
            // Build URL with query parameters: /api/profiles?ids=uuid1,uuid2,uuid3
            let idsParam = userIds.joined(separator: ",")
            let urlString = "\(Config.apiBaseURL)/api/profiles?ids=\(idsParam)"
            guard let url = URL(string: urlString) else {
                print("Invalid URL: \(urlString)")
                return [:]
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            
            // Add auth token
            if let session = try? await supabase.auth.session {
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            }
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            // Debug: Print response
            if let httpResponse = response as? HTTPURLResponse {
                print("DEBUG: Profiles API status code: \(httpResponse.statusCode)")
            }
            if let responseString = String(data: data, encoding: .utf8) {
                print("DEBUG: Profiles API response: \(responseString)")
            }
            
            let profilesResponse = try JSONDecoder().decode(ProfilesResponse.self, from: data)
            
            // Build map of user ID to display name
            var userNames: [String: String] = [:]
            for profile in profilesResponse.data {
                if let displayName = profile.displayName {
                    userNames[profile.id] = displayName
                } else {
                    // Fallback to "User {first 8 chars of ID}" (matching web app)
                    let shortId = String(profile.id.prefix(8))
                    userNames[profile.id] = "User \(shortId)"
                }
            }
            
            return userNames
        } catch {
            print("Failed to fetch user names: \(error)")
            return [:]
        }
    }
}

struct ProfilesResponse: Codable {
    let data: [Profile]
}

struct Profile: Codable {
    let id: String
    let displayName: String?
    let avatarUrl: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
    }
}

