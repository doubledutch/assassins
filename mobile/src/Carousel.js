import React, { PureComponent } from 'react'
import ReactNative, {
  Platform, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import { Button, Text } from './ui'
import client, { Color } from '@doubledutch/rn-client'
import colors from './colors'

export default class Welcome extends PureComponent {
  constructor() {
    super()
    this.state = {
      step: 0
    }
  }

  render() {
    const { step } = this.state
    const { texts } = this.props
    return (
      <View style={[s.carousel, this.props.style]}>
        <View style={s.textContainer}>
          <Text style={s.text}>{texts[step]}</Text>
        </View>
        <View style={s.carouselDots}>
          { texts.map((t, i) => <View key={i} style={[s.carouselDot, i === step ? s.carouselDotFilled : null]} />) }            
        </View>
        { step > 0 && <TouchableOpacity style={[s.arrow, s.arrowLeft]} onPress={this._prev}>
            <RNText style={s.arrowText}>←</RNText>
          </TouchableOpacity>
        }
        { step < texts.length - 1 && <TouchableOpacity style={[s.arrow, s.arrowRight]} onPress={this._next}>
            <RNText style={s.arrowText}>→</RNText>
          </TouchableOpacity>
        }
      </View>
    )
  }

  moveStep(increment) {
    const step = this.state.step + increment
    this.setState({step})
    this.props.onStepChange && this.props.onStepChange({step, stepCount: this.props.texts.length})
  }

  _next = () => this.moveStep(1)
  _prev = () => this.moveStep(-1)
}

const carouselDotSize = 10
const s = StyleSheet.create({
  textContainer: {
    paddingVertical: 4
  },
  text: {
    fontSize: 16
  },
  carousel: {
    margin: 7,
    padding: 7,
    borderRadius: 5,
    backgroundColor: colors.lightGray,
    justifyContent: 'space-between'
  },
  carouselDots: {
    flexDirection: 'row',
    padding: 6,
    justifyContent: 'center'
  },
  carouselDot: {
    borderRadius: carouselDotSize / 2,
    width: carouselDotSize,
    height: carouselDotSize,
    borderColor: colors.neon,
    borderWidth: 1,
    marginHorizontal: 3
  },
  carouselDotFilled: {
    backgroundColor: colors.neon
  },
  arrow: {
    position: 'absolute',
    paddingVertical: 7,
    paddingHorizontal: 10,
    bottom: 0,
  },
  arrowLeft: { left: 3 },
  arrowRight: { right: 3 },
  arrowText: {
    color: colors.neon,
    fontSize: 22
  }
})