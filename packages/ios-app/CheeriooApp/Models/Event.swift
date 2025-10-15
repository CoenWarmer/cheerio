import Foundation

struct Event: Codable, Identifiable {
    let id: String
    let slug: String
    let title: String
    let description: String?
    let donationLink: String?
    let startTime: String?
    let status: EventStatus?
    let location: Location?
    let isPrivate: Bool
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, slug, description, location, status
        case title = "name"  // Database uses "name", map to "title"
        case donationLink = "donation_link"
        case startTime = "start_time"
        case isPrivate = "is_private"
        case createdAt = "created_at"
    }
}

enum EventStatus: String, Codable {
    case awaiting
    case inProgress = "in_progress"
    case finished
}

struct Location: Codable {
    let lat: Double
    let long: Double
}

