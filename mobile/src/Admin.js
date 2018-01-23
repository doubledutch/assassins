import React, { PureComponent } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import client, { Color } from '@doubledutch/rn-client'
import Button from './Button'
import Text from './Text'
import colors from './colors'

export default class Admin extends PureComponent {
  constructor() {
    super()
    this.state = { isExpanded: false }
  }

  render() {
    const { users, targets } = this.props
    return (
      <View style={s.main}>
        { targets
          ? (<View>
              <Text style={s.text}>Game already started</Text>
              <Button onPress={this._abortGame} text="Abort game" />
            </View>)
          : (<View>
              <Button onPress={this._startGame} text={`Start game with ${users.filter(u => !u.isExcluded).length} players`} />
            </View>)
        }
      </View>
    )
  }

  // Randomly assign targets as a single directed cycle including all players.
  _startGame = () => {
    const targets = {}
    const players = this.props.users.filter(u => !u.isExcluded)
    const firstPlayer = players.pop()
    let currentPlayer = firstPlayer
    while (players.length) {
      const targetIndex = Math.floor(Math.random() * players.length)
      const [ targetPlayer ] = players.splice(targetIndex, 1)
      targets[currentPlayer.id] = targetPlayer.id
      currentPlayer = targetPlayer
    }

    targets[currentPlayer.id] = firstPlayer.id

    this.props.fbc.database.public.adminRef('targets').set(targets)
  }

  _abortGame = () => {
    Alert.alert(
      'Abort Game',
      'Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => {
          this.props.fbc.database.public.adminRef('targets').remove()
          this.props.fbc.database.public.allRef('kills').remove()

          Alert.alert(
            'Clear players?',
            'Do you also want to remove all players who do not currently have the game open? They will have to re-enter to be included in future games.',
            [
              {text: 'No', style: 'cancel'},
              {text: 'Yes', onPress: () => this.props.fbc.database.public.usersRef().remove()}
            ]
          )
        }},
      ]
    )
  }

  _clearPlayers = () => {
  }
}

const s = StyleSheet.create({
  main: {
    padding: 5
  },
  text: {
    paddingVertical: 10
  },
  buttonText: {
    color: 'blue'
  }
})