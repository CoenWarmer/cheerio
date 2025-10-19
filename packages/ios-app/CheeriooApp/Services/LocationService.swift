import Foundation
import CoreLocation
import Supabase
import Network

// Stored activity for offline queue
struct StoredActivity: Codable {
    let id: String
    let eventSlug: String
    let type: ActivityType
    let data: ActivityData
    let timestamp: Date
}

@MainActor
class LocationService: NSObject, ObservableObject {
    @Published var isTracking = false
    @Published var currentSpeed: Double = 0.0 // km/h
    @Published var totalDistance: Double = 0.0 // km
    @Published var trackingDuration: TimeInterval = 0
    @Published var currentLocation: CLLocation?
    @Published var isOnline = true
    @Published var pendingActivitiesCount = 0
    
    private let locationManager = CLLocationManager()
    private let supabase: SupabaseClient
    private var lastLocation: CLLocation?
    private var startTime: Date?
    private var timer: Timer?
    private var currentEventSlug: String?
    
    // Offline support
    private var activityQueue: [StoredActivity] = []
    private let queueKey = "com.cheerioo.activityQueue"
    private let networkMonitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "NetworkMonitor")
    private var isProcessingQueue = false
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
        super.init()
        
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10 // meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        
        // Load persisted queue
        loadQueue()
        
        // Start network monitoring
        startNetworkMonitoring()
    }
    
    deinit {
        networkMonitor.cancel()
    }
    
    // MARK: - Network Monitoring
    
    private func startNetworkMonitoring() {
        networkMonitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                
                let wasOffline = !self.isOnline
                self.isOnline = path.status == .satisfied
                
                print("📡 Network status: \(self.isOnline ? "Online" : "Offline")")
                
                // If we just came back online and have pending activities, process them
                if wasOffline && self.isOnline && !self.activityQueue.isEmpty {
                    print("📤 Connection restored! Processing \(self.activityQueue.count) pending activities...")
                    await self.processQueue()
                }
            }
        }
        networkMonitor.start(queue: monitorQueue)
    }
    
    // MARK: - Queue Management
    
    private func loadQueue() {
        if let data = UserDefaults.standard.data(forKey: queueKey),
           let queue = try? JSONDecoder().decode([StoredActivity].self, from: data) {
            activityQueue = queue
            pendingActivitiesCount = queue.count
            print("📦 Loaded \(queue.count) activities from local storage")
        }
    }
    
    private func saveQueue() {
        if let data = try? JSONEncoder().encode(activityQueue) {
            UserDefaults.standard.set(data, forKey: queueKey)
            pendingActivitiesCount = activityQueue.count
        }
    }
    
    private func addToQueue(eventSlug: String, type: ActivityType, data: ActivityData) {
        let stored = StoredActivity(
            id: UUID().uuidString,
            eventSlug: eventSlug,
            type: type,
            data: data,
            timestamp: Date()
        )
        
        activityQueue.append(stored)
        saveQueue()
        
        print("💾 Queued activity (total: \(activityQueue.count))")
    }
    
    private func processQueue() async {
        guard !isProcessingQueue && !activityQueue.isEmpty && isOnline else {
            return
        }
        
        isProcessingQueue = true
        
        print("🔄 Processing queue: \(activityQueue.count) activities...")
        
        var failedActivities: [StoredActivity] = []
        
        for activity in activityQueue {
            let success = await sendActivityDirect(
                eventSlug: activity.eventSlug,
                type: activity.type,
                data: activity.data
            )
            
            if !success {
                // Keep failed activities in queue
                failedActivities.append(activity)
                
                // If we encounter a failure, stop processing to avoid overwhelming the server
                if !isOnline {
                    // Add remaining activities back to failed list
                    if let currentIndex = activityQueue.firstIndex(where: { $0.id == activity.id }),
                       currentIndex < activityQueue.count - 1 {
                        failedActivities.append(contentsOf: activityQueue[(currentIndex + 1)...])
                    }
                    break
                }
            } else {
                print("✅ Successfully sent queued activity: \(activity.id)")
            }
        }
        
        // Update queue with only failed activities
        activityQueue = failedActivities
        saveQueue()
        
        isProcessingQueue = false
        
        if activityQueue.isEmpty {
            print("✅ All queued activities sent successfully!")
        } else {
            print("⚠️ \(activityQueue.count) activities remain in queue")
        }
    }
    
    func requestPermission() {
        locationManager.requestAlwaysAuthorization()
    }
    
    func startTracking(eventSlug: String) async {
        self.currentEventSlug = eventSlug
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
        currentEventSlug = nil
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
    
    // MARK: - Activity Sending
    
    private func sendActivity(type: ActivityType, data: ActivityData) async {
        guard let eventSlug = currentEventSlug else {
            return
        }
        
        // Try to send immediately if online
        if isOnline {
            let success = await sendActivityDirect(
                eventSlug: eventSlug,
                type: type,
                data: data
            )
            
            // If failed and offline, queue it
            if !success {
                addToQueue(eventSlug: eventSlug, type: type, data: data)
            }
        } else {
            // Offline: queue immediately
            print("📴 Offline: queuing activity")
            addToQueue(eventSlug: eventSlug, type: type, data: data)
        }
    }
    
    private func sendActivityDirect(eventSlug: String, type: ActivityType, data: ActivityData) async -> Bool {
        let url = URL(string: "\(Config.apiBaseURL)/api/events/\(eventSlug)/activity")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10 // 10 second timeout
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        let activity = Activity(activityType: type, data: data)
        request.httpBody = try? JSONEncoder().encode(activity)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                if (200...299).contains(httpResponse.statusCode) {
                    return true
                } else {
                    print("❌ Failed to send activity: \(httpResponse.statusCode)")
                    if let responseString = String(data: data, encoding: .utf8) {
                        print("Response: \(responseString)")
                    }
                    return false
                }
            }
            return false
        } catch {
            print("❌ Error sending activity: \(error.localizedDescription)")
            return false
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

