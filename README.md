# Cheerio Monorepo

A yarn workspaces monorepo containing multiple applications.

## 📦 Packages

### `@cheerio/web-app`
Next.js web application with TypeScript, ESLint, and Tailwind CSS.

**Location:** `packages/web-app/`

**Tech Stack:**
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Turbopack

### `@cheerio/ios-app`
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
```

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
2. Open `CheerioApp.xcodeproj` in Xcode
3. Select a simulator or device
4. Press `Cmd + R` to build and run

## 📁 Project Structure

```
cheerio-monorepo/
├── packages/
│   ├── web-app/          # Next.js web application
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── ios-app/          # Native iOS application
│       ├── CheerioApp/   # Swift source files
│       ├── CheerioApp.xcodeproj/
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

