module.exports = (logger, db) => {
  return (message) => {
    let split = message.content.split(' ');

    if (split.length !== 5) {
      logger.info('invalid config set "' + message.content + "'");
      message.channel.send(
          'invalid command, config set commands should be in the form `!wiper config set letiable value`');
      return;
    }

    if (!db.get('config.' + split[3]).value()) {
      logger.info('invalid letiable ' + split[3]);
      message.channel.send('invalid letiable ' + split[3]);
      return;
    }

    db.set('config.' + split[3], split[4]).write().then(() => {
      message.channel.send(`set ${split[3]} as ${split[4]}`);
    });
  };
};
