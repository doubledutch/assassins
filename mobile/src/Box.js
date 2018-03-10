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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 5,
    borderColor: 'rgba(0,0,0, 0.25)',
    borderBottomWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.1)'
  }
})