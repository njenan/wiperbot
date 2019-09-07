module.exports = (db, job) => {
  return (message) => {
    let cronSchedule = db.get('cronSchedule').value();

    message.channel.send(`The next wipe is scheduled for ${job.nextDates()}
Current cron schedule is \`${cronSchedule}\`
Server time is ${new Date().toTimeString()}

Cron schedule format is http://www.nncron.ru/help/EN/working/cron-format.htm`);
  };
};
