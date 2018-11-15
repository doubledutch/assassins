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
import { Platform, StyleSheet, Text as RNText } from 'react-native'
import colors from './colors'

export default class Text extends PureComponent {
  render() {
    return <RNText {...this.props} style={[s.text, this.props.style]} />
  }
}

const s = StyleSheet.create({
  text: {
    backgroundColor: 'transparent',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'Droid Sans' }),
    color: '#fff',
  },
})
