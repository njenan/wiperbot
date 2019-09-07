let wipeTimeout = require('../wipeTimeout');

module.exports = (logger) => {
  return (message) => {
    logger.info('wipe canceled');
    clearTimeout(wipeTimeout.timeout);
    wipeTimeout.timeout = null;

    message.channel.send('wipe canceled')
  };
}
