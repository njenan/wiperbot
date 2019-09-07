let getTargets = require('../get-targets');

module.exports = (db, bot) => {
  return (msg) => {
    let targets = getTargets(db, bot);
    let toSend = 'The following channels will be wiped:```';
    targets.forEach(chan => { toSend = toSend + '\n' + chan.name; });

    toSend = toSend + '```';

    msg.channel.send(toSend);
  };
};
