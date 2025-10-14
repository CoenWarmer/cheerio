import SwiftUI

struct ChatMessageRow: View {
    let message: Message
    let isCurrentUser: Bool
    let userName: String
    let onAudioTap: ((String) -> Void)?
    
    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // Push current user messages to the right
            if isCurrentUser {
                Spacer(minLength: 60)
            }
            
            VStack(alignment: isCurrentUser ? .trailing : .leading, spacing: 4) {
                // Display user name (show "You" for current user)
                Text(isCurrentUser ? "You" : userName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(isCurrentUser ? .blue : .primary)
                if message.isAudioMessage {
                    // Debug: This should only show for actual audio messages
                    Button(action: {
                        print("DEBUG: Tapped audio message")
                        print("DEBUG: Attachment URL: \(message.attachmentUrl ?? "nil")")
                        print("DEBUG: Attachment Type: \(message.attachmentType ?? "nil")")
                        if let audioUrl = message.attachmentUrl {
                            onAudioTap?(audioUrl)
                        }
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "play.circle.fill")
                                .foregroundColor(.white)
                            Text("Voice Message")
                                .font(.caption)
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(isCurrentUser ? Color.blue : Color.gray)
                        .cornerRadius(16)
                    }
                } else {
                    Text(message.content)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(isCurrentUser ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(16)
                }
                
                Text(formatDate(message.createdAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            // Push other users' messages to the left
            if !isCurrentUser {
                Spacer(minLength: 60)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else {
            return ""
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.timeStyle = .short
        displayFormatter.dateStyle = .none
        
        return displayFormatter.string(from: date)
    }
}

