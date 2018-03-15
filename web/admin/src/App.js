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

import React, { Component } from 'react'
import './App.css'
import client from '@doubledutch/admin-client'
import Avatar from './Avatar'
import FirebaseConnector from '@doubledutch/firebase-connector'
const fbc = FirebaseConnector(client, 'assassins')
fbc.initializeAppWithSimpleBackend()

export default class App extends Component {
  constructor() {
    super()

    this.state = {
      players: [],
      admins: [],
      isGameInProgress: true // Assume game is in progress until we find out otherwise.
    }
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(() => {
      client.getUsers().then(attendees => {
        this.setState({attendees: attendees.sort(sortPlayers)})
        const usersRef = fbc.database.public.usersRef()
        usersRef.on('child_added', data => {
          var player = attendees.find(a => a.id === data.key)
          if (player){
            this.setState(state => ({players: [...state.players, {...data.val(), id: data.key}].sort(sortPlayers)}))
          }
          else {
            fbc.database.public.usersRef(data.key).remove()
          }
        })
        usersRef.on('child_removed', data => {
          this.setState(state => ({players: state.players.filter(p => p.id !== data.key)}))
        })
        fbc.database.public.adminRef('targets').on('value', data => {
          this.setState({isGameInProgress: !!data.val()})
        })
        fbc.database.private.adminableUsersRef().on('value', data => {
          const users = data.val() || {}
          this.setState({admins: Object.keys(users).filter(id => users[id].adminToken)})
        })
      })
    })
  }

  render() {
    const {attendees, players, isGameInProgress} = this.state
    const playersById = players.reduce((players, player) => { players[player.id] = player; return players; }, {})
    const nonPlayers = attendees ? attendees.filter(a => !playersById[a.id]) : null
    return (
      <div className="App">
        { attendees
          ? <div>
              { isGameInProgress
                ? <div className="gameState">Game is in progress <button onClick={this.abortGame}>Abort</button></div>
                : <div className="gameState">No game in progress (Attendees marked as game admin can start a game)</div>
              }
              <div className="userListContainer">
                <h4>Non-player Attendees ({nonPlayers.length}) <button disabled={isGameInProgress || !nonPlayers || !nonPlayers.length} onClick={this.addAllPlayers}>Add ALL &gt;&gt;</button></h4>
                <ul className="userList">
                  { nonPlayers.map(user => this.renderUser(user, false)) }
                </ul>
              </div>
              <div className="userListContainer">
                <h4>Players ({players.length}) <button disabled={isGameInProgress || !players.length} onClick={this.removeAllPlayers}>&lt;&lt; Remove ALL</button></h4>
                <ul className="userList">
                { players.map(user => this.renderUser(user, true)) }
              </ul>
              </div>
            </div>
          : <div>Loading...</div>
        }
      </div>
    )
  }

  renderUser(user, isPlayer) {
    const { id, firstName, lastName } = user
    const action = isPlayer ? this.removePlayer : this.addPlayer
    const actionText = isPlayer ? '< Remove' : 'Add >' 
    return (
      <li key={id}>
        { !this.state.isGameInProgress && <button className="move" onClick={() => action(user)}>{actionText}</button> }
        <Avatar user={user} size={30} />
        <p> {firstName} {lastName}</p>
        { this.isAdmin(id)
            ? <button className="is admin" onClick={()=>this.setAdmin(id, false)}>Remove admin</button>
            : <button className="admin" onClick={()=>this.setAdmin(id, true)}>Make admin</button>
        }
      </li>
    )
  }

  isAdmin(id) {
    return this.state.admins.includes(id)
  }

  setAdmin(userId, isAdmin) {
    const tokenRef = fbc.database.private.adminableUsersRef(userId).child('adminToken')
    if (isAdmin) {
      this.setState()
      fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
    } else {
      tokenRef.remove()
    }
  }

  addPlayer(user) {
    fbc.database.public.usersRef(user.id).set(user)
  }
  addAllPlayers = () => {
    const {attendees, players} = this.state
    const playersById = players.reduce((players, player) => { players[player.id] = player; return players; }, {})
    const nonPlayers = attendees ? attendees.filter(a => !playersById[a.id]) : null
    if (window.confirm(`Are you sure you want to add all ${nonPlayers.length} attendees as players?`)) {
      attendees.forEach(this.addPlayer)
    }
  }

  removePlayer(user) {
    fbc.database.public.usersRef(user.id).remove()
  }
  removeAllPlayers = () => {
    const {players} = this.state
    if (window.confirm(`Are you sure you want to remove all ${players.length} players?`)) {
      players.forEach(this.removePlayer)
    }
  }
  abortGame = () => {
    if (window.confirm(`Are you sure you want to abort this game with ${this.state.players.length} players?`)) {
      const killsRef = fbc.database.public.allRef('kills')
      const targetsRef = fbc.database.public.adminRef('targets')
      killsRef.remove()
      targetsRef.remove()
    }
  }
}

function sortPlayers(a,b) {
  const aFirst = (a.firstName || '').toLowerCase()
  const bFirst = (b.firstName || '').toLowerCase()
  const aLast = (a.lastName || '').toLowerCase()
  const bLast = (b.lastName || '').toLowerCase()
  if (aFirst !== bFirst) return aFirst < bFirst ? -1 : 1
    return aLast < bLast ? -1 : 1
}
