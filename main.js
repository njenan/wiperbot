var Discord = require('discord.js');
var auth = require('./auth.json');

var bot = new Discord.Client();

bot.login(auth.token);
bot.on('ready', evt => {
  console.log('Connected');
  console.log('Logged in as: ');
  console.log(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', message => {
  if (message.content === '!wiper') {
    message.channel.send('pong!');
  }
});
