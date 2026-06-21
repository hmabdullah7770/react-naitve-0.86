// src/db/models/PendingRating.js
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class PendingRating extends Model {
    static table = 'pending_ratings';

    @field('post_id') postId;
    @field('rating') rating;
}