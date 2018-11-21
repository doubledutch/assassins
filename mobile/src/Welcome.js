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
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { translate as t } from '@doubledutch/rn-client'
import Box from './Box'
import Button from './Button'
import Header from './Header'
import Text from './Text'
import Carousel from './Carousel'
import Smiley from './Smiley'
import { killMethodImages } from './images'

const helpTexts = [t('helpText1'), t('helpText2'), t('helpText3'), t('helpText4')]

export default class Welcome extends PureComponent {
  state = {
    showHelp: true,
    canAccept: false,
  }

  render() {
    const { showHelp, canAccept } = this.state
    const { currentUser } = this.props
    if (showHelp) {
      return (
        <View style={s.buttonBottomContainer}>
          <View>
            <Text style={s.welcome}>
              {t('welcomeAgent', { name: currentUser.lastName || currentUser.firstName })}
            </Text>
            <Carousel texts={helpTexts} onStepChange={this._onStepChange} style={s.carousel} />
          </View>
          <Button
            text={t('acceptMission')}
            onPress={this._accept}
            disabled={!canAccept}
            style={s.bottomButton}
          />
        </View>
      )
    }

    return this.renderMethodSelector()
  }

  _onStepChange = ({ step, stepCount }) => this.setState({ canAccept: step === stepCount - 1 })

  _accept = () => this.setState({ showHelp: false })

  renderMethodSelector() {
    const { killMethods } = this.props
    return (
      <ScrollView ref={sv => (this.scrollView = sv)}>
        <View style={s.buttonBottomContainer}>
          <View>
            <Header text={t('selectMethod')} />
            <View style={s.killMethodsContainer}>
              <Text>{t('chooseMethod')}</Text>
              <View style={s.killMethods}>
                {killMethods.map((m, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => this._selectKillMethod(i)}
                    style={s.killMethod}
                  >
                    <Box
                      style={[s.killMethodBox, this.state.killMethod === i ? s.highlighted : null]}
                    >
                      {this.renderPhoto(m)}
                      <Text style={s.killdes}>{m.description}</Text>
                    </Box>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <Button
            text={t('next')}
            style={s.bottomButton}
            onPress={this._confirmKillMethod}
            disabled={this.state.killMethod == null}
          />
        </View>
      </ScrollView>
    )
  }

  _selectKillMethod = killMethod => {
    this.setState({ killMethod })
    this.scrollView.scrollToEnd()
  }

  renderPhoto = m => {
    if (m.title === '😄') return <Smiley size={50} style={s.killMethodTitleComponent} />
    const image = killMethodImages[m.title]
    if (image)
      return <Image source={image} style={[s.killMethodTitleComponent, s.killMethodTitleImage]} />
    return <Text style={s.killMethodTitle}>{m.title}</Text>
  }

  _confirmKillMethod = () => {
    this.props.db.setPlayerKillMethod(`${this.state.killMethod}`)
  }
}

const s = StyleSheet.create({
  carousel: {
    height: 200,
  },
  welcome: {
    fontSize: 24,
    marginVertical: 15,
    marginLeft: 7,
  },
  bottomButton: {
    marginHorizontal: 7,
    marginVertical: 20,
  },
  buttonBottomContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerText: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 3,
  },
  killMethodTitle: {
    fontSize: 50,
    textAlign: 'center',
    paddingBottom: 5,
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
    padding: 7,
  },
  killMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginRight: 5,
  },
  killMethod: {
    paddingTop: 10,
    width: '49%',
  },
  highlighted: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  killMethodBox: {
    alignItems: 'center',
    minHeight: 190,
  },
})
