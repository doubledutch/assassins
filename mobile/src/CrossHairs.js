import React, { Component } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Text from './Text'
import colors from './colors'

const borderRatio = 0.075
export default class CrossHairs extends Component {
  rotation = new Animated.Value(0)

  componentDidMount() {
    this.props.rotate && this.startRotation()
  }

  startRotation() {
    this.rotation.setValue(0)
    Animated.timing(this.rotation, {
      toValue: 1,
      duration: 15000,
      useNativeDriver: true,
      easing: Easing.linear
    }).start(() => this.startRotation())
  }

  render() {
    const {size, text} = this.props
    const color = this.props.color || colors.neon
    return (
      <View style={{height: size, width: size}}>
        <Animated.View style={this.getViewStyle(size, color)}>
          <View style={{position: 'absolute', backgroundColor:color, borderRadius:size*0.01, height:size*borderRatio, width:size*0.15, top:size*(0.5-1.5*borderRatio), left:-size*.01}} />
          <View style={{position: 'absolute', backgroundColor:color, borderRadius:size*0.01,  height:size*borderRatio, width:size*0.15, top:size*(0.5-1.5*borderRatio), right:-size*.01}} />
          <View style={{position: 'absolute', backgroundColor:color, borderRadius:size*0.01,  height:size*0.15, width:size*borderRatio, top:-size*.01, left:size*(0.5-1.5*borderRatio)}} />
          <View style={{position: 'absolute', backgroundColor:color, borderRadius:size*0.01,  height:size*0.15, width:size*borderRatio, bottom:-size*.01, left:size*(0.5-1.5*borderRatio)}} />
        </Animated.View>
        { text
            ? <View style={{position: 'absolute', height:size, width:size, justifyContent: 'center', alignContent: 'center', padding: size*0.2}}>
                <Text style={this.getTextStyle(size, color)}>{text}</Text>
              </View>
            : null
        }
      </View>
    )
  }

  getViewStyle(size, color) {
    const rotate = this.rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    })
    return {
      transform: [{rotate}],
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: color,
      borderRadius: size / 2,
      borderWidth: size * borderRatio
    }
  }

  getTextStyle(size, color) {
    return {
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontSize: size * 0.09,
      color: color
    }
  }
}
