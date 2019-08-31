var Discord = require('discord.js');
var auth = require('./auth.json');

var bot = new Discord.Client();

var wipe;
var config = {
  wipeTimeout : '30',
};

var blacklist = {};

var commands = {

};

bot.login(auth.token);

bot.on('ready', evt => { console.log('Bot is ready to receive messages'); });

bot.on('message', message => {
  if (message.content.startsWith('!wiper')) {
    if (message.content === '!wiper wipe') {
      if (wipe) {
        message.channel.send('wipe in progress-- aborting');
        return;
      }

      console.log('scheduling wipe');

      message.channel.send(`wipe scheduled
all non-blacklisted channels will be wiped in ${config.wipeTimeout} seconds
type \`!wiper wipe cancel\` to abort`);
      let wipeTimeout = parseInt(config.wipeTimeout);

      if (isNaN(wipeTimeout)) {
        console.log('invalid value for wipeTimeout ' + config.wipeTimeout);
        message.channel.send('invalid value for wipeTimeout ' +
                             config.wipeTimeout);
        wipeTimeout = 30;
      }

      wipe = setTimeout(() => {
        wipe = null;

        console.log('beginning wipe');

        let targets = [];
        bot.channels.forEach(chan => {
          if (chan.type === 'text') {
            if (!blacklist[chan.name]) {
              targets.push(chan);
            }
          }
        });

        targets.forEach(chan => {
          console.log('deleting channel ' + chan.name);
          chan.delete();
        });

        targets.sort((a, b) => a.position < b.position);

        targets.forEach(
            chan => { message.guild.createChannel(chan.name, chan); });
      }, wipeTimeout * 1000)
      return;
    }

    if (message.content.startsWith('!wiper blacklist')) {
      if (message.content === '!wiper blacklist') {
        console.log('displaying blacklist');

        if (Object.keys(blacklist).length === 0) {
          message.channel.send('No channels added to blacklist');
          return;
        }

        let toSend = '';

        for (let i in blacklist) {
          toSend = toSend + '\n' + i + '\n';
        }

        message.channel.send('blacklist is: ```' + toSend + '```');
        return;
      }

      if (message.content.startsWith('!wiper blacklist add')) {
        let split = message.content.split(' ');
        if (split.length !== 4) {
          message.channel.send('invalid command');
          return;
        }

        blacklist[split[3]] = true;
        message.channel.send('added channel ' + split[3] + ' to blacklist');

        return;
      }

      if (message.content.startsWith('!wiper blacklist remove')) {
        let split = message.content.split(' ');
        if (split.length !== 4) {
          message.channel.send('invalid command');
          return;
        }

        delete blacklist[split[3]];
        message.channel.send('removed channel ' + split[3] + ' from blacklist');

        return;
      }
    }

    if (message.content === '!wiper wipe cancel') {
      console.log('wipe canceled');
      clearTimeout(wipe);
      wipe = null;

      message.channel.send('wipe canceled')
      return;
    }

    if (message.content.startsWith('!wiper config')) {
      if (message.content === '!wiper config') {
        console.log('printing config');

        let toSend = '';

        // TODO do some padding so all the variables are equal length
        for (let i in config) {
          toSend = toSend + '\n' + i + ': ' + config[i];
        }

        message.channel.send('Current config is:```\n' + toSend + '```');
        return;
      }

      if (message.content.startsWith('!wiper config set')) {
        let split = message.content.split(' ');

        if (split.length !== 5) {
          console.log('invalid config set "' + message.content + "'");
          message.channel.send(
              'invalid command, config set commands should be in the form `!wiper config set variable value`');
          return;
        }

        if (!config[split[3]]) {
          console.log('invalid variable ' + split[3]);
          message.channel.send('invalid variable ' + split[3]);
          return;
        }

        config[split[3]] = split[4];
        message.channel.send(`set ${split[3]} as ${split[4]}`);

        return;
      }
    }

    if (message.content === '!wiper help') {
      console.log('printing help');
      message.channel.send('ERR HELP NOT FOUND');
      return;
    }

    message.channel.send(
        'I\'m sorry, I didn\'t understand your command, type `!wiper help` for a complete list of commands');
  }
});
