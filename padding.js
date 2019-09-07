module.exports = function(infos) {
  let toSend = '';
  let longest = 0;

  infos
      .map(info => {
        info.value = info.value.replace('\n', '');
        return info;
      })
      .map(info => {
        if (info.key.length > longest) {
          longest = info.key.length;
        }

        return info;
      })
      .forEach(info => {
        let length = info.key.length;
        let padding = longest - length + 1;
        toSend = toSend + '\n' + info.key + ':' +
                 ' '.repeat(padding) + info.value;
      });

  return toSend;
}
