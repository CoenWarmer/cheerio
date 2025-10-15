# iOS Configuration Summary

## ✅ Environment Variables Now Working!

Your iOS app now reads configuration from a shared `.env.local` file at the repo root (or web-app as fallback).

## Quick Start

```bash
# From ios-app directory or monorepo root
yarn generate-config
```

This generates `Config.swift` with:

- ✅ Supabase credentials from `.env.local`
- ✅ Auto-detected Mac IP for device builds
- ✅ Simulator vs device detection
- ✅ Optional API keys (Thunderforest, etc.)

## .env.local Location

The script looks for `.env.local` in this order:

1. **`/cheerio/.env.local`** (repo root) - **Recommended** ✨
2. **`packages/web-app/.env.local`** (fallback)

**Why repo root?** Makes it easier to share configuration across all packages (web-app, ios-app, etc.)

## Files Created/Modified

### New Files

1. **`scripts/generate-config.sh`** - Bash script that reads `.env.local` and generates Swift
2. **`CheerioApp/Config.swift.example`** - Template config (safe to commit)
3. **`ENV-VARIABLES.md`** - Comprehensive documentation
4. **`.gitignore`** - Updated to ignore generated `Config.swift`

### Modified Files

1. **`package.json`** - Added `generate-config` script
2. **`README.md`** - Updated quick start instructions

## How It Works

```
.env.local (repo root or web-app)
      ↓
generate-config.sh (reads env vars)
      ↓
Config.swift (generated Swift code)
      ↓
Xcode builds with config
```

## Benefits

- 🔄 **Stays in sync** - One source of truth for credentials
- 🏗️ **Build-time** - No runtime overhead
- 🔒 **Type-safe** - Swift compiler catches errors
- 📱 **Smart detection** - Automatic simulator/device URLs
- 🚫 **Git-safe** - Generated file is ignored

## Usage in Swift Code

```swift
// Supabase client
let client = SupabaseClient(
    supabaseURL: URL(string: Config.supabaseURL)!,
    supabaseKey: Config.supabaseAnonKey
)

// API calls
let url = "\(Config.apiBaseURL)/api/rooms/\(slug)/activity"

// Check environment
if Config.isSimulator {
    print("Running in simulator")
}

// Optional keys
if let mapKey = Config.thunderforestAPIKey {
    // Use map API key
}
```

## Next Steps

### Optional: Auto-generate on every build

1. Open `CheerioApp.xcodeproj` in Xcode
2. Target → Build Phases → + → New Run Script Phase
3. Add script:
   ```bash
   cd "${SRCROOT}"
   ./scripts/generate-config.sh
   ```
4. Drag before "Compile Sources"

Now it regenerates automatically! 🎉

### Optional: Support multiple environments

See `ENV-VARIABLES.md` for:

- Dev/staging/production configs
- Custom IP detection
- Production API URLs
- Advanced build configurations

## Troubleshooting

**"Missing required environment variables"**
→ Create `.env.local` at repo root:

```bash
cp .env.local.example .env.local
# Then edit with your Supabase credentials
```

Or use the web-app location:

```bash
cp packages/web-app/env.local.example packages/web-app/.env.local
```

**Device can't reach API**
→ Make sure Mac and device are on same Wi-Fi

**Wrong IP detected**
→ Check output of script, manually edit if needed

See `ENV-VARIABLES.md` for detailed troubleshooting.
