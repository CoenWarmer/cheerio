import Foundation
import AVFoundation
import Supabase
import VLCKitSPM

@MainActor
class AudioService: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var isPlaying = false
    
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var vlcPlayer: VLCMediaPlayer?
    private let supabase: SupabaseClient
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
        super.init()
        configureAudioSession()
    }
    
    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            // Configure for mixing with other audio - this is the global default
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
            print("🔊 Global audio session configured for mixing")
        } catch {
            print("❌ Failed to configure global audio session: \(error)")
        }
    }
    
    func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
    
    func startRecording() throws {
        let audioFilename = getDocumentsDirectory().appendingPathComponent("recording-\(UUID().uuidString).m4a")
        
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            AVEncoderBitRateKey: 128000
        ]
        
        audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
        audioRecorder?.record()
        isRecording = true
    }
    
    func stopRecording() -> URL? {
        audioRecorder?.stop()
        isRecording = false
        return audioRecorder?.url
    }
    
    func uploadAudio(fileURL: URL, eventSlug: String) async throws -> [String: Any] {
        let url = URL(string: "\(Config.apiBaseURL)/api/attachments/upload")!
        
        // Create multipart form data
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let session = try? await supabase.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        
        // Add event_slug field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"room_slug\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(eventSlug)\r\n".data(using: .utf8)!)
        
        // Add file field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.m4a\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/mp4\r\n\r\n".data(using: .utf8)!)
        body.append(try Data(contentsOf: fileURL))
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        let uploadResponse = try JSONDecoder().decode(UploadResponse.self, from: data)
        
        // Return the full attachment object as a dictionary
        return [
            "type": uploadResponse.attachment.type,
            "url": uploadResponse.attachment.url,
            "filename": uploadResponse.attachment.filename,
            "mimeType": uploadResponse.attachment.mimeType,
            "size": uploadResponse.attachment.size
        ]
    }
    
    func playAudio(from urlString: String) async {
        guard let url = URL(string: urlString) else {
            print("Invalid audio URL: \(urlString)")
            return
        }
        
        print("Playing audio from: \(urlString)")
        
        // Check if it's a WebM file (fallback to VLC)
        let isWebM = urlString.contains(".webm")
        
        if isWebM {
            // Use VLCKit for WebM playback (legacy support)
            print("⚠️ Using VLCKit for WebM playback (legacy)")
            playWithVLC(url: url)
        } else {
            // Use AVAudioPlayer for M4A/MP3/WAV (better audio mixing support)
            print("✅ Using AVAudioPlayer for native format (M4A/MP3/WAV)")
            await playWithAVFoundation(url: url)
        }
    }
    
    private func playWithVLC(url: URL) {
        // Stop any existing playback
        audioPlayer?.stop()
        vlcPlayer?.stop()
        
        // Configure audio session with explicit mixing
        do {
            let session = AVAudioSession.sharedInstance()
            // Try playback category with mixWithOthers option
            // This should allow VLC to play alongside other audio
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true, options: [])
            print("✅ Audio session configured: .playback + .mixWithOthers")
        } catch {
            print("❌ Failed to configure audio session: \(error)")
        }
        
        // Give the audio session a moment to take effect
        Thread.sleep(forTimeInterval: 0.1)
        
        // Create VLC media and player
        let media = VLCMedia(url: url)
        vlcPlayer = VLCMediaPlayer()
        vlcPlayer?.media = media
        vlcPlayer?.delegate = self
        
        // Configure VLC audio if possible
        print("🎬 Starting VLC playback...")
        
        // Play
        vlcPlayer?.play()
        isPlaying = true
        print("▶️ VLC playback started")
    }
    
    private func playWithAVFoundation(url: URL) async {
        do {
            // Download audio file
            let (data, _) = try await URLSession.shared.data(from: url)
            
            // Determine file extension
            let fileExtension: String
            if url.absoluteString.contains(".m4a") {
                fileExtension = "m4a"
            } else if url.absoluteString.contains(".mp3") {
                fileExtension = "mp3"
            } else {
                fileExtension = "m4a"
            }
            
            // Save temporarily
            let tempURL = getDocumentsDirectory().appendingPathComponent("temp-\(UUID().uuidString).\(fileExtension)")
            try data.write(to: tempURL)
            
            // Configure audio session to play alongside other audio
            let session = AVAudioSession.sharedInstance()
            // Use playback category with mixWithOthers to play alongside other audio
            try session.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
            try session.setActive(true, options: [])
            print("🎵 Audio session configured: .playback + .mixWithOthers + .spokenAudio")
            
            // Stop any existing playback
            audioPlayer?.stop()
            vlcPlayer?.stop()
            
            // Play audio
            audioPlayer = try AVAudioPlayer(contentsOf: tempURL)
            audioPlayer?.delegate = self
            audioPlayer?.play()
            isPlaying = true
            print("AVAudioPlayer playback started")
        } catch {
            print("Failed to play audio: \(error)")
        }
    }
    
    private func getDocumentsDirectory() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}

extension AudioService: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            isPlaying = false
            // No need to deactivate since we're mixing with other audio
        }
    }
}

extension AudioService: VLCMediaPlayerDelegate {
    nonisolated func mediaPlayerStateChanged(_ aNotification: Notification) {
        Task { @MainActor in
            guard let player = aNotification.object as? VLCMediaPlayer else { return }
            
            switch player.state {
            case .ended, .stopped, .error:
                isPlaying = false
                print("VLC playback ended")
                // No need to deactivate since we're mixing with other audio
            case .playing:
                print("VLC is playing")
            default:
                break
            }
        }
    }
}

struct UploadResponse: Codable {
    let success: Bool
    let attachment: UploadAttachment
}

struct UploadAttachment: Codable {
    let type: String
    let url: String
    let filename: String
    let mimeType: String
    let size: Int
}

