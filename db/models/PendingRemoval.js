// src/db/models/PendingRemoval.js
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class PendingRemoval extends Model {
    static table = 'pending_removals';

    @field('post_id') postId;
}