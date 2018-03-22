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
  Image, Platform, ScrollView, StyleSheet, Text as RNText, TouchableOpacity, View
} from 'react-native'
import Box from './Box'
import Button from './Button'
import Header from './Header'
import Text from './Text'
import Carousel from './Carousel'
import Smiley from './Smiley'
import client, { Color } from '@doubledutch/rn-client'
import colors from './colors'
import { killMethodImages } from './images'

const helpTexts = [
  "We've detected some target agents in your area. Your mission, should you choose to accept it, is to avoid detection and eliminate the rival agents.",
  "Once you accept your mission, you will choose your method that target agents must use when attempting to eliminate you from the mission. After this selection, you'll be sent your first target.",
  "After eliminating the target agent, mark your victory by scanning the agent's secret code with your phone. Your next target will be assigned after this confirmation.",
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
          <Header text="Select Elimination Method" />
          <View style={s.killMethodsContainer}>
            <Text>Choose a method that target agents must use to eliminate you.</Text>
              <View style={s.killMethods}>
                { killMethods.map((m,i) => (
                  <TouchableOpacity key={i} onPress={() => this._selectKillMethod(i)} style={s.killMethod}>
                    <Box style={[s.killMethodBox, this.state.killMethod === i ? s.highlighted : null]}>
                      {this.renderPhoto(m)}
                      <Text style={s.killdes}>{m.description}</Text>
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

  renderPhoto = (m) => {
    if (this.props.height > 650){
      if (m.title === '😄') return <Smiley size={50} style={s.killMethodTitleComponent} />
      const image = killMethodImages[m.title]
      if (image) return <Image source={image} style={[s.killMethodTitleComponent, s.killMethodTitleImage]} />
      return (
        <Text style={s.killMethodTitle}>{m.title}</Text>
      )
    }
  }

  _confirmKillMethod = () => {
    this.props.db.setPlayerKillMethod(`${this.state.killMethod}`)
  }
}

const s = StyleSheet.create({
  carousel: {
    height: 200
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
  killMethodTitleComponent: {
    marginTop: 6,
    marginBottom: 15,
    height: 50,
  },
  killMethodTitleImage: {
    width: '100%',
    resizeMode: 'contain',
  },
  killdes: {
    padding: 0,
    marginBottom: 10,
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
    width: '49%',
  },
  highlighted: {
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  killMethodBox: {
    alignItems: 'center',
    minHeight: 175
  }
})