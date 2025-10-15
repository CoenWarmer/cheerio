import Foundation
import CoreLocation
import Supabase

@MainActor
class LocationService: NSObject, ObservableObject {
    @Published var isTracking = false
    @Published var currentSpeed: Double = 0.0 // km/h
    @Published var totalDistance: Double = 0.0 // km
    @Published var trackingDuration: TimeInterval = 0
    @Published var currentLocation: CLLocation?
    
    private let locationManager = CLLocationManager()
    private let supabase: SupabaseClient
    private var lastLocation: CLLocation?
    private var startTime: Date?
    private var timer: Timer?
    private var currentRoomSlug: String?
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
        super.init()
        
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10 // meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }
    
    func requestPermission() {
        locationManager.requestAlwaysAuthorization()
    }
    
    func startTracking(roomSlug: String) async {
        self.currentRoomSlug = roomSlug
        self.isTracking = true
        self.startTime = Date()
        self.totalDistance = 0.0
        self.lastLocation = nil
        
        locationManager.startUpdatingLocation()
        
        // Start timer to update duration
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateDuration()
            }
        }
    }
    
    func stopTracking() {
        isTracking = false
        currentRoomSlug = nil
        locationManager.stopUpdatingLocation()
        timer?.invalidate()
        timer = nil
        startTime = nil
        lastLocation = nil
        currentLocation = nil
    }
    
    private func updateDuration() {
        guard let startTime = startTime else { return }
        trackingDuration = Date().timeIntervalSince(startTime)
    }
    
    private func sendActivity(type: ActivityType, data: ActivityData) async {
        guard let roomSlug = currentRoomSlug else {
            return
        }
        
        let url = URL(string: "\(Config.apiBaseURL)/api/rooms/\(roomSlug)/activity")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        let activity = Activity(activityType: type, data: data)
        request.httpBody = try? JSONEncoder().encode(activity)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                if !(200...299).contains(httpResponse.statusCode) {
                    print("Failed to send activity: \(httpResponse.statusCode)")
                    if let responseString = String(data: data, encoding: .utf8) {
                        print("Response: \(responseString)")
                    }
                }
            }
        } catch {
            print("Error sending activity: \(error.localizedDescription)")
        }
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        Task { @MainActor in
            guard isTracking else { return }
            
            // Calculate distance if we have a previous location
            if let lastLocation = lastLocation {
                let distance = location.distance(from: lastLocation) / 1000.0 // Convert to km
                totalDistance += distance
            }
            
            lastLocation = location
            currentLocation = location
            
            // Update speed (convert from m/s to km/h)
            let speedMPS = max(0, location.speed)
            currentSpeed = speedMPS * 3.6
            
            // Send consolidated tracking activity (location + speed + distance)
            // This replaces the previous 3 separate API calls, reducing network overhead
            await sendActivity(
                type: .tracking,
                data: .tracking(TrackingData(
                    lat: location.coordinate.latitude,
                    long: location.coordinate.longitude,
                    accuracy: location.horizontalAccuracy,
                    timestamp: location.timestamp.timeIntervalSince1970 * 1000, // Convert to milliseconds
                    speed: currentSpeed > 1.0 ? currentSpeed : 0, // Only include speed above noise threshold
                    distance: totalDistance
                ))
            )
        }
    }
    
    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
    }
    
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            switch manager.authorizationStatus {
            case .authorizedAlways, .authorizedWhenInUse:
                print("Location permission granted")
            case .denied, .restricted:
                print("Location permission denied")
            case .notDetermined:
                print("Location permission not determined")
            @unknown default:
                break
            }
        }
    }
}

