import React, { PureComponent } from 'react'
import ReactNative, {
  Platform, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import { Button, Text } from './ui'
import client, { Color } from '@doubledutch/rn-client'
import colors from './colors'

const helpTexts = [
  "We've detected some enemy agents in your area. Your mission, should you choose to accept it, is to avoid detection and eliminate the rival agents.",
  "Once you accept your mission, you will choose the method other agents must use to try to eliminate you, at which point we will send you your first target.",
  "After eliminating the enemy agent, mark your victory by scanning the agent's QR code with your phone. Your next target will be assigned after this confirmation.",
  "Are you ready?"
]

export default class Welcome extends PureComponent {
  constructor() {
    super()
    this.state = {
      showHelp: true,
      helpStep: 0
    }
  }

  render() {
    const { killMethods } = this.props

    if (this.state.showHelp) return this.renderHelp()

    return (
      <View style={s.killMethods}>
        <Text style={s.centerText}>Select the method your secret assassin should try to use to take you down:</Text>
        { killMethods && killMethods.map(m => (
          <TouchableOpacity key={m.id} onPress={() => this._selectKillMethod(m.id)} style={s.killMethod}>
            <Text style={s.killMethodTitle}>{m.title}</Text>
            <Text>{m.description}</Text>
          </TouchableOpacity>
        )) }
      </View>
    )
  }

  renderHelp() {
    const { helpStep } = this.state
    return (
      <View style={s.container}>
        <View>
          <Text style={s.welcome}>Welcome, Agent {client.currentUser.lastName || client.currentUser.firstName}</Text>
          <View style={s.carousel}>
            <View style={s.helpTextContainer}>
              <Text style={s.helpText}>{helpTexts[helpStep]}</Text>
            </View>
            <View style={s.carouselDots}>
              { helpTexts.map((t, i) => <View key={i} style={[s.carouselDot, i === helpStep ? s.carouselDotFilled : null]} />) }            
            </View>
            { helpStep > 0 && <TouchableOpacity style={[s.arrow, s.arrowLeft]} onPress={this._prevHelp}>
                <RNText style={s.arrowText}>←</RNText>
              </TouchableOpacity>
            }
            { helpStep < helpTexts.length - 1 && <TouchableOpacity style={[s.arrow, s.arrowRight]} onPress={this._nextHelp}>
                <RNText style={s.arrowText}>→</RNText>
              </TouchableOpacity>
            }
          </View>
        </View>
        <Button text="ACCEPT MISSION" onPress={this._accept} disabled={helpStep < helpTexts.length - 1} style={s.accept} />
      </View>
    )
  }

  _nextHelp = () => this.setState(state => ({helpStep: state.helpStep + 1}))
  _prevHelp = () => this.setState(state => ({helpStep: state.helpStep - 1}))
  _accept = () => this.setState({showHelp: false})

  _selectKillMethod = killMethod => {
    this.props.fbc.database.public.userRef('user').child('killMethod').set(`${killMethod}`)
  }

}

const carouselDotSize = 10
const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  welcome: {
    fontSize: 24,
    marginVertical: 15,
    marginLeft: 7
  },
  helpTextContainer: {
    height: 125,
    paddingVertical: 4
  },
  helpText: {
    fontSize: 16
  },
  carousel: {
    margin: 7,
    padding: 7,
    borderRadius: 5,
    backgroundColor: colors.lightGray
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
  },
  accept: {
    marginHorizontal: 7,
    marginVertical: 20
  },

  killMethods: {
    margin: 10
  },
  centerText: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 3
  },
  killMethodTitle: {
    fontSize: 24,
    paddingBottom: 5
  },
  killMethod: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: new Color({...(new Color(client.primaryColor)).hsv(), s: 0.4, v: 1.0}).rgbString()    
  }
})