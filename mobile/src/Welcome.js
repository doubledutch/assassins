import React, { PureComponent } from 'react'
import ReactNative, {
  Platform, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import { Button, Text } from './ui'
import Carousel from './Carousel'
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
      canAccept: false
    }
  }

  render() {
    const { showHelp, canAccept } = this.state
    if (showHelp) {
      return (
        <View style={s.container}>
          <Text style={s.welcome}>Welcome, Agent {client.currentUser.lastName || client.currentUser.firstName}</Text>
          <View style={s.helpContainer}>
            <Carousel texts={helpTexts} onStepChange={this._onStepChange} style={s.carousel} />
            <Button text="ACCEPT MISSION" onPress={this._accept} disabled={!canAccept} style={s.accept} />
          </View>
        </View>
      )
    }

    return this.renderMethodSelector()
  }

  _onStepChange = ({step, stepCount}) => this.setState({canAccept: step === stepCount - 1})
  _accept = () => this.setState({showHelp: false})

  renderMethodSelector() {
    const { killMethods } = this.props
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

  _selectKillMethod = killMethod => {
    this.props.fbc.database.public.userRef('user').child('killMethod').set(`${killMethod}`)
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1
  },
  carousel: {
    height: 150
  },
  welcome: {
    fontSize: 24,
    marginVertical: 15,
    marginLeft: 7
  },
  accept: {
    marginHorizontal: 7,
    marginVertical: 20
  },
  helpContainer: {
    flex: 1,
    justifyContent: 'space-between'
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