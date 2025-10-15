# Environment Variables for iOS App

## Overview

The iOS app uses a **build-time script** to read environment variables from `packages/web-app/.env.local` and generate a Swift configuration file. This keeps credentials in sync between the web and iOS apps.

## How It Works

1. **Single source of truth**: All credentials live in `packages/web-app/.env.local`
2. **Build script**: `scripts/generate-config.sh` reads the `.env.local` file
3. **Generated file**: Creates `CheerioApp/Config.swift` with type-safe Swift code
4. **Auto-detection**: Automatically detects your Mac's IP for device builds

## Usage

### Generate Config File

From the iOS app directory:

```bash
yarn generate-config
```

Or from the monorepo root:

```bash
yarn workspace @cheerio/ios-app generate-config
```

### What Gets Generated

The script reads these environment variables:

#### Required:

- `NEXT_PUBLIC_SUPABASE_URL` → `Config.supabaseURL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `Config.supabaseAnonKey`

#### Optional:

- `API_PORT` (default: 3001) → Used in `Config.apiBaseURL`
- `NEXT_PUBLIC_THUNDERFOREST_API_KEY` → `Config.thunderforestAPIKey`

### Example .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_THUNDERFOREST_API_KEY=your-api-key-here
API_PORT=3001
```

## Generated Config.swift

The script generates a Swift file with:

```swift
struct Config {
    // Supabase credentials from .env.local
    static let supabaseURL = "https://yourproject.supabase.co"
    static let supabaseAnonKey = "eyJ..."

    // API URL with automatic simulator/device detection
    static let apiBaseURL: String = {
        #if targetEnvironment(simulator)
            return "http://localhost:3001"  // Simulator uses localhost
        #else
            return "http://10.0.3.35:3001"  // Device uses your Mac's IP
        #endif
    }()

    // Optional API keys
    static let thunderforestAPIKey: String? = "your-key"

    // Helper properties
    static var isSimulator: Bool { ... }
    static let generatedAt = "2025-10-15 16:39:16 UTC"
    static let localIP = "10.0.3.35"
}
```

## Xcode Build Phase Integration (Optional)

To automatically regenerate `Config.swift` on every build:

1. Open `CheerioApp.xcodeproj` in Xcode
2. Select your app target
3. Go to **Build Phases** tab
4. Click **+** → **New Run Script Phase**
5. Add this script:

```bash
# Auto-generate Config.swift from .env.local
cd "${SRCROOT}"
./scripts/generate-config.sh
```

6. Drag the script phase **before** "Compile Sources"
7. Build your project

Now `Config.swift` will be regenerated automatically on every build!

## Benefits

✅ **Single source of truth** - Credentials only in `.env.local`  
✅ **Type-safe** - Swift compiler catches typos  
✅ **Automatic IP detection** - Works on any network  
✅ **Simulator vs Device** - Automatic environment detection  
✅ **Version control safe** - `.env.local` is gitignored  
✅ **Build-time only** - No runtime overhead

## Troubleshooting

### Script fails with "Missing required environment variables"

**Solution**: Make sure `packages/web-app/.env.local` exists and has:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Device can't reach API at localhost

**Problem**: Physical devices can't use `localhost` to reach your Mac.

**Solution**: The script auto-detects your Mac's IP. Make sure:

1. Both Mac and device are on the same Wi-Fi network
2. Your firewall allows incoming connections to Node.js
3. Web app is running: `yarn dev:web`

### Wrong IP address detected

**Solution**: Edit the generated `Config.swift` manually or add custom IP detection:

```bash
# In generate-config.sh, force a specific IP:
LOCAL_IP="192.168.1.100"
```

### Want to use production API instead of local

**Solution**: Add this to `.env.local`:

```bash
# For production builds
API_BASE_URL_PRODUCTION=https://api.cheerio.app
```

Then update the script to use it when building for release.

## Security Notes

- ⚠️ **Never commit** `Config.swift` if it contains real credentials
- ⚠️ **Never commit** `.env.local`
- ✅ **Do commit** `env.local.example` with placeholder values
- ✅ **Do commit** the generation script

## Advanced: Multiple Environments

To support dev/staging/production:

1. Create multiple env files:
   - `.env.local` (development)
   - `.env.staging`
   - `.env.production`

2. Update the script to accept an environment parameter:

   ```bash
   ./scripts/generate-config.sh production
   ```

3. Use Xcode build configurations to run different scripts

## Files

- **Source**: `packages/web-app/.env.local`
- **Script**: `packages/ios-app/scripts/generate-config.sh`
- **Output**: `packages/ios-app/CheerioApp/Config.swift`
- **This guide**: `packages/ios-app/ENV-VARIABLES.md`
