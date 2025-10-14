import Foundation

struct Config {
    // TODO: Copy these values from packages/web-app/.env.local
    // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    static let supabaseURL = "https://oumenpdjtlflmelorrrj.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bWVucGRqdGxmbG1lbG9ycnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMTI0ODQsImV4cCI6MjA3NTg4ODQ4NH0.0TvXLLgUbd8ZBMovmpLx5JRU1ho1FZKVqNrdB5R7lhY"
    
    // Base URL for Next.js API routes
    // For local development, use your machine's IP or localhost
    static let apiBaseURL = "http://localhost:3001"
}