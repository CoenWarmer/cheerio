import Foundation
import Supabase

@MainActor
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = true
    
    let supabase: SupabaseClient
    
    init() {
        self.supabase = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey
        )
        
        Task {
            await checkSession()
            await observeAuthChanges()
        }
    }
    
    func checkSession() async {
        do {
            let session = try await supabase.auth.session
            self.currentUser = session.user
            self.isAuthenticated = true
        } catch {
            self.isAuthenticated = false
            self.currentUser = nil
        }
        self.isLoading = false
    }
    
    func observeAuthChanges() async {
        for await state in supabase.auth.authStateChanges {
            if state.event == .signedIn {
                self.currentUser = state.session?.user
                self.isAuthenticated = true
            } else if state.event == .signedOut {
                self.currentUser = nil
                self.isAuthenticated = false
            }
        }
    }
}

