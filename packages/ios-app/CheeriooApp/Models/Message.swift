import Foundation

struct Message: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let content: String
    let attachmentUrl: String?
    let attachmentType: String?
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, content, attachment
        case eventId = "event_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
    
    // Nested attachment structure
    struct Attachment: Codable {
        let url: String
        let type: String
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(String.self, forKey: .id)
        eventId = try container.decode(String.self, forKey: .eventId)
        userId = try container.decode(String.self, forKey: .userId)
        content = try container.decode(String.self, forKey: .content)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        
        // Decode nested attachment if present
        if let attachment = try? container.decode(Attachment.self, forKey: .attachment) {
            attachmentUrl = attachment.url
            attachmentType = attachment.type
        } else {
            attachmentUrl = nil
            attachmentType = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(id, forKey: .id)
        try container.encode(eventId, forKey: .eventId)
        try container.encode(userId, forKey: .userId)
        try container.encode(content, forKey: .content)
        try container.encode(createdAt, forKey: .createdAt)
        
        // Encode attachment as nested object if present
        if let url = attachmentUrl, let type = attachmentType {
            let attachment = Attachment(url: url, type: type)
            try container.encode(attachment, forKey: .attachment)
        }
    }
    
    var isAudioMessage: Bool {
        attachmentType == "audio" && attachmentUrl != nil
    }
}

