import React, { PureComponent } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import Text from './Text'
import colors from './colors'

export default class Button extends PureComponent {
  render() {
    const { children, disabled, style, text } = this.props
    return (
      <TouchableOpacity {...this.props} style={[s.button, disabled ? s.buttonDisabled : null, style]}>
        {children}
        <Text style={[s.buttonText, disabled ? s.buttonTextDisabled : null]}>{children?' ':''}{text}</Text>
      </TouchableOpacity>
    )
  }
}

const s = StyleSheet.create({
  button: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.neon,
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center'
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
