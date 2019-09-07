module.exports = (logger, db) => {
  return (message) => {
    // TODO add a way to mask config (so we can set the token)
    logger.info('printing config');

    let toSend = '';
    let config = db.get('config').value();

    // TODO do some padding so all the letiables are equal length
    for (let i in config) {
      toSend = toSend + '\n' + i + ': ' + config[i];
    }

    message.channel.send('Current config is:```\n' + toSend + '```');
  };
};
