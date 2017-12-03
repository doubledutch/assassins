import { AppRegistry } from 'react-native'
import HomeView from './src/home-view'
import { install } from '@doubledutch/rn-client/webShim'

function runApp(DD) {
  AppRegistry.registerComponent('assassins', () => HomeView)
  AppRegistry.runApplication('assassins', {
    rootTag: document.getElementById('react-root'),
    initialProps: { ddOverride: DD }
  })
}

if (window.DD && window.DD.Events) {
  install(runApp)
} else {
  runApp(null)
}
