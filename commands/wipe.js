let wipeTimeout = require('../wipeTimeout');
let getTargets = require('../get-targets');

module.exports = (logger, db, bot) => {
  return (message) => {
    // TODO broadcast warning in all channels
    if (wipeTimeout.timeout) {
      message.channel.send(
          'cannot schedule a wipe while a wipe is in progress');
      return;
    }

    logger.info('scheduling wipe');

    let wipeDelay = db.get('config.wipeDelay');

    let toSend = `wipe scheduled
all non-protected channels will be wiped in ${wipeDelay} seconds
type \`!wiper wipe cancel\` to abort`;

    let blacklist = db.get('protected').value();
    bot.channels.forEach(chan => {
      if (chan.type === 'text') {
        if (!blacklist[chan.name]) {
          chan.send(toSend);
        }
      }
    });

    wipeDelayInt = parseInt(wipeDelay);

    if (isNaN(wipeDelayInt)) {
      logger.info('invalid value for wipeDelay ' + wipeDelay);
      message.channel.send('invalid value for wipeDelay ' + wipeDelay);
      wipeDelayInt = 30;
    }

    wipeTimeout.timeout = setTimeout(() => {
      wipeTimeout.timeout = null;

      logger.info('beginning wipe');

      let targets = getTargets(db, bot);

      targets.forEach(chan => {
        logger.info('deleting channel ' + chan.name);
        chan.delete();
      });

      targets.sort((a, b) => a.position < b.position);

      targets.forEach(chan => {
        logger.info('creating channel ' + chan.name);
        message.guild.createChannel(chan.name, chan);
      });
    }, wipeDelayInt * 1000)
    return;
  }
};
