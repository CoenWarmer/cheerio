# Auto-Generate Config on Every Xcode Build

This guide shows you how to automatically regenerate `Config.swift` from `.env.local` every time you build your iOS app in Xcode.

## Benefits

✅ **Always up-to-date** - Config regenerates on every build  
✅ **No manual steps** - Forget about running `yarn generate-config`  
✅ **Team-friendly** - Every developer gets the same setup  
✅ **Fail-safe** - Build fails if `.env.local` is missing or invalid

---

## Option 1: Manual Setup in Xcode (Recommended)

### Step-by-Step Instructions

1. **Open your project in Xcode**

   ```bash
   open packages/ios-app/CheerioApp.xcodeproj
   ```

2. **Select your app target**
   - Click on `CheerioApp` in the Project Navigator (left sidebar)
   - Make sure the `CheerioApp` target is selected (not the project)

3. **Go to Build Phases**
   - Click the "Build Phases" tab at the top
   - You'll see sections like "Dependencies", "Compile Sources", "Link Binary"

4. **Add a new Run Script Phase**
   - Click the `+` button in the top-left of the Build Phases section
   - Select **"New Run Script Phase"**
   - A new section called "Run Script" will appear at the bottom

5. **Configure the script**
   - Expand the "Run Script" section by clicking the disclosure triangle
   - In the script text area, paste this:

   ```bash
   # Auto-generate Config.swift from .env.local
   echo "🔄 Generating Config.swift from .env.local..."
   cd "${SRCROOT}"
   ./scripts/generate-config.sh
   ```

6. **Rename the phase (optional but recommended)**
   - Double-click on "Run Script" text
   - Rename it to: **"Generate Config from .env"**

7. **Move it before "Compile Sources"**
   - Drag the new script phase **above** the "Compile Sources" section
   - This ensures Config.swift is generated before Swift tries to compile it

8. **Configure input/output files (optional, for better caching)**
   - Expand "Input Files" section
   - Click `+` and add: `$(SRCROOT)/../../.env.local` (repo root - recommended)
   - Click `+` and add: `$(SRCROOT)/../web-app/.env.local` (fallback)
   - Expand "Output Files" section
   - Click `+` and add: `$(SRCROOT)/CheerioApp/Config.swift`
   - This helps Xcode know when to skip the script (if .env hasn't changed)

9. **Test it!**
   - Build your project: **Cmd+B**
   - Check the build log for: `✅ Config.swift generated successfully!`
   - If you see that message, it's working! 🎉

### Visual Guide

Your Build Phases should look like this:

```
Build Phases:
  ├─ Dependencies
  ├─ [Run Script] Generate Config from .env  ⬅️ Your new script
  ├─ Compile Sources (XX items)
  ├─ Link Binary With Libraries
  └─ Copy Bundle Resources
```

---

## Option 2: Automated Setup (Advanced)

If you want to add the build phase programmatically:

```bash
cd packages/ios-app
./scripts/setup-xcode-build-phase.sh
```

This script will:

- ✅ Parse your `project.pbxproj` file
- ✅ Add the build script phase automatically
- ✅ Configure input/output files
- ✅ Place it before "Compile Sources"

**Note**: This modifies Xcode project files. Make sure to commit your changes first!

---

## Verification

After setup, every time you build:

1. **Check Build Log**
   - Open Report Navigator: **Cmd+9**
   - Click on your latest build
   - Look for "Generate Config from .env" phase
   - Should show: `✅ Config.swift generated successfully!`

2. **Test Changes**
   - Modify `.env.local` (at repo root or in web-app)
   - Build in Xcode: **Cmd+B**
   - Check that `Config.swift` has updated values

3. **Test Error Handling**
   - Temporarily rename `.env.local` to `.env.local.backup`
   - Try to build
   - Should see error: `❌ Error: .env.local not found`
   - Rename it back

---

## Troubleshooting

### ❌ "Command not found: ./scripts/generate-config.sh"

**Problem**: Script path is incorrect or not executable

**Solution**:

```bash
cd packages/ios-app
chmod +x scripts/generate-config.sh
```

### ❌ "Missing required environment variables"

**Problem**: `.env.local` doesn't exist or is missing values

**Solution**:

```bash
# Copy the example file to repo root (recommended)
cp .env.local.example .env.local



# Then fill in your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### ⚠️ Script runs but Config.swift doesn't update

**Problem**: Output file path is wrong

**Solution**: Check that the script output matches your project structure:

```bash
# In generate-config.sh, verify OUTPUT_FILE path:
OUTPUT_FILE="$IOS_APP_DIR/CheerioApp/Config.swift"
```

### 🐢 Builds are slower

**Problem**: Script runs on every build, even when .env hasn't changed

**Solution**: Add input/output files (step 8 above) to enable Xcode caching

---

## Advanced: Conditional Generation

If you only want to generate on Debug builds (not Release):

```bash
# In the Run Script phase, use:
if [ "${CONFIGURATION}" == "Debug" ]; then
  echo "🔄 Generating Config.swift from .env.local..."
  cd "${SRCROOT}"
  ./scripts/generate-config.sh
else
  echo "ℹ️ Skipping config generation (Release build)"
fi
```

---

## Advanced: Multiple Environments

To support dev/staging/production configs:

1. **Create multiple env files**:
   - `.env.local` (development)
   - `.env.staging`
   - `.env.production`

2. **Create Xcode configurations**:
   - Project → Info → Configurations
   - Duplicate "Debug" → rename to "Staging"
   - Duplicate "Release" → rename to "Production"

3. **Update the script**:

   ```bash
   # In Run Script phase:
   ENV_FILE=".env.local"  # default

   if [ "${CONFIGURATION}" == "Staging" ]; then
     ENV_FILE=".env.staging"
   elif [ "${CONFIGURATION}" == "Production" ]; then
     ENV_FILE=".env.production"
   fi

   cd "${SRCROOT}"
   ./scripts/generate-config.sh "$ENV_FILE"
   ```

4. **Update generate-config.sh** to accept an environment parameter

---

## Removing Auto-Generation

If you want to go back to manual generation:

1. Open Xcode → CheerioApp target → Build Phases
2. Find "Generate Config from .env" script phase
3. Click the `-` button to delete it
4. Run `yarn generate-config` manually when needed

---

## Team Setup

When a new developer joins:

1. **Clone the repo**
2. **Copy .env.local**:

   ```bash
   # At repo root (recommended)
   cp .env.local.example .env.local
   # Fill in actual values

   # Or at web-app location
   cp packages/web-app/env.local.example packages/web-app/.env.local
   ```

3. **Open in Xcode** - Build phase is already configured!
4. **Build** - Config.swift generates automatically

---

## Summary

After this setup:

```
Every Xcode Build (Cmd+B)
         ↓
Run Script Phase executes
         ↓
generate-config.sh reads .env.local
         ↓
Config.swift regenerated
         ↓
Swift compiler uses fresh config
         ↓
✅ App builds with latest values
```

No more manual `yarn generate-config` needed! 🎉
