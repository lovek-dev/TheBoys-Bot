# Discord Music Bot

## Overview

A feature-rich Discord bot built with Discord.js v14 that provides music playback from YouTube and Spotify, along with server moderation tools and utility commands. The bot supports slash commands for music playback, traditional prefix commands for moderation, and includes a custom setup system for server rules and welcome messages.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**February 23, 2026** - Imported to Replit environment:
- Configured Node.js 20 runtime
- Set up npm dependencies
- Configured workflow to run `node index.js` with Express keepalive on port 5000
- Configured deployment as VM (always-on) for bot uptime
- Bot requires `TOKEN` environment variable (Discord bot token) to connect

**November 14, 2025** - Fixed moderation command bugs and added role hierarchy validation:
- Fixed kick command bug where it was passing the wrong parameter (args[0] instead of reason)
- Added role hierarchy checks to both kick and ban commands
- Added comprehensive error handling with try-catch blocks and clear error messages

## System Architecture

### Bot Framework

**Core Technology:** Discord.js v14 with full gateway intents and partials support.

**Dual Command System:**
- **Slash Commands** - Music commands (`/play`, `/pause`, `/skip`, `/stop`, `/queue`) and utility commands (`/announce`, `/active`)
- **Prefix Commands** - Moderation (`ban`, `kick`, `clear`, `lock`, `unlock`, `say`) and setup utilities (prefix: `+`)

### Music Playback System

**Technology:** DisTube v5 with YouTube and optional Spotify support.
- YouTube via @distube/ytdl-core (always available)
- Spotify via @distube/spotify (requires `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`)
- FFmpeg for audio processing, Opusscript for voice encoding

### Web Server Health Check

**Technology:** Express.js on port 5000 (0.0.0.0).
Provides `GET /` endpoint responding "Bot is alive!" for uptime monitoring.

### Project Structure

```
index.js                    - Entry point (Express server + bot loader)
src/index.js                - Bot initialization (Discord.js client, DisTube, event/command loading)
src/config/config.json      - Bot config (client ID, prefix, owner IDs)
src/config/server.json      - Server-specific settings (roles, channels, images)
src/config/rules.js         - Server rules text
src/handlers/command.js     - Prefix command handler
src/handlers/event.js       - Event handler
src/slashcommands/          - Slash command files (play, pause, skip, stop, queue, announce, active)
src/console/watermark.js    - Console ASCII art
command/                    - Prefix commands directory
```

### Environment Variables Required
- `TOKEN` - Discord bot authentication token (required)
- `SPOTIFY_CLIENT_ID` - (Optional) Spotify application ID
- `SPOTIFY_CLIENT_SECRET` - (Optional) Spotify application secret

### Deployment
- Target: VM (always-on, required for Discord bot)
- Run command: `node index.js`
- No database used; all state is ephemeral in-memory
