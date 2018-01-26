import React, { PureComponent } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import colors from './colors'

const borderRatio = 0.075
export default class Smiley extends PureComponent {
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

export class SmileyRain extends PureComponent {
  state = {}
  startRain(animation) {
    const slant = this.props.slant || 0.3
    animation.x = Math.random()*(1.1+slant)
    animation.y = -Math.random()-1
    animation.anim.setValue(0)
    Animated.timing(animation.anim, {
      toValue: 1,
      duration: Math.random()*2000 + 1000,
      easing: Easing.linear,
      useNativeDriver: true
    }).start(() => this.startRain(animation))
  }

  _onLayout = e => {
    this.setState({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height
    })

    const count = this.props.count || 25
    this.animations = []
    for (i = 0; i < count; i++) {
      this.animations[i] = {anim: new Animated.Value(0)}
      this.startRain(this.animations[i])
    }
  }

  render() {
    const slant = this.props.slant || 0.3
    const {width, height} = this.state
    return (
      <View style={[{position:'absolute', width:'100%', height:'100%', overflow:'hidden'}, this.props.style]} onLayout={this._onLayout}>
        { !!width && this.animations.map((a,i) => (
          <Animated.View
              key={i}
              style={{
                position: 'absolute',
                transform: [
                  {translateY: a.anim.interpolate({inputRange:[0, 1], outputRange: [a.y*height, height]})},
                  {translateX: a.anim.interpolate({inputRange:[0, 1], outputRange: [a.x*width, (a.x-slant)*width]})}
                ] 
              }}>
            <Smiley size={this.props.size || 30} />
          </Animated.View>))
        }        
      </View>
    )
  }
}