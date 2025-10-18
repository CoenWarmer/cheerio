# Netlify Deployment Guide

## FFmpeg in Netlify Functions

This app uses FFmpeg to convert audio files (WebM → M4A) in Next.js API routes, which run as Netlify Functions in production.

### ✅ Setup Complete

The app is already configured to work with Netlify Functions:

1. **`@ffmpeg-installer/ffmpeg`** is installed
   - Provides pre-compiled FFmpeg binaries for AWS Lambda/Netlify Functions
   - Automatically bundles with your functions

2. **`audio-converter.ts`** is configured
   - Uses the bundled FFmpeg binary
   - Works in serverless environments

### 🚀 Deployment Steps

#### 1. Environment Variables

Make sure all environment variables from `.env.local` are set in Netlify:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API
CHEERIOO_API_URL=https://your-domain.netlify.app
```

**How to set in Netlify:**

1. Go to your site dashboard
2. Navigate to **Site settings → Environment variables**
3. Add each variable from your `.env.local` file

#### 2. Build Settings

Netlify should auto-detect Next.js, but verify these settings:

```toml
[build]
  command = "npm run build"
  publish = ".next"
```

**In Netlify Dashboard:**

- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Functions directory:** `.netlify/functions` (auto-detected)

#### 3. Next.js on Netlify

Netlify automatically:

- Converts Next.js API routes to Netlify Functions
- Bundles dependencies (including FFmpeg binary)
- Handles serverless function packaging

No additional configuration needed! 🎉

### 📦 Function Size Considerations

The FFmpeg binary adds ~40-50MB to your function bundle. Netlify Functions have:

- **Max function size:** 50MB (zipped)
- **Max unzipped size:** 250MB

Our setup is within these limits.

### 🧪 Testing Locally

To test the FFmpeg conversion locally:

1. **Start the dev server:**

   ```bash
   npm run dev
   ```

2. **Record a voice message** in the web app (Chrome/Firefox)

3. **Check the server logs** for conversion output:
   ```
   📁 File: recording.webm | Type: audio/webm; codecs=opus
   🔄 Converting WebM to M4A for better compatibility...
   ✅ Conversion successful!
   ```

### 🐛 Troubleshooting

#### Issue: "Cannot find ffmpeg"

- **Local dev:** Install FFmpeg via Homebrew: `brew install ffmpeg`
- **Production:** The `@ffmpeg-installer/ffmpeg` package handles this automatically

#### Issue: Function timeout

- **Default timeout:** 10 seconds (can be increased to 26s on Pro plans)
- Audio conversion typically takes 1-3 seconds
- If timing out, consider:
  - Reducing audio quality/bitrate
  - Using a different service (Cloudinary, Mux, etc.)

#### Issue: Function size too large

- Check bundle size: `npm run build`
- If needed, exclude unnecessary dependencies from API routes

### 🔄 Alternative: External Conversion Service

If you encounter issues with FFmpeg in Netlify Functions, consider using:

1. **Cloudinary** (Free tier available)
   - Upload raw WebM
   - Cloudinary converts to M4A automatically
   - Return converted URL

2. **AWS Lambda with EFS** (More complex)
   - Store FFmpeg on EFS
   - Lambda mounts EFS
   - No function size limits

3. **Dedicated Media Service** (Mux, Vonage, etc.)
   - Purpose-built for media processing
   - Higher cost, but more reliable

### 📊 Monitoring

Monitor your Netlify Functions:

1. **Dashboard → Functions**
2. Check:
   - Invocations
   - Errors
   - Duration
   - Bandwidth

Audio conversion should take **1-3 seconds** per message.

---

## Summary

✅ **Current Setup:** Ready for Netlify deployment  
✅ **FFmpeg:** Bundled via `@ffmpeg-installer/ffmpeg`  
✅ **Works in:** Netlify Functions, AWS Lambda, Vercel, etc.  
✅ **No additional config needed**

Just deploy to Netlify and it should work! 🚀
