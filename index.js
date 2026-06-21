/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import database from './db';
import FEATURE_FLAGS from './config/featureFlags'; // ← import flag

async function prepareApp() {
  try {

    // ✅ CHECK FIRST — should we even use WatermelonDB?
    if (!FEATURE_FLAGS.USE_WATERMELON_DB) {
      console.log('🚫 WatermelonDB is DISABLED — skipping cache load');
      return; // skip everything, go straight to app
    }

    // ── WatermelonDB is ENABLED — load cache ──
    console.log('⚡ WatermelonDB ENABLED — loading cache...');
    const start = Date.now();

    await Promise.all([
      database.collections.get('posts').query().fetch(),
      // database.collections.get('comments').query().fetch(),
      // database.collections.get('users').query().fetch(),
    ]);

    console.log(`✅ Cache loaded in ${Date.now() - start}ms`);

  } catch (error) {
    console.warn('⚠️ Cache load failed, continuing anyway:', error);
  }
}


  AppRegistry.registerComponent(appName, () => App);

  prepareApp();



// /**
//  * @format
//  */

// // import './ReactotronConfig'
// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';
// import database from './db'




// AppRegistry.registerComponent(appName, () => App);

