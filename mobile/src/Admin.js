import React, { PureComponent } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View, FlatList } from 'react-native'
import client, { Avatar, Color } from '@doubledutch/rn-client'
import Button from './Button'
import Text from './Text'
import colors from './colors'

export default class Admin extends PureComponent {
  constructor() {
    super()
    this.state = {
      players: [],
      targets: null,
      kills: [],
      killsBy: {},
      killed: {}
    }
  }

  componentDidMount() {
    const {db} = this.props
    db.watchPlayers(this)
    db.watchTargets(this)
    db.watchKills(this)
  }

  render() {
    const { players, targets } = this.state
    return (
      this.props.isExpanded
      ? <View style={s.main}>
          { targets
            ? <View>
                <Text style={s.text}>Game already started with {players.length} players</Text>
                <Button onPress={this._abortGame} text="Abort game" />
              </View>
            : players.length > 1
              ? <Button onPress={this._startGame} text={`Start game with ${players.length} players`} />
              : <Button disabled={true} text="Add more players via CMS" />
          }
          <View style={s.main}>
            <FlatList
              data={players}
              extraData={this.state}
              keyExtractor={this._keyExtractor}
              renderItem={this._renderListPlayer}
            />
          </View>
        </View>
      : null
    )
  }

  _keyExtractor = p => p.id

  _renderListPlayer = ({item}) => (
    <View style={s.listPlayer}>
      { this.state.targets
        ? (!this.state.killed[item.id] && <Button style={s.remove} text="☠️" onPress={() => this.props.markAssassinated(item)} />)
        : <Button style={s.remove} text="❌️" onPress={() => this._removePlayer(item)} />
      }
      <Avatar user={item} size={40} client={client} />
      <Text style={s.listPlayerText}>{this.truncateName(item)}</Text>
    </View>
  )

  _removePlayer = player => {
    Alert.alert(
      `Remove ${this.truncateName(player)}?`,
      'This can only be undone from the CMS.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Remove', onPress: () => {
          this.props.db.removePlayer(player)
        }},
      ]
    )
  }

  truncateName = (user) => {
    var name = user.firstName + " " + user.lastName
    if (name.length > 20) {
      name = name.substring(0, 20) + "..."
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
      const [ targetPlayer ] = players.splice(targetIndex, 1)
      targets[currentPlayer.id] = targetPlayer.id
      currentPlayer = targetPlayer
    }

    targets[currentPlayer.id] = firstPlayer.id

    this.props.db.setTargets(targets)
  }

  _abortGame = () => {
    const {db} = this.props
    Alert.alert(
      'Abort Game',
      'Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => {
          db.removeTargets()
          db.removeKills()
        }},
      ]
    )
  }
}

const s = StyleSheet.create({
  main: {
    flex: 1,
    padding: 5
  },
  text: {
    paddingVertical: 10
  },
  buttonText: {
    color: 'blue'
  },
  list: {
    flex: 1
  },
  listPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5
  },
  listPlayerText: {
    fontSize: 18,
    marginLeft: 5
  },
  remove: {
    marginRight: 10
  }
})