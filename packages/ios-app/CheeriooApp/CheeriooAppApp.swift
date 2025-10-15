import SwiftUI

@main
struct CheeriooAppApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            Group {
                if appState.isLoading {
                    ProgressView("Loading...")
                } else if appState.isAuthenticated {
                    RoomListView()
                } else {
                    LoginView()
                }
            }
            .environmentObject(appState)
        }
    }
}

