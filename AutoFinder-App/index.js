import { registerRootComponent } from 'expo';
import React from 'react';

// Ensure React is globally available for packages that expect it
if (typeof global !== 'undefined') {
  global.React = React;
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
