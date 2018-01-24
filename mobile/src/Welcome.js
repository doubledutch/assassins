import React, { PureComponent } from 'react'
import ReactNative, {
  Platform, ScrollView, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import Box from './Box'
import Button from './Button'
import Header from './Header'
import Text from './Text'
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
      showHelp: false, //true,
      canAccept: false
    }
  }

  render() {
    const { showHelp, canAccept } = this.state
    if (showHelp) {
      return (
        <View style={s.buttonBottomContainer}>
          <View>
            <Text style={s.welcome}>Welcome, Agent {client.currentUser.lastName || client.currentUser.firstName}</Text>
            <Carousel texts={helpTexts} onStepChange={this._onStepChange} style={s.carousel} />
          </View>
          <Button text="ACCEPT MISSION" onPress={this._accept} disabled={!canAccept} style={s.bottomButton} />
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
      <View style={s.buttonBottomContainer}>
        <View>
          <Header text="Select Your Method" />
          <View style={s.killMethodsContainer}>
            <Text>Choose a method that enemy agents must use to eliminate you.</Text>
              <View style={s.killMethods}>
                { killMethods && killMethods.map(m => (
                  <TouchableOpacity key={m.id} onPress={() => this._selectKillMethod(m.id)} style={s.killMethod}>
                    <Box style={[s.killMethodBox, this.state.killMethod === m.id ? s.highlighted : null]}>
                      <Text style={s.killMethodTitle}>{m.title}</Text>
                      <Text>{m.description}</Text>
                    </Box>
                  </TouchableOpacity>
                )) }
              </View>
          </View>
        </View>
        <Button text="NEXT" style={s.bottomButton} onPress={this._confirmKillMethod} disabled={this.state.killMethod == null} />
      </View>
    )
  }

  _selectKillMethod = killMethod => {
    this.setState({killMethod})
  }

  _confirmKillMethod = () => {
    this.props.db.setPlayerKillMethod(`${this.state.killMethod}`)
  }
}

const s = StyleSheet.create({
  carousel: {
    height: 150
  },
  welcome: {
    fontSize: 24,
    marginVertical: 15,
    marginLeft: 7
  },
  bottomButton: {
    marginHorizontal: 7,
    marginVertical: 20
  },
  buttonBottomContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  centerText: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 3
  },
  killMethodTitle: {
    fontSize: 50,
    textAlign: 'center',
    paddingBottom: 5
  },
  killMethodsContainer: {
    padding: 7
  },
  killMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginRight: 5
  },
  killMethod: {
    paddingTop: 10,
    width: '49%'
  },
  highlighted: {
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  killMethodBox: {
    height: 175
  }
})