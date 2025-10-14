import Foundation

struct Activity: Codable {
    let activityType: ActivityType
    let data: ActivityData
    
    enum CodingKeys: String, CodingKey {
        case activityType = "activity_type"
        case data
    }
}

enum ActivityType: String, Codable {
    case location
    case speed
    case distance
    case music
}

enum ActivityData: Codable {
    case location(LocationData)
    case speed(SpeedData)
    case distance(DistanceData)
    case music(MusicData)
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let locationData = try? container.decode(LocationData.self) {
            self = .location(locationData)
        } else if let speedData = try? container.decode(SpeedData.self) {
            self = .speed(speedData)
        } else if let distanceData = try? container.decode(DistanceData.self) {
            self = .distance(distanceData)
        } else if let musicData = try? container.decode(MusicData.self) {
            self = .music(musicData)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode ActivityData"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .location(let data):
            try container.encode(data)
        case .speed(let data):
            try container.encode(data)
        case .distance(let data):
            try container.encode(data)
        case .music(let data):
            try container.encode(data)
        }
    }
}

struct LocationData: Codable {
    let lat: Double
    let long: Double
}

struct SpeedData: Codable {
    let speed: Double
    let unit: String
}

struct DistanceData: Codable {
    let distance: Double
    let unit: String
}

struct MusicData: Codable {
    let title: String
    let artist: String?
    let service: String?
}

