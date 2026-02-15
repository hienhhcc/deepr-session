# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**deepr-session** is an Electron desktop application (early stage). Uses CommonJS modules.

## Tech Stack

- **Runtime**: Electron ^40.4.1
- **Module system**: CommonJS (`"type": "commonjs"`)
- **Package manager**: npm

## Commands

```bash
npm install          # Install dependencies
npx electron .      # Run the Electron app (entry point: index.js)
```

## Architecture

Project is in initial setup phase. The entry point is `index.js` (not yet created). Standard Electron app structure is expected:
- Main process: manages app lifecycle and creates BrowserWindow
- Renderer process: handles UI (HTML/CSS/JS)
- Preload script: bridges main and renderer processes securely
