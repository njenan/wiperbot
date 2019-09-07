module.exports = (db, bot) => {
  let blacklist = db.get('protected').value();
  let targets = [];

  bot.channels.forEach(chan => {
    if (chan.type === 'text') {
      if (!blacklist[chan.name]) {
        targets.push(chan);
      }
    }
  });

  return targets;
};
