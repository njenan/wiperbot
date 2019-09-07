let exec = require('child_process').exec
let formatInfos = require('../padding');
module.exports = logger => {
  return (message) => {
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

        exec('dig +short myip.opendns.com @resolver1.opendns.com', (err,
                                                                    ip) => {
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

              let infos = [
                {key : 'os', value : os}, {key : 'os version', value : osv},
                {key : 'bot version', value : gitSha},
                {key : 'node version', value : nodeVersion},
                {key : 'server time', value : new Date().toTimeString()},
                {key : 'ip', value : ip}
              ];

              let toSend = formatInfos(infos);
              message.channel.send('Wiper bot info: \n```' + toSend + '\n```');
            });
          });
        });
      });
    });
  };
};
