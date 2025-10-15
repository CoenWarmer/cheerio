import SwiftUI

struct EventListView: View {
    @EnvironmentObject var appState: AppState
    @State private var events: [Event] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading events...")
                } else if let errorMessage {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)
                        Text(errorMessage)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task {
                                await loadEvents()
                            }
                        }
                    }
                    .padding()
                } else if events.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "tray")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No events available")
                            .font(.headline)
                        Text("Check back later or create a event on the web app")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List(events) { event in
                        NavigationLink(destination: EventDetailView(event: event)) {
                            EventRow(event: event)
                        }
                    }
                    .refreshable {
                        await loadEvents()
                    }
                }
            }
            .navigationTitle("Events")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Logout") {
                        handleLogout()
                    }
                }
            }
        }
        .task {
            await loadEvents()
        }
    }
    
    private func loadEvents() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let eventService = EventService(supabase: appState.supabase)
            events = try await eventService.fetchEvents()
        } catch {
            errorMessage = "Failed to load events: \(error.localizedDescription)"
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

struct EventRow: View {
    let event: Event
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(room.title)
                .font(.headline)
            
            if let description = event.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            HStack {
                if let status = event.status {
                    Label(status.rawValue.capitalized, systemImage: statusIcon(for: status))
                        .font(.caption)
                        .foregroundColor(statusColor(for: status))
                }
                
                if let location = event.location {
                    Spacer()
                    Label("📍 \(String(format: "%.4f, %.4f", location.lat, location.long))", systemImage: "")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
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
}

#Preview {
    EventListView()
        .environmentObject(AppState())
}

