let exec = require('child_process').exec

let LOG_FILE = './out.log';

module.exports = (message) => {
  exec('tail ' + LOG_FILE, (err, stdout, stderr) => {
    if (err) {
      logger.error(err);
      return;
    }

    message.channel.send('```' + stdout + '```');
  });
}
