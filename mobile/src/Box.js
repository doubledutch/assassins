import React, { PureComponent } from 'react'
import ReactNative, {
  Platform, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import Button from './Button'
import Text from './Text'
import client, { Color } from '@doubledutch/rn-client'
import colors from './colors'

export default class Box extends PureComponent {
  render() {
    return (
      <View style={[s.container, this.props.style]}>
        {this.props.children}
      </View>
    )
  }
}

const s = StyleSheet.create({
  container: {
    padding: 7,
    borderRadius: 5,
    borderColor: 'rgba(0,0,0, 0.25)',
    borderBottomWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.1)'
  }
})