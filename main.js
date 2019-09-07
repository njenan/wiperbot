let Discord = require('discord.js');
let auth = require('./auth.json');
let cron = require('cron');
let winston = require('winston');
let lowdb = require('lowdb');
let FileAsync = require('lowdb/adapters/FileAsync');

let wipe = require('./commands/wipe');
let wipeDryRun = require('./commands/wipe-dry-run');
let wipeCancel = require('./commands/wipe-cancel');
let config = require('./commands/config');
let configSet = require('./commands/config-set');
let protectedCmd = require('./commands/protected');
let protectedAdd = require('./commands/protected-add');
let protectedRemove = require('./commands/protected-remove');
let schedule = require('./commands/schedule');
let scheduleSet = require('./commands/schedule-set');
let logs = require('./commands/logs');
let notImplemented = require('./commands/not-implemented');
let defaultCmd = require('./commands/default');
let info = require('./commands/info');
let help = require('./commands/help');

let wipeTimeout = require('./wipeTimeout');

let logger = winston.createLogger({
  level : 'info',
  defaultMeta : {service : 'wiper bot'},
  transports : [
    new winston.transports.File({
      filename : 'out.log',
      format : winston.format.combine(
          winston.format.timestamp({format : 'YYYY-MM-DD hh:mm:ss A ZZ'}),
          winston.format.json())
    }),
    new winston.transports.Console({format : winston.format.simple()})
  ]
});

logger.info('logger initiated');

function strip(command) {
  let index = command.indexOf('<');
  if (index === -1) {
    return command;
  } else {
    return command.substring(0, index - 1);
  }
}

function findMatchingCommand(commands, text) {
  let keys = Object.keys(commands);
  keys.sort((a, b) => strip(b).length - strip(a).length);

  let command = text.substring(7);
  logger.info('command is "' + command + '"');
  let match = keys.find(k => {
    logger.debug('candidate is ' + k);
    return command.startsWith(strip(k));
  });

  return match ? commands[match] : commands['default'];
}

let adaptor = new FileAsync('db.json');

let bot = new Discord.Client();

let startTime = new Date();

lowdb(adaptor).then((db) => {
  db.read().then(() => {
    logger.info('database file loaded');

    let job;

    let commands = {
      'wipe' : {privileged : true, command : wipe(logger, db, bot)},
      'wipe dry-run' : {command : wipeDryRun(db, bot)},
      'wipe cancel' : {privileged : true, command : wipeCancel(logger)},
      'config' : {command : config(logger, db)},
      'config set <name> <value>' :
          {privileged : true, command : configSet(logger, db)},
      'protected' : {command : protectedCmd(logger, db)},
      'protected add <channel>' :
          {privileged : true, command : protectedAdd(db)},
      'protected remove <channel>' :
          {privileged : true, command : protectedRemove(db)},
      'logs' : {command : logs},
      'logs all' : {command : notImplemented},
      'info' : {command : info},
      'default' : {command : defaultCmd}
    };
    commands.help = {command : help(commands)},

    bot.login(auth.token);

    bot.on('ready', evt => {
      logger.info('wiper bot is up and ready to receive commands');

      let cronSchedule = db.get('cronSchedule').value();

      job = new cron.CronJob(cronSchedule, () => {
        logger.info('schedule wipe has triggered');

        let enableScheduledWipes =
            db.get('config.enableScheduledWipes').value();

        if (enableScheduledWipes === 'true') {
          commands['wipe'].command({
            guild : bot.guilds.first(), // TODO this could be bad if the bot is
                                        // in multiple guilds
            // TODO make sure this gets broadcast to the channels
            channel : {send : (text) => { logger.info(text); }}
          });
        } else {
          logger.info('scheduled wipes are disabled, skipping');
        }
      });

      job.start();

      commands.schedule = {command : schedule(db, job)};
      commands['schedule set <cron format>'] = {
        privileged : true,
        command : scheduleSet(db, job)
      };

      logger.info('Bot is ready to receive messages');
    });

    bot.on('message', message => {
      if (message.content.startsWith('!wiper')) {
        logger.info(
            'received command',
            {command : message.content, user : message.author.username});
        let command = findMatchingCommand(commands, message.content);

        if (command.privileged) {
          let privilegedRole = db.get('config.privilegedRole').value();
          if (!(message.member.roles.find(r => r.name === privilegedRole))) {
            message.channel.send(`I'm sorry, you don't have the role \`${
                privilegedRole}\`, you cannot execute this command`)
            return;
          }
        }

        command.command(message);
      }
    });
  });
});
