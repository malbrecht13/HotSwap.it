const { Notification } = require('../models/notification');
const { User } = require('../models/user');

//this function will be exported for back end use but not usable by the front end
const createNotification = async (userId,type,tradeItemName) => {
  try {
    const description = getDescription(type, tradeItemName);
    //create the notification
    let notification = new Notification({
      user: userId,
      type: type,
      description: description
    })
    notification = await notification.save();
    if(!notification) {
      console.log('Notification was not created');
    }
    //now add notification to user's notifications
    let user = await User.findById(userId);
    let userNotifications = user.notifications;
    userNotifications.push(notification._id);
    console.log('notification._id:', notification._id);
    user = await User.findByIdAndUpdate(
      userId,
      {
        notifications: userNotifications
      }
    )
    if(!user) {
      console.log('User not found for notification');
    }
  } catch(e) {
      console.log(e.message);
  }
}

//private function that returns the correct description depending on the 
//notification type and trade item name
const getDescription = (type, tradeItem) => {
  switch(type) {
    case 'Trade Accepted':
      return `Your offer has been accepted for trade item ${tradeItem}`;
    case 'Offer Rejected':
      return `Your offer for ${tradeItem} has been rejected`;
    case 'Trade Canceled':
      return `Your trade for ${tradeItem} has been canceled`;
    case 'Item Shipped':
      return `Your trade partner has shipped their item: ${tradeItem}`;
    case 'Received Rating':
      return `You have been rated for your trade of: ${tradeItem}`;
    default:
      return null;
  }

}

const deleteNotification = async (req,res) => {
  try {
    //get notificationId from params
    const { notificationId } = req.params; 
    //first remove the notification from the user's notification array
    let notification = await Notification.findById(notificationId);
    const userId = notification.user;
    let user = await User.findById(userId);
    let userNotifications = user.notifications;
    userNotifications = userNotifications.filter(not => {
      return notificationId !== not.toString();
    })
    user = await User.findByIdAndUpdate(
      userId,
      {
        notifications: userNotifications
      }
    )
    if(!user) {
      res.status(404).send({success:false, message: 'User not found'});
      return;
    }
    //now delete the notification
    await Notification.findByIdAndRemove(notificationId);
    return res.status(200).send({success: true, message: 'Notification deleted successfully'});
  } catch(e) {
    return res.status(500).send({success:false, message: 'Server error, could not delete notification'});
  }
}

module.exports = {
  createNotification,
  deleteNotification
}