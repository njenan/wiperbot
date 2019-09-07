let cron = require('cron');

module.exports = (db, job) => {
  return (message) => {
    let s = message.content.split(' ');
    if (s.length !== 9) {
      message.channel.send('invalid command');
      return;
    }

    let schedule = `${s[3]} ${s[4]} ${s[5]} ${s[6]} ${s[7]} ${s[8]}`;
    db.set('cronSchedule', schedule).write().then(() => {
      job.setTime(new cron.CronTime(schedule));
      job.start();

      message.channel.send(`wipe schedule is now set to \`${schedule}\`
next wipe will be at ${job.nextDates()}`);
    });
  };
};
