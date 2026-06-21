// src/db/schema.js
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 5,
  tables: [
    tableSchema({
      name: 'posts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'is_published', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'comments',
      columns: [
        { name: 'post_id', type: 'string', isIndexed: true },
        { name: 'body', type: 'string' },
      ]
    }),
    // ✅ new table for pending favourites
    tableSchema({
      name: 'pending_favourites',
      columns: [
        { name: 'post_id', type: 'string' },
      ]
    }),

     // ✅ new table for pending ratings
    tableSchema({
      name: 'pending_ratings',
      columns: [
        { name: 'post_id', type: 'string' },
        // { name: 'rating', type: 'number' },
        { name: 'rating', type: 'number', isOptional: true }, 
      ]
    }),

     tableSchema({
      name: 'pending_removals',
      columns: [{ name: 'post_id', type: 'string' }]
    }),
  ]
})