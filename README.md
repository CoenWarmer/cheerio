# Cheerioo Monorepo

A yarn workspaces monorepo containing multiple applications.

## 📦 Packages

### `@cheerioo/web-app`

Next.js web application with TypeScript, ESLint, and Tailwind CSS.

**Location:** `packages/web-app/`

**Tech Stack:**

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Turbopack

### `@cheerioo/ios-app`

Native iOS application built with Swift and SwiftUI.

**Location:** `packages/ios-app/`

**Tech Stack:**

- Swift 5.0
- SwiftUI
- iOS 17.0+

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- For iOS development: Xcode 15+ (macOS only)

### Installation

```bash
# Install all dependencies
yarn install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

## 🔐 Configuration

The monorepo uses a shared `.env.local` file at the root for configuration:

```bash
# .env.local (create from .env.local.example)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

This configuration is shared across:

- ✅ Web app (Next.js reads it automatically)
- ✅ iOS app (via `yarn generate-config` script)

See `packages/ios-app/CONFIG-SETUP.md` for iOS configuration details.

## 📱 Development

### Web App

```bash
# Start the Next.js development server
yarn dev:web

# Build for production
yarn build:web

# Start production server
yarn start:web

# Run linter
yarn lint:web
```

The web app will be available at http://localhost:3000

### iOS App

The iOS app must be opened and run through Xcode:

1. Navigate to `packages/ios-app/`
2. Open `CheeriooApp.xcodeproj` in Xcode
3. Select a simulator or device
4. Press `Cmd + R` to build and run

## 📁 Project Structure

```
cheerioo-monorepo/
├── packages/
│   ├── web-app/          # Next.js web application
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── ios-app/          # Native iOS application
│       ├── CheeriooApp/   # Swift source files
│       ├── CheeriooApp.xcodeproj/
│       └── package.json  # (workspace compatibility only)
├── package.json          # Root workspace configuration
└── README.md
```

## 🔧 Workspace Configuration

This monorepo uses Yarn Workspaces for managing dependencies across packages. The root `package.json` defines the workspace structure and provides convenience scripts for running commands in specific packages.

## 📝 Notes

- The web-app uses yarn for dependency management
- The ios-app is a native Swift/SwiftUI project and uses Xcode/Swift Package Manager for dependencies
- Both packages are kept separate with no shared code (as per initial setup)

## 📄 License

See [LICENSE](LICENSE) file for details.
