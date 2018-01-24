import React, { PureComponent } from 'react'
import { StyleSheet, View } from 'react-native'
import Text from './Text'

export default props => (
  <View style={s.selectTitle}>
    <Text style={s.selectTitleText}>{props.text}</Text>
  </View>
)

const s = StyleSheet.create({
  selectTitle: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  selectTitleText: {
    fontSize: 18
  }
})
