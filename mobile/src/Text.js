import React, { PureComponent } from 'react'
import { Platform, StyleSheet, Text as RNText } from 'react-native'
import colors from './colors'

export default class Text extends PureComponent {
  render() {
    return <RNText {...this.props} style={[s.text, this.props.style]} />
  }
}

const s = StyleSheet.create({
  text: {
    fontFamily: Platform.select({ios: 'AmericanTypewriter', android: 'normal'}),
    color: '#fff'
  }
})
