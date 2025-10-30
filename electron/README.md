# Electron Desktop Application

This directory contains the Electron wrapper for the GitHub PR Management application.

## Structure

- `main.ts` - Main Electron process that creates and manages the browser window
- `preload.ts` - Preload script that safely exposes Electron APIs to the renderer
- `package.json` - Electron-specific dependencies and scripts
- `tsconfig.json` - TypeScript configuration for Electron code

## How It Works

The Electron app loads the built SvelteKit application from the `../build` directory via a local HTTP server. If the build doesn't exist, it displays a helpful error message.

## Development

### First-time setup

1. Install Electron dependencies:
```bash
npm run electron:install
```

### Building

Build the Electron TypeScript code:
```bash
npm run electron:build
```

### Running

**Development mode** (using built app):
1. Build both SvelteKit and Electron:
```bash
npm run build:electron
```

2. Run the Electron app:
```bash
npm run electron:start
```

Or use the combined command:
```bash
npm run app
```

## Packaging for Distribution

### Complete Build for macOS & Windows (Recommended)
```bash
npm run package:all
```
This command builds everything at once:
1. Builds SvelteKit application
2. Compiles Electron TypeScript code
3. Generates installers for both macOS (.dmg) and Windows (.exe)

### Windows (.exe)
```bash
npm run package:win
```

Output: `dist-electron/GPRM-Setup-X.X.X.exe`

### macOS (.dmg)
```bash
npm run package:mac
```

Output: `dist-electron/GPRM-X.X.X.dmg`

### Linux (.AppImage)
```bash
npm run package:linux
```

Output: `dist-electron/GPRM-X.X.X.AppImage`

### All Platforms (for current platform)
```bash
npm run package
```

## Packaging Requirements

- **Windows**: Can be built on Windows, macOS, or Linux
- **macOS**: Must be built on macOS (for code signing, use a Mac)
- **Linux**: Can be built on any platform

## Files

- `dist/` - Compiled JavaScript files (generated, should be in .gitignore)
- `main.ts` - Main process entry point
- `preload.ts` - Preload script for secure context bridge

## Notes

- The Electron app uses the same codebase as the web version
- No code duplication - Electron simply loads the built SvelteKit app
- External links are opened in the default browser for security
- The local HTTP server (port 5174) is only used to serve the built files
