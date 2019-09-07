let exec = require('child_process').exec

module.exports = (message) => {
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

      exec('dig +short myip.opendns.com @resolver1.opendns.com', (err, ip) => {
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
