import SwiftUI

struct RoomListView: View {
    @EnvironmentObject var appState: AppState
    @State private var rooms: [Room] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading rooms...")
                } else if let errorMessage {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)
                        Text(errorMessage)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task {
                                await loadRooms()
                            }
                        }
                    }
                    .padding()
                } else if rooms.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "tray")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No rooms available")
                            .font(.headline)
                        Text("Check back later or create a room on the web app")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List(rooms) { room in
                        NavigationLink(destination: RoomDetailView(room: room)) {
                            RoomRow(room: room)
                        }
                    }
                    .refreshable {
                        await loadRooms()
                    }
                }
            }
            .navigationTitle("Rooms")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Logout") {
                        handleLogout()
                    }
                }
            }
        }
        .task {
            await loadRooms()
        }
    }
    
    private func loadRooms() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let roomService = RoomService(supabase: appState.supabase)
            rooms = try await roomService.fetchRooms()
        } catch {
            errorMessage = "Failed to load rooms: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    private func handleLogout() {
        Task {
            do {
                let authService = AuthService(supabase: appState.supabase)
                try await authService.signOut()
            } catch {
                print("Logout error: \(error)")
            }
        }
    }
}

struct RoomRow: View {
    let room: Room
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(room.title)
                .font(.headline)
            
            if let description = room.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            HStack {
                if let status = room.status {
                    Label(status.rawValue.capitalized, systemImage: statusIcon(for: status))
                        .font(.caption)
                        .foregroundColor(statusColor(for: status))
                }
                
                if let location = room.location {
                    Spacer()
                    Label("📍 \(String(format: "%.4f, %.4f", location.lat, location.long))", systemImage: "")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func statusIcon(for status: RoomStatus) -> String {
        switch status {
        case .awaiting: return "clock"
        case .inProgress: return "play.circle"
        case .finished: return "checkmark.circle"
        }
    }
    
    private func statusColor(for status: RoomStatus) -> Color {
        switch status {
        case .awaiting: return .orange
        case .inProgress: return .green
        case .finished: return .gray
        }
    }
}

#Preview {
    RoomListView()
        .environmentObject(AppState())
}

