// src/db/models/PendingFavourite.js
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class PendingFavourite extends Model {
    static table = 'pending_favourites';

    @field('post_id') postId;
}