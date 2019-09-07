module.exports = (commands) => {
  return (message) => {
    let toSend = '';
    let available = Object.keys(commands).filter(c => c !== 'default');

    available.forEach(i => {
      if (commands[i].privileged) {
        toSend = toSend + '* ';
      }

      toSend = toSend + i + '\n';
    });

    message.channel.send(
        'Available commands are:```\n' + toSend +
        '```\nRun me by typing: `!wiper <command>`\n`*` denotes a privileged command that can only be run by the privileged role specified in \n`!wiper config`');
  }
};
