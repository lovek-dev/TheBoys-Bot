const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music from YouTube or Spotify')
    .addStringOption(option =>
      option.setName('song')
        .setDescription('Song name, URL (YouTube/Spotify)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const query = interaction.options.getString('song');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to play music!',
        flags: 64,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        content: '❌ I need **Connect** and **Speak** permissions in your voice channel!',
        flags: 64,
      });
    }

    await interaction.deferReply();

    const tryPlay = async (attempt = 1) => {
      try {
        await client.distube.play(voiceChannel, query, {
          member: interaction.member,
          textChannel: interaction.channel,
        });

        try {
          await interaction.editReply({
            embeds: [{
              color: 0x00ff00,
              title: '✅ Request received!',
              description: `Searching for: **${query}**`,
              timestamp: new Date(),
            }],
          });
        } catch (e) {
          if (e.code !== 10062) console.error('Error editing play reply:', e);
        }

      } catch (error) {
        console.error(`Play command error (attempt ${attempt}):`, error);

        // Retry once on voice connection failures
        if (error.errorCode === 'VOICE_CONNECT_FAILED' && attempt < 3) {
          console.log(`[MUSIC] Voice connect failed — retrying (${attempt}/2)...`);
          await new Promise(r => setTimeout(r, 2000));
          return tryPlay(attempt + 1);
        }

        let errorMessage = '❌ Failed to play the song. Please try again.';

        if (error.errorCode === 'VOICE_CONNECT_FAILED') {
          errorMessage = [
            '❌ **Could not connect to your voice channel.**',
            '',
            'This is usually caused by a network/UDP issue on the hosting server.',
            'Try these steps:',
            '• Make sure the bot has **Connect** and **Speak** permissions',
            '• Try a different voice channel',
            '• If the issue persists, the hosting server may be blocking voice UDP traffic',
          ].join('\n');
        } else if (error.message?.includes('No result')) {
          errorMessage = '❌ No results found for your search. Try a YouTube URL directly.';
        } else if (error.message?.includes('private')) {
          errorMessage = '❌ This video is private or unavailable.';
        } else if (error.message?.includes('age')) {
          errorMessage = '❌ This video is age-restricted and cannot be played.';
        } else if (error.message?.includes('Sign in')) {
          errorMessage = '❌ YouTube is requiring login for this video. Try a different song.';
        }

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: errorMessage });
          }
        } catch (e) {
          if (e.code !== 10062) console.error('Error sending play error reply:', e);
        }
      }
    };

    await tryPlay();
  },
};
