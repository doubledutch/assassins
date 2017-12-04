import React, { PureComponent } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import client, { Color } from '@doubledutch/rn-client'

export default class Admin extends PureComponent {
  constructor() {
    super()
    this.state = { isExpanded: false }
  }

  render() {
    const { users, targets } = this.props
    return (
      <View style={s.container}>
        <TouchableOpacity style={s.header} onPress={this._toggleAdmin}>
          <Text style={s.headerText}>{ this.state.isExpanded ? 'Hide' : 'Show' } admin panel</Text>
        </TouchableOpacity>
        { this.state.isExpanded && <View style={s.main}>
          { targets
            ? (<View>
                <Text>Game already started</Text>
                <TouchableOpacity onPress={this._abortGame}><Text style={s.buttonText}>Abort game</Text></TouchableOpacity>
              </View>)
            : (<View>
              <TouchableOpacity onPress={this._startGame}><Text style={s.buttonText}>Start game with {users.length} players</Text></TouchableOpacity>
            </View>)}
        </View> }
        <View>
        </View>
      </View>
    )
  }

  _toggleAdmin = () => {
    this.setState({isExpanded: !this.state.isExpanded})
  }

  // Randomly assign targets as a single directed cycle including all players.
  _startGame = () => {
    const targets = {}
    const players = this.props.users.slice()
    const firstPlayer = players.pop()
    let currentPlayer = firstPlayer
    while (players.length) {
      const targetIndex = Math.floor(Math.random() * users.length)
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
  container: {
    backgroundColor: new Color({...(new Color(client.primaryColor)).hsv(), s: 0.4, v: 1.0}).rgbString()    
  },
  header: {
    padding: 5,
  },
  headerText: {
    fontSize: 16,
    textAlign: 'center'
  },
  main: {
    padding: 10
  },
  buttonText: {
    color: 'blue'
  }
})