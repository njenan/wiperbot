module.exports = db => {
  return (message) => {
    // TODO add in check that channel actually exists
    let split = message.content.split(' ');
    if (split.length !== 4) {
      message.channel.send('invalid command');
      return;
    }

    db.set('protected.' + split[3], true).write().then(() => {
      message.channel.send('added channel ' + split[3] + ' to protected list');
    });
  };
};
