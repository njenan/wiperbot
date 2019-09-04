var Discord = require('discord.js');
var auth = require('./auth.json');
var cron = require('cron');
var exec = require('child_process').exec
var winston = require('winston');

var logger = winston.createLogger({
  level : 'info',
  defaultMeta : {service : 'wiper bot'},
  transports : [ new winston.transports.File({
    filename : 'out.log',
    format : winston.format.combine(
        winston.format.timestamp({format : 'YYYY-MM-DD hh:mm:ss A ZZ'}),
        winston.format.json())
  }) ]
});

var bot = new Discord.Client();

var wipe;
var config = {
  wipeDelay : '30',
  privilegedRole : 'Admin',
  enableScheduledWipes : true,
};

var blacklist = {};

var job;
var cronSchedule = '0 0 1 * * *';

var LOG_FILE = './out.log';

var commands = {
  'wipe' : {
    privileged : true,
    command : (message) => {
      // TODO broadcast warning in all channels
      if (wipe) {
        message.channel.send(
            'cannot schedule a wipe while a wipe is in progress');
        return;
      }

      logger.info('scheduling wipe');

      let toSend = `wipe scheduled
all non-protected channels will be wiped in ${config.wipeDelay} seconds
type \`!wiper wipe cancel\` to abort`;

      bot.channels.forEach(chan => {
        if (chan.type === 'text') {
          if (!blacklist[chan.name]) {
            chan.send(toSend);
          }
        }
      });

      let wipeDelay = parseInt(config.wipeDelay);

      if (isNaN(wipeDelay)) {
        logger.info('invalid value for wipeDelay ' + config.wipeDelay);
        message.channel.send('invalid value for wipeDelay ' + config.wipeDelay);
        wipeDelay = 30;
      }

      wipe = setTimeout(() => {
        wipe = null;

        logger.info('beginning wipe');

        let targets = getTargets();
        targets.forEach(chan => {
          logger.info('deleting channel ' + chan.name);
          chan.delete();
        });

        targets.sort((a, b) => a.position < b.position);

        targets.forEach(chan => {
          logger.info('creating channel ' + chan.name);
          message.guild.createChannel(chan.name, chan);
        });
      }, wipeDelay * 1000)
      return;
    }
  },

  'wipe dry-run' : {
    command : (msg) => {
      let targets = getTargets();

      let toSend = 'The following channels will be wiped:```';
      targets.forEach(chan => { toSend = toSend + '\n' + chan.name; });

      toSend = toSend + '```';

      msg.channel.send(toSend);
    }
  },

  'wipe cancel' : {
    privileged : true,
    command : (message) => {
      logger.info('wipe canceled');
      clearTimeout(wipe);
      wipe = null;

      message.channel.send('wipe canceled')
    }
  },

  'config' : {
    command : (message) => {
      // TODO add a way to mask config (so we can set the token)
      logger.info('printing config');

      let toSend = '';

      // TODO do some padding so all the variables are equal length
      for (let i in config) {
        toSend = toSend + '\n' + i + ': ' + config[i];
      }

      message.channel.send('Current config is:```\n' + toSend + '```');
    }
  },

  'config set <name> <value>' : {
    privileged : true,
    command : (message) => {
      let split = message.content.split(' ');

      if (split.length !== 5) {
        logger.info('invalid config set "' + message.content + "'");
        message.channel.send(
            'invalid command, config set commands should be in the form `!wiper config set variable value`');
        return;
      }

      if (!config[split[3]]) {
        logger.info('invalid variable ' + split[3]);
        message.channel.send('invalid variable ' + split[3]);
        return;
      }

      config[split[3]] = split[4];
      message.channel.send(`set ${split[3]} as ${split[4]}`);
    }
  },

  'protected' : {
    command : (message) => {
      logger.info('displaying blacklist');

      if (Object.keys(blacklist).length === 0) {
        message.channel.send('No channels protected');
        return;
      }

      let toSend = '';

      for (let i in blacklist) {
        toSend = toSend + '\n' + i + '\n';
      }

      message.channel.send('protected channels are: ```' + toSend + '```');
    }
  },

  'protected add <channel>' : {
    privileged : true,
    command : (message) => {
      // TODO add in check that channel actually exists
      let split = message.content.split(' ');
      if (split.length !== 4) {
        message.channel.send('invalid command');
        return;
      }

      blacklist[split[3]] = true;
      message.channel.send('added channel ' + split[3] + ' to protected list');
    }
  },

  'protected remove <channel>' : {
    privileged : true,
    command : (message) => {
      let split = message.content.split(' ');
      if (split.length !== 4) {
        message.channel.send('invalid command');
        return;
      }

      delete blacklist[split[3]];
      message.channel.send('removed channel ' + split[3] +
                           ' from protected list');
    }
  },

  'schedule' : {
    command : (message) => {
      message.channel.send(`The next wipe is scheduled for ${job.nextDates()}
Current cron schedule is \`${cronSchedule}\`
Server time is ${new Date().toTimeString()}

Cron schedule format is http://www.nncron.ru/help/EN/working/cron-format.htm`);
    }
  },

  'schedule set <cron format>' : {
    privileged : true,
    command : (message) => {
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
    }
  },

  'logs' : {
    command : (message) => {
      exec('tail ' + LOG_FILE, (err, stdout, stderr) => {
        if (err) {
          logger.error(err);
          return;
        }

        message.channel.send('```' + stdout + '```');
      });
    }
  },

  'logs all' :
      {command : (message) => { message.channel.send('not implemented'); }},

  'info' : {
    command : (message) => {
      exec('git rev-parse HEAD', (err, gitSha) => {
        if (err) {
          gitSha = 'ERR';
          logger.error(err);
        }

        exec('node -v', (err, nodeVersion) => {
          if (err) {
            nodeVersion = 'ERR';
            logger.error(err);
          }

          exec('dig +short myip.opendns.com @resolver1.opendns.com',
               (err, ip) => {
                 if (err) {
                   ip = 'ERR';
                   logger.error(err);
                 }

                 exec('uname', (err, os) => {
                   if (err) {
                     os = 'ERR';
                     logger.error(err);
                   }

                   exec('uname -r', (err, osv) => {
                     if (err) {
                       osv = 'ERR';
                       logger.error(err);
                     }

                     message.channel.send(`Wiper Bot Info:\`\`\`
os: ${os.replace('\n', '')}
os version: ${osv.replace('\n', '')}
bot version: ${gitSha.replace('\n', '')}
node version: ${nodeVersion.replace('\n', '')}
server time: ${new Date().toTimeString()}
ip: ${ip}
\`\`\``);
                   });
                 });
               });
        });
      });
    }
  },

  'help' : {
    command : (message) => {
      let toSend = '';
      let available = Object.keys(commands).filter(c => c !== 'default');

      available.forEach(i => {
        if (commands[i].privileged) {
          toSend = toSend + '* ';
        }

        toSend = toSend + i + '\n';
      });

      message.channel.send(
          'Available commands are:```\n' + toSend +
          '```\nRun me by typing: `!wiper <command>`\n`*` denotes a privileged command that can only be run by the privileged role specified in \n`!wiper config`');
    }
  },

  'default' : {
    command : (message) => {
      message.channel.send(
          'I\'m sorry, I didn\'t understand your command, type `!wiper help` for a complete list of commands');
    }
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
  logger.info('command is "' + command + '"');
  let match = keys.find(k => {
    logger.debug('candidate is ' + k);
    return command.startsWith(stripVariables(k));
  });

  return match ? commands[match] : commands['default'];
}

bot.login(auth.token);

bot.on('ready', evt => {
  job = new cron.CronJob(cronSchedule, () => {
    logger.info('schedule wipe has triggered');

    if (config.enableScheduledWipes) {
      commands['wipe'].command({
        guild : bot.guilds.first(), // TODO this could be bad if the bot is in
                                    // multiple guilds
        // TODO make sure this gets broadcast to the channels
        channel : {send : (text) => { logger.info(text); }}
      });
    } else {
      logger.info('scheduled wipes are disabled, skipping');
    }
  });

  job.start();

  logger.info('Bot is ready to receive messages');
});

bot.on('message', message => {
  if (message.content.startsWith('!wiper')) {
    logger.info('received command',
                {command : message.content, user : message.author.username});
    let command = findMatchingCommand(message.content);

    if (command.privileged) {
      if (!(message.member.roles.find(r => r.name === config.privilegedRole))) {
        message.channel.send(`I'm sorry, you don't have the role \`${
            config.privilegedRole}\`, you cannot execute this command`)
        return;
      }
    }

    command.command(message);
  }
});

function getTargets() {
  let targets = [];

  bot.channels.forEach(chan => {
    if (chan.type === 'text') {
      if (!blacklist[chan.name]) {
        targets.push(chan);
      }
    }
  });

  return targets;
}
