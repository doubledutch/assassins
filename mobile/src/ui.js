import React, { PureComponent } from 'react'
import { Platform, StyleSheet, Text as RNText, TouchableOpacity } from 'react-native'
import colors from './colors'

export class Text extends PureComponent {
  render() {
    return <RNText {...this.props} style={[s.text, this.props.style]} />
  }
}

export class Button extends PureComponent {
  render() {
    const { disabled, text } = this.props
    return (
      <TouchableOpacity {...this.props} style={[s.button, disabled ? s.buttonDisabled : null, this.props.style]}>
        <Text style={[s.buttonText, disabled ? s.buttonTextDisabled : null]}>{text}</Text>
      </TouchableOpacity>
    )
  }
}

const s = StyleSheet.create({
  text: {
    fontFamily: Platform.select({ios: 'AmericanTypewriter', android: 'normal'}),
    color: '#fff'
  },
  button: {
    borderWidth: 1,
    borderColor: colors.neon,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center'
  },
  buttonDisabled: {
    borderColor: colors.darkNeon
  },
  buttonText: {
    color: colors.neon,
    fontSize: 18
  },
  buttonTextDisabled: {
    color: colors.darkNeon
  }
})