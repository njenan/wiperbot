var Discord = require('discord.js');
var auth = require('./auth.json');
var cron = require('cron');

var bot = new Discord.Client();

var wipe;
var config = {
  wipeDelay : '30',
};

var blacklist = {};

var job;
var cronSchedule = '0 0 1 * * *';

var commands = {
  'wipe' : (message) => {
    // TODO broadcast warning in all channels
    if (wipe) {
      message.channel.send(
          'cannot schedule a wipe while a wipe is in progress');
      return;
    }

    console.log('scheduling wipe');

    message.channel.send(`wipe scheduled
all non-protected channels will be wiped in ${config.wipeDelay} seconds
type \`!wiper wipe cancel\` to abort`);
    let wipeDelay = parseInt(config.wipeDelay);

    if (isNaN(wipeDelay)) {
      console.log('invalid value for wipeDelay ' + config.wipeDelay);
      message.channel.send('invalid value for wipeDelay ' + config.wipeDelay);
      wipeDelay = 30;
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

      targets.forEach(chan => {
        console.log('creating channel ' + chan.name);
        message.guild.createChannel(chan.name, chan);
      });
    }, wipeDelay * 1000)
    return;
  },

  'wipe cancel' : (message) => {
    console.log('wipe canceled');
    clearTimeout(wipe);
    wipe = null;

    message.channel.send('wipe canceled')
  },

  'config' : (message) => {
    // TODO add a way to mask config (so we can set the token)
    console.log('printing config');

    let toSend = '';

    // TODO do some padding so all the variables are equal length
    for (let i in config) {
      toSend = toSend + '\n' + i + ': ' + config[i];
    }

    message.channel.send('Current config is:```\n' + toSend + '```');
  },

  'config set <name> <value>' : (message) => {
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
  },

  'protected' : (message) => {
    console.log('displaying blacklist');

    if (Object.keys(blacklist).length === 0) {
      message.channel.send('No channels protected');
      return;
    }

    let toSend = '';

    for (let i in blacklist) {
      toSend = toSend + '\n' + i + '\n';
    }

    message.channel.send('protected channels are: ```' + toSend + '```');
  },

  'protected add <channel>' : (message) => {
    // TODO add in check that channel actually exists
    let split = message.content.split(' ');
    if (split.length !== 4) {
      message.channel.send('invalid command');
      return;
    }

    blacklist[split[3]] = true;
    message.channel.send('added channel ' + split[3] + ' to protected list');
  },

  'protected remove <channel>' : (message) => {
    let split = message.content.split(' ');
    if (split.length !== 4) {
      message.channel.send('invalid command');
      return;
    }

    delete blacklist[split[3]];
    message.channel.send('removed channel ' + split[3] +
                         ' from protected list');
  },

  'schedule' : (message) => {
    message.channel.send(`The next wipe is scheduled for ${job.nextDates()}
current cron schedule is \`${cronSchedule}\`

cron schedule format is http://www.nncron.ru/help/EN/working/cron-format.htm`);
  },

  'schedule set <cron format>' : (message) => {
    let s = message.content.split(' ');
    if (s.length !== 9) {
      message.channel.send('invalid command');
      return;
    }

    let schedule = `${s[3]} ${s[4]} ${s[5]} ${s[6]} ${s[7]} ${s[8]}`;
    cronSchedule = schedule;
    job.setTime(new cron.CronTime(schedule));
    job.start();

    message.channel.send(`wipe schedule is now set to \`${schedule}\`
next wipe will be at ${job.nextDates()}`);
  },

  'logs' : (message) => { message.channel.send('not implemented'); },

  'help' : (message) => {
    let toSend = '';
    let available = Object.keys(commands).filter(c => c !== 'default');

    available.forEach(i => { toSend = toSend + i + '\n'; });

    message.channel.send('Available commands are:```\n' + toSend +
                         '```\nRun me by typing: `!wiper <command>`');
  },

  'default' : (message) => {
    message.channel.send(
        'I\'m sorry, I didn\'t understand your command, type `!wiper help` for a complete list of commands');
  }
};

function stripVariables(command) {
  let index = command.indexOf('<');
  if (index === -1) {
    return command;
  } else {
    return command.substring(0, index - 1);
  }
}

function findMatchingCommand(text) {
  let keys = Object.keys(commands);
  keys.sort((a, b) => stripVariables(b).length - stripVariables(a).length);

  let command = text.substring(7);
  console.log('command is "' + command + '"');
  let match = keys.find(k => {
    console.log('candidate is ' + k);
    return command.startsWith(stripVariables(k));
  });

  return match ? commands[match] : commands['default'];
}

bot.login(auth.token);

bot.on('ready', evt => {
  job = new cron.CronJob(cronSchedule, () => {
    console.log('schedule wipe has triggered');
    commands['wipe']({
      guild : bot.guilds.first(),
      // TODO make sure this gets broadcast to the channels
      channel : {send : (text) => { console.log(text); }}
    });
    job.start();
  });

  console.log('Bot is ready to receive messages');
});

bot.on('message', message => {
  if (message.content.startsWith('!wiper')) {
    let command = findMatchingCommand(message.content);
    command(message);
  }
});
