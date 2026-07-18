# Discord Server Bot — SummerSMP Edition

## Overview

A feature-rich Discord bot built with Discord.js v14. Includes music playback, server moderation, utility commands, a full **SummerSMP clan module** (applications, tickets, promotions/demotions, logs), always-on **anti-nuke protection**, and **auto-moderation** (anti-invite, anti-promo links, spam detection, caps filter).

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

### SummerSMP Module Commands
| Command | Description |
|---|---|
| `/summersmp` | View module status and all configuration options |
| `/summer verify` | Send the clan application panel (with Join button + 4-field form) |
| `/summerform #channel` | Set where applications go for staff review |
| `/summerrole @role` | Set the role given to accepted members |
| `/summerticket` | Send the ticket panel (Report / Promotion Request) |
| `/promotion @user @role reason` | Announce & apply a promotion (logged) |
| `/demotion @user @role reason` | Announce & apply a demotion (logged) |
| `/logssummer #channel` | Set the channel for all SummerSMP logs |

### Anti-Nuke Protection (always on)
- **Mass channel delete** — bans executor after 3+ deletions in 10 s
- **Mass role delete** — bans executor after 3+ deletions in 10 s
- **Mass ban** — bans executor after 5+ bans in 15 s
- Owner is never targeted; bot actions are excluded

### Auto-Moderation (always on, admins/moderators exempt)
- Blocks Discord invite links
- Blocks promotional/external links (whitelists major platforms)
- Spam detection — 2-min timeout after 6 messages in 5 s
- Caps filter — deletes messages with >70% uppercase (15+ chars)
- Violations logged to the summer logs channel

### Summer Logs (set via `/logssummer`)
Logs: member join, member leave, kick, ban, unban, timeout, role changes, promotions, demotions, auto-mod actions

### Environment Variables Required
- `TOKEN` - Discord bot authentication token (required)
- `SPOTIFY_CLIENT_ID` - (Optional) Spotify application ID
- `SPOTIFY_CLIENT_SECRET` - (Optional) Spotify application secret

### Database
- `database.json` — file-based JSON store via `src/database/db.js`
- Summer module keys: `summer_form_channel_<guildId>`, `summer_role_<guildId>`, `summer_ticket_channel_<guildId>`, `summer_logs_channel_<guildId>`

### Deployment
- Target: VM (always-on, required for Discord bot)
- Run command: `node index.js`
