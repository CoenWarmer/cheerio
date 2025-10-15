# Quick Setup Guide - Auto-Generate Config

## 🎯 Goal

Make `Config.swift` automatically regenerate from `.env.local` every time you build in Xcode.

---

## 📋 Manual Setup (5 minutes)

### 1. Open Xcode

```bash
open packages/ios-app/CheeriooApp.xcodeproj
```

### 2. Navigate to Build Phases

```
Click: CheeriooApp (in sidebar)
   ↓
Click: CheeriooApp target (under TARGETS)
   ↓
Click: Build Phases tab (at top)
```

### 3. Add Run Script

```
Click: + button (top left)
   ↓
Select: "New Run Script Phase"
   ↓
Paste this script:
```

```bash
# Auto-generate Config.swift from .env.local
echo "🔄 Generating Config.swift from .env.local..."
cd "${SRCROOT}"
./scripts/generate-config.sh
```

### 4. Move Script Phase

```
Drag: "Run Script" phase
   ↓
Drop: Above "Compile Sources"
```

### 5. Optional: Add Caching

```
Expand: Input Files
   ↓
Add: $(SRCROOT)/../web-app/.env.local

Expand: Output Files
   ↓
Add: $(SRCROOT)/CheeriooApp/Config.swift
```

### 6. Test

```
Press: Cmd+B (Build)
   ↓
Check: Build log for "✅ Config.swift generated successfully!"
```

---

## 🤖 Automated Setup (Advanced)

**Warning**: This modifies your Xcode project file. Commit first!

```bash
cd packages/ios-app
./scripts/setup-xcode-build-phase.sh
```

The script will:

- ✅ Backup your project file
- ✅ Add the build phase automatically
- ✅ Configure input/output files
- ✅ Ask for confirmation first

---

## ✅ Verification

After setup, build your project:

```
Cmd+B
```

**Expected output in build log:**

```
📝 Generating Config.swift from .env.local...
✅ Config.swift generated successfully!
   Supabase URL: https://...
   Local IP: 10.0.3.35
   Output: /path/to/Config.swift
```

---

## 🎨 Visual Guide

### Before (Manual Generation)

```
┌─────────────────────────────┐
│  Edit .env.local            │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│  Run: yarn generate-config  │  ← Manual step
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│  Build in Xcode (Cmd+B)     │
└─────────────────────────────┘
```

### After (Automatic)

```
┌─────────────────────────────┐
│  Edit .env.local            │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│  Build in Xcode (Cmd+B)     │  ← Automatic!
│                             │
│  ├─ Generate Config (script)│
│  ├─ Compile Sources         │
│  ├─ Link Libraries          │
│  └─ Build Complete          │
└─────────────────────────────┘
```

---

## 🔄 What Happens on Build

```
1. Xcode starts build
         ↓
2. Run Script Phase executes
         ↓
3. generate-config.sh runs
         ↓
4. Reads .env.local
         ↓
5. Detects Mac IP (10.0.3.35)
         ↓
6. Generates Config.swift
         ↓
7. Swift compiler uses new config
         ↓
8. App builds with latest values
         ↓
9. ✅ Done!
```

---

## 📚 Documentation

- **Detailed Guide**: See `XCODE-BUILD-PHASE.md`
- **Environment Variables**: See `ENV-VARIABLES.md`
- **Quick Start**: See `CONFIG-SETUP.md`

---

## 🆘 Troubleshooting

### Build fails with "script not found"

```bash
cd packages/ios-app
chmod +x scripts/generate-config.sh
```

### Build fails with "missing env variables"

```bash
cp packages/web-app/env.local.example packages/web-app/.env.local
# Then edit .env.local with your credentials
```

### Config doesn't update

- Check that script is **above** "Compile Sources"
- Clean build folder: Cmd+Shift+K
- Rebuild: Cmd+B

---

## 🎉 Benefits

✅ **No manual steps** - Config always in sync  
✅ **Team-friendly** - Everyone gets same setup  
✅ **Error prevention** - Build fails if config invalid  
✅ **Fast builds** - Only runs when .env changes (with caching)

---

## 🔙 Reverting

To go back to manual generation:

1. Open Xcode → Build Phases
2. Delete "Generate Config from .env" phase
3. Run `yarn generate-config` manually when needed
