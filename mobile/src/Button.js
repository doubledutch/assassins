/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { PureComponent } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import Text from './Text'
import colors from './colors'

export default class Button extends PureComponent {
  render() {
    const { children, disabled, style, text } = this.props
    return (
      <TouchableOpacity
        {...this.props}
        style={[s.button, disabled ? s.buttonDisabled : null, style]}
      >
        {children}
        <Text style={[s.buttonText, disabled ? s.buttonTextDisabled : null]}>
          {children ? ' ' : ''}
          {text}
        </Text>
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
    justifyContent: 'center',
  },
  buttonDisabled: {
    borderColor: colors.darkNeon,
  },
  buttonText: {
    color: colors.neon,
    fontSize: 18,
  },
  buttonTextDisabled: {
    color: colors.darkNeon,
  },
})
