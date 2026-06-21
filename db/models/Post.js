// src/db/models/Post.js
import { Model } from '@nozbe/watermelondb'
import { field, date, children } from '@nozbe/watermelondb/decorators'

export default class Post extends Model {
  static table = 'posts'
  static associations = {
    comments: { type: 'has_many', foreignKey: 'post_id' }
  }

  @field('title') title
  @field('body') body
  @field('is_published') isPublished
  @date('created_at') createdAt
  @children('comments') comments
}