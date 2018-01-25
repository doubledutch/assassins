import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import colors from './colors'

const borderRatio = 0.075
export default class Smiley extends Component {
  render() {
    const {size} = this.props
    const color = this.props.color || colors.neon
    const eyeRadius = size * 0.075
    const smileWidth = size * 0.57
    const smileRadius = smileWidth / 2
    return (
      <View style={{height: size, width: size, borderRadius:size/2, backgroundColor:'white'}}>
        <View style={{flex:1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop:size*0.12, paddingHorizontal:size*.17}}>
          <View style={{width:eyeRadius*2, height:eyeRadius*2, borderRadius:eyeRadius, backgroundColor:colors.gray}} />
          <View style={{width:eyeRadius*2, height:eyeRadius*2, borderRadius:eyeRadius, backgroundColor:colors.gray}} />
        </View>
        <View style={{flex:1, alignItems: 'center'}}>
          <View style={{borderColor:colors.gray, borderWidth:size*0.062, marginTop:size*.03, backgroundColor:colors.neon, width:smileWidth, height:smileWidth/2, borderBottomLeftRadius:smileRadius, borderBottomRightRadius:smileRadius}} />
        </View>
      </View>
    )
  }
}
