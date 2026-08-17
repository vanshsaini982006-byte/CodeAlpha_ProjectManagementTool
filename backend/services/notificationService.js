const Notification = require('../models/Notification');
const { emitToUser } = require('../socket');

// Creates a notification in the DB and emits it in real-time to the recipient.
const createNotification = async ({ recipient, sender, type, message, project, task }) => {
  // Don't notify users about their own actions
  if (sender && recipient.toString() === sender.toString()) return null;

  const notification = await Notification.create({ recipient, sender, type, message, project, task });
  const populated = await notification.populate('sender', 'name username avatar');

  emitToUser(recipient, 'notificationCreated', populated);
  return populated;
};

module.exports = { createNotification };
