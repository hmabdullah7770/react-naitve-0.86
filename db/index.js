// src/db/index.js
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { mySchema } from './schema/Schema'
import Post from './models/Post'
import PendingFavourite from './models/PendingFavourite' // ✅ add this
import PendingRating from './models/PendingRating' // ✅ add this
import PendingRemoval from './models/PendingRemoval' 

// JSI is used automatically by SQLiteAdapter when available
const adapter = new SQLiteAdapter({
  schema: mySchema,
  // migrations: migrations, // add later
  jsi: true,               // ✅ ENABLE JSI HERE
  onSetUpError: error => {
    // Handle DB setup error (e.g. show error screen)
    console.error('WatermelonDB setup failed:', error)
  }
})

const database = new Database({
  adapter,
  modelClasses: [Post, PendingFavourite, PendingRating, PendingRemoval], // ✅ register models
})

export default database