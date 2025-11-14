# Discord Music Bot

## Overview

A feature-rich Discord bot built with Discord.js v14 that provides music playback from YouTube and Spotify, along with server moderation tools and utility commands. The bot supports slash commands for music playback, traditional prefix commands for moderation, and includes a custom setup system for server rules and welcome messages.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 14, 2025** - Fixed moderation command bugs and added role hierarchy validation:
- Fixed kick command bug where it was passing the wrong parameter (args[0] instead of reason)
- Added role hierarchy checks to both kick and ban commands to prevent:
  - Moderators from kicking/banning users with equal or higher roles
  - Bot from attempting to kick/ban users with roles higher than its own
- Added comprehensive error handling with try-catch blocks and clear error messages
- Implemented validation using Discord.js built-in properties (kickable, bannable)
- All commands now properly await asynchronous operations and handle failures gracefully

## System Architecture

### Bot Framework

**Core Technology:** Discord.js v14 with full gateway intents and partials support for comprehensive Discord API access.

**Dual Command System:**
- **Slash Commands** - Modern Discord interactions for music commands (`/play`, `/pause`, `/skip`, `/stop`, `/queue`) and utility commands (`/announce`, `/active`)
- **Prefix Commands** - Traditional message-based commands for moderation (`ban`, `kick`, `clear`, `lock`, `unlock`, `say`) and setup utilities

**Architecture Decision:** The bot uses two separate command systems to balance user experience (modern slash commands for end-users) with administrative convenience (prefix commands for moderators). This hybrid approach allows quick moderation actions while providing polished music command interactions.

### Music Playback System

**Technology:** DisTube v5 music streaming framework with multi-source support.

**Key Components:**
- **DisTube Core** - Handles queue management, audio streaming, and voice channel connections
- **YouTube Support** - Primary audio source via @distube/ytdl-core
- **Spotify Plugin** - Optional Spotify playback (gracefully disabled if credentials not provided)
- **Audio Encoding** - FFmpeg for audio processing, Opusscript for voice encoding

**Design Decision:** Spotify integration is optional and fails gracefully. The bot detects environment variables at startup and only initializes the Spotify plugin if credentials exist, ensuring YouTube functionality remains available even without Spotify access.

**Queue Architecture:** Per-voice-channel queue isolation - each voice channel maintains its own independent music queue, allowing multiple concurrent playback sessions across different channels.

### Web Server Health Check

**Technology:** Express.js lightweight web server on port 5000.

**Purpose:** Provides a simple HTTP endpoint (`GET /`) that responds with "Bot is alive!" to enable uptime monitoring and health checks for hosting platforms like Replit.

**Design Decision:** The web server runs alongside the Discord bot to satisfy hosting platform requirements for always-on applications, separate from the bot's core functionality.

### Permission & Authorization System

**User Permissions:**
- Slash commands use Discord's `defaultMemberPermissions` for built-in permission checks
- Prefix commands implement custom permission validation through `userPerms` arrays
- Owner-only commands checked against hardcoded owner IDs in config

**Bot Permissions:** Commands validate bot permissions before execution to provide clear error messages when lacking required permissions.

### Configuration Management

**Structure:**
- `config.json` - Bot credentials (client ID, prefix, owner IDs)
- `server.json` - Server-specific settings (role IDs, channel IDs, custom images for embeds)
- Environment variables - Sensitive credentials (Discord token, Spotify credentials)

**Design Decision:** Separation of static configuration (JSON files) from secrets (environment variables) follows security best practices while allowing easy customization of server-specific features.

### Event System

**Architecture:** Event handlers organized in `/src/events/` subdirectories by category:
- `client/` - Core Discord events (ready, messageCreate)
- `setup/` - Custom interaction handlers (rules acceptance, button clicks)

**Handler Pattern:** Events are loaded dynamically from the filesystem, registered with the client, and execute based on Discord gateway events.

### Command Handlers

**Loading Mechanism:** 
- Slash commands loaded from `/src/slashcommands/` 
- Prefix commands loaded from `/src/commands/` with category subdirectories
- Both use dynamic filesystem scanning to auto-register commands

**Command Structure:** Each command exports a standard interface with metadata (name, description, permissions) and an async execute function.

## External Dependencies

### Discord Services
- **Discord.js v14** - Official Discord API library with full v14 features
- **@discordjs/builders** - Slash command and component builders
- **@discordjs/voice** - Voice connection and audio streaming

### Music Streaming
- **DisTube v5** - Music bot framework and queue manager
- **@distube/ytdl-core** - YouTube audio extraction
- **@distube/spotify** - Spotify track resolution plugin
- **play-dl** - Additional audio source support
- **ffmpeg-static** - Audio transcoding binary
- **opusscript** - Opus audio codec for Discord voice

### Spotify API
- **Client Credentials Flow** - Server-to-server authentication for track resolution
- **Optional Integration** - Requires `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` environment variables

### Web Server
- **Express.js v5** - HTTP server for health checks and uptime monitoring

### Utilities
- **colors** - Console output styling
- **common-tags** - Template literal formatting for embeds
- **ms** - Time duration parsing
- **libsodium-wrappers** - Encryption for voice connections

### Environment Variables Required
- `DISCORD_BOT_TOKEN` - Bot authentication token
- `CLIENT_ID` - Discord application/client ID
- `SPOTIFY_CLIENT_ID` - (Optional) Spotify application ID
- `SPOTIFY_CLIENT_SECRET` - (Optional) Spotify application secret

### No Database
This application does not use a database. All configuration is file-based (JSON) and runtime state (music queues) is ephemeral in-memory storage.