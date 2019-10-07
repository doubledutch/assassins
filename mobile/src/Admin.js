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
import { Alert, StyleSheet, View, FlatList } from 'react-native'
import client, { Avatar, translate as t } from '@doubledutch/rn-client'
import Button from './Button'
import Text from './Text'

export default class Admin extends PureComponent {
  constructor() {
    super()
    this.state = {
      players: [],
      targets: null,
      kills: [],
      killsBy: {},
      killed: {},
    }
  }

  componentDidMount() {
    const { db } = this.props
    db.watchPlayers(this)
    db.watchTargets(this)
    db.watchKills(this)
  }

  render() {
    const { players, targets } = this.state
    return this.props.isExpanded ? (
      <View style={s.main}>
        {targets ? (
          <View>
            <Text style={s.text}>{t('gameStarted', { players: players.length })}</Text>
            <Button onPress={this._abortGame} text={t('abort')} />
          </View>
        ) : players.length > 1 ? (
          <Button onPress={this._startGame} text={t('startGame', { players: players.length })} />
        ) : (
          <Button disabled text={t('addMorePlayers')} />
        )}
        <View style={s.main}>
          <FlatList
            data={players}
            extraData={this.state}
            keyExtractor={this._keyExtractor}
            renderItem={this._renderListPlayer}
          />
        </View>
      </View>
    ) : null
  }

  _keyExtractor = p => p.id

  _renderListPlayer = ({ item }) => (
    <View style={s.listPlayer}>
      {this.state.targets ? (
        !this.state.killed[item.id] && (
          <Button style={s.remove} text="🛑" onPress={() => this.props.markAssassinated(item)} />
        )
      ) : (
        <Button style={s.remove} text="❌️" onPress={() => this._removePlayer(item)} />
      )}
      <Avatar user={item} size={40} client={client} />
      <Text style={s.listPlayerText}>{this.truncateName(item)}</Text>
    </View>
  )

  _removePlayer = player => {
    Alert.alert(t('removePlayer', { player: this.truncateName(player) }), t('undoneCMS'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        onPress: () => {
          this.props.db.removePlayer(player)
        },
      },
    ])
  }

  truncateName = user => {
    let name = `${user.firstName} ${user.lastName}`
    if (name.length > 20) {
      name = `${name.substring(0, 20)}...`
    }
    return name
  }

  // Randomly assign targets as a single directed cycle including all players.
  _startGame = () => {
    const targets = {}
    const players = this.state.players.slice()
    const firstPlayer = players.pop()
    let currentPlayer = firstPlayer
    while (players.length) {
      const targetIndex = Math.floor(Math.random() * players.length)
      const [targetPlayer] = players.splice(targetIndex, 1)
      targets[currentPlayer.id] = targetPlayer.id
      currentPlayer = targetPlayer
    }

    targets[currentPlayer.id] = firstPlayer.id

    this.props.db.setTargets(targets)
  }

  _abortGame = () => {
    const { db } = this.props
    Alert.alert(t('abort'), t('sure'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'OK',
        onPress: () => {
          db.removeTargets()
          db.removeKills()
        },
      },
    ])
  }
}

const s = StyleSheet.create({
  main: {
    flex: 1,
    padding: 5,
  },
  text: {
    paddingVertical: 10,
  },
  buttonText: {
    color: 'blue',
  },
  list: {
    flex: 1,
  },
  listPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  listPlayerText: {
    fontSize: 18,
    marginLeft: 5,
  },
  remove: {
    marginRight: 10,
  },
})
