# Migration: .env.local to Repo Root

## What Changed

The `.env.local` file can now be placed at the repo root instead of in `packages/web-app/`. This makes it easier to share configuration across all packages.

## Migration Steps

### If you already have .env.local in web-app

```bash
# From repo root
cp packages/web-app/.env.local .env.local

# Optional: Keep the web-app version as backup or remove it
# The script will use repo root first, then fallback to web-app
```

### For new setup

```bash
# From repo root
cp .env.local.example .env.local
# Then edit with your credentials
```

## What the Script Does Now

The `generate-config.sh` script looks for `.env.local` in this order:

1. **`/cheerio/.env.local`** (repo root) - **Preferred**
2. **`packages/web-app/.env.local`** - Fallback

You'll see which location is being used in the script output:

```
📝 Generating Config.swift from .env.local (repo root)...
```

or

```
📝 Generating Config.swift from .env.local (web-app)...
```

## Benefits of Repo Root

✅ **Single configuration** - All packages can use the same .env file  
✅ **Easier setup** - New developers copy one file, not multiple  
✅ **Cleaner structure** - Configuration at top level, not buried in packages  
✅ **Future-proof** - Easy to add more packages that need the same config

## Backward Compatibility

✅ **Existing setups still work** - The script falls back to web-app location  
✅ **No breaking changes** - Both locations supported  
✅ **Gradual migration** - Move when convenient

## Xcode Build Phase

If you've set up auto-generation in Xcode, the input files now include both locations:

- `$(SRCROOT)/../../.env.local` (repo root)
- `$(SRCROOT)/../web-app/.env.local` (fallback)

No changes needed to your Xcode project!

## Updated Files

- ✅ `scripts/generate-config.sh` - Now checks both locations
- ✅ `scripts/setup-xcode-build-phase.sh` - Includes both paths
- ✅ `.env.local.example` - Created at repo root
- ✅ All documentation updated

## Questions?

See updated documentation:

- [CONFIG-SETUP.md](./CONFIG-SETUP.md)
- [README.md](./README.md)
- [ENV-VARIABLES.md](./ENV-VARIABLES.md)
