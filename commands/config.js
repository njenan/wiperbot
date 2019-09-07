let formatInfos = require('../padding');

module.exports = (logger, db) => {
  return (message) => {
    // TODO add a way to mask config (so we can set the token)
    logger.info('printing config');

    let config = db.get('config').value();

    // TODO do some padding so all the letiables are equal length
    let infos = [];
    for (let i in config) {
      infos.push({key : i, value : config[i]});
    }

    let toSend = formatInfos(infos);

    message.channel.send('Current config is:\n```\n' + toSend + '\n```');
  };
};
