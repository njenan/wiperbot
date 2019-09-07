module.exports = (logger, db) => {
  return (message) => {
    logger.info('displaying blacklist');

    let blacklist = db.get('protected').value()
    if (Object.keys(blacklist).length === 0) {
      message.channel.send('No channels protected');
      return;
    }

    let toSend = '';

    for (let i in blacklist) {
      toSend = toSend + '\n' + i + '\n';
    }

    message.channel.send('protected channels are: ```' + toSend + '```');
  };
};
