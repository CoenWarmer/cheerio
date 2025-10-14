# Cheerio iOS App

A native iOS application built with Swift and SwiftUI.

## Requirements

- Xcode 15.0 or later
- iOS 17.0 or later
- macOS for development

## Getting Started

1. Open `CheerioApp.xcodeproj` in Xcode
2. Select a simulator or connected device
3. Press `Cmd + R` to build and run

## Project Structure

```
ios-app/
├── CheerioApp/
│   ├── CheerioAppApp.swift    # App entry point
│   ├── ContentView.swift       # Main view
│   └── Assets.xcassets/        # App assets and icons
├── CheerioApp.xcodeproj/       # Xcode project file
└── README.md                   # This file
```

## Notes

This is a native Swift/SwiftUI project and does not use npm or yarn for dependencies. All iOS dependencies should be managed through Swift Package Manager in Xcode.

The `package.json` file exists only for monorepo workspace compatibility.

