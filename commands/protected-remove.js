module.exports = db => {
  return (message) => {
    let split = message.content.split(' ');
    if (split.length !== 4) {
      message.channel.send('invalid command');
      return;
    }

    db.unset('protected.' + split[3]).write().then(() => {
      message.channel.send('removed channel ' + split[3] +
                           ' from protected list');
    });
  };
};
