// src/db/models/PendingReadNotification.js
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class PendingReadNotification extends Model {
  static table = 'pending_read_notifications';

  @field('notification_id') notificationId;
}