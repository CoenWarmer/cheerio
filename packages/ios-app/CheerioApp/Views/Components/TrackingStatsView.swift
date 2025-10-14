import SwiftUI

struct TrackingStatsView: View {
    let speed: Double
    let distance: Double
    let duration: TimeInterval
    
    var body: some View {
        HStack(spacing: 20) {
            StatCard(
                title: "Speed",
                value: String(format: "%.1f", speed),
                unit: "km/h",
                icon: "speedometer"
            )
            
            StatCard(
                title: "Distance",
                value: String(format: "%.2f", distance),
                unit: "km",
                icon: "map"
            )
            
            StatCard(
                title: "Duration",
                value: formatDuration(duration),
                unit: "",
                icon: "timer"
            )
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(15)
        .shadow(radius: 5)
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                
                if !unit.isEmpty {
                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    TrackingStatsView(speed: 12.5, distance: 5.43, duration: 1847)
        .padding()
}

