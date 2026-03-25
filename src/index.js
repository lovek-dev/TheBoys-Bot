require('./console/watermark');
const { Client, Partials, Collection, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const colors = require('colors');
const config = require('./config/config.json');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

// ── Client Setup ──────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildPresences",
        "GuildMessageReactions",
        "DirectMessages",
        "MessageContent",
        "GuildVoiceStates",
        "GuildMembers",
        "DirectMessageTyping",
        "GuildModeration"
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
    ]
});

client.db = require('./database/db');
client.config = config;
client.commands = new Collection();
client.slashCommands = new Collection();
client.events = new Collection();
client.aliases = new Collection();
module.exports = client;

// ── DisTube Setup ─────────────────────────────────────────────────────────────
const distubePlugins = [];

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    distubePlugins.push(new SpotifyPlugin({
        api: {
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        },
    }));
    console.log('[DISTUBE] Spotify plugin enabled'.green);
} else {
    console.log('[DISTUBE] Spotify credentials not found - Spotify playback disabled. YouTube will still work!'.yellow);
}

const distube = new DisTube(client, {
    emitNewSongOnly: false,
    savePreviousSongs: true,
    joinNewVoiceChannel: true,
    nsfw: true,
    ffmpeg: { path: ffmpeg },
    plugins: distubePlugins,
});

client.distube = distube;

// ── Handlers ──────────────────────────────────────────────────────────────────
['command', 'event'].forEach(file => {
    require(`./handlers/${file}`)(client);
});

// ── Slash Commands Loader ─────────────────────────────────────────────────────
const slashCommandsPath = path.join(__dirname, 'slashcommands');
if (fs.existsSync(slashCommandsPath)) {
    const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of slashCommandFiles) {
        const filePath = path.join(slashCommandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.slashCommands.set(command.data.name, command);
                console.log(`[SLASH COMMAND] Loaded: ${command.data.name}`.green);
            } else {
                console.warn(`[SLASH COMMAND] Skipped ${file}: missing data or execute`.yellow);
            }
        } catch (err) {
            console.error(`[SLASH COMMAND] Failed to load ${file}: ${err.message}`.red);
        }
    }
}

// ── Voice Time Tracking ───────────────────────────────────────────────────────
client.voiceStates = new Map();
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.member.user.bot) return;
    if (!oldState.channelId && newState.channelId) {
        client.voiceStates.set(newState.member.id, Date.now());
    }
    if (oldState.channelId && !newState.channelId) {
        const joinTime = client.voiceStates.get(newState.member.id);
        if (joinTime) {
            const duration = Date.now() - joinTime;
            const key = `voice_${newState.guild.id}_${newState.member.id}`;
            const current = client.db.get(key) || 0;
            client.db.set(key, current + duration);
            client.voiceStates.delete(newState.member.id);
        }
    }
});

// ── Reaction Roles ────────────────────────────────────────────────────────────
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    const roleId = client.db.get(`rr_${reaction.message.guildId}_${reaction.message.id}_${reaction.emoji.name}`);
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.add(roleId);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    const roleId = client.db.get(`rr_${reaction.message.guildId}_${reaction.message.id}_${reaction.emoji.name}`);
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(roleId);
    }
});

// ── DisTube Events ────────────────────────────────────────────────────────────
distube.on('playSong', (queue, song) => {
    queue.textChannel.send({
        embeds: [{
            color: 0x00ff00,
            title: '🎵 Now Playing',
            description: `**[${song.name}](${song.url})**`,
            fields: [
                { name: 'Duration', value: song.formattedDuration, inline: true },
                { name: 'Requested by', value: song.user.toString(), inline: true },
            ],
            thumbnail: { url: song.thumbnail },
        }],
    });
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send({
        embeds: [{
            color: 0x0099ff,
            title: '➕ Added to Queue',
            description: `**[${song.name}](${song.url})**`,
            fields: [
                { name: 'Duration', value: song.formattedDuration, inline: true },
                { name: 'Position', value: `${queue.songs.length}`, inline: true },
            ],
            thumbnail: { url: song.thumbnail },
        }],
    });
});

distube.on('error', (channel, error) => {
    console.error('DisTube Error:', error);
    if (channel) channel.send(`❌ An error occurred: ${error.message}`);
});

// ── Ready Event (Diagnostics) ─────────────────────────────────────────────────
client.once('clientReady', () => {
    const { runDiagnostics } = require('./utils/diagnostics');
    runDiagnostics(client);
});

// ── Slash Command Registration ────────────────────────────────────────────────
async function registerSlashCommands() {
    const commands = [];
    if (fs.existsSync(slashCommandsPath)) {
        const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
        for (const file of slashCommandFiles) {
            const filePath = path.join(slashCommandsPath, file);
            try {
                const command = require(filePath);
                if ('data' in command) commands.push(command.data.toJSON());
            } catch (err) {
                console.error(`[REGISTER] Failed to load ${file}: ${err.message}`.red);
            }
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        const guilds = client.guilds.cache;
        console.log(`Registering ${commands.length} slash commands in ${guilds.size} guild(s)...`.yellow);
        const guildResults = await Promise.allSettled(
            [...guilds.values()].map(guild =>
                rest.put(Routes.applicationGuildCommands(config.CLIENTID, guild.id), { body: commands })
                    .then(data => `✅ Registered ${data.length} commands in "${guild.name}"`)
                    .catch(err => { throw new Error(`${guild.name}: ${err.message}`); })
            )
        );
        for (const result of guildResults) {
            if (result.status === 'fulfilled') console.log(result.value.green);
            else console.error(`❌ ${result.reason.message}`.red);
        }
        await rest.put(Routes.applicationCommands(config.CLIENTID), { body: [] });
        console.log(`Cleared global application (/) commands.`.blue);
    } catch (error) {
        console.error('Error during slash command registration:', error);
    }
}

// ── Login ─────────────────────────────────────────────────────────────────────
if (!process.env.TOKEN) {
    console.error('[LOGIN] ❌ TOKEN env var is missing — bot cannot start.'.red);
    process.exit(1);
}

client.login(process.env.TOKEN)
    .then(() => {
        console.log(`✅ Bot logged in successfully`.green);
        registerSlashCommands();
    })
    .catch(err => {
        console.error('[LOGIN] Failed to connect to Discord:'.red, err.message);
        process.exit(1);
    });

// ── Anti-Crash ────────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('🚨 Unhandled Rejection:'.red, reason?.message || reason);
});

process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:'.red, err.message);
});

client.on('shardError', error => {
    console.error('⚠ Shard error:'.yellow, error.message || error);
});
