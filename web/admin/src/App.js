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
import './App.css'
import client from '@doubledutch/admin-client'
import Avatar from './Avatar'
import {provideFirebaseConnectorToReactComponent} from '@doubledutch/firebase-connector'
const defaultKillMethods = [
  {title: '📇', description: 'You accept a business card from the target agent', instructions: 'Hand your business card to the target'},
  {title: '😄', description: 'The target agent places a sticker on you without you knowing', instructions: 'Place a sticker on the target without them knowing'},
  {title: '📸', description: 'The target agent takes a photo with you and him/herself', instructions: 'Take a photo with yourself and the target'},
  {title: '🙂', description: '', instructions: ''}
]

class App extends PureComponent {
  state = {
    players: [],
    admins: [],
    killMethods: defaultKillMethods,
    isGameInProgress: true // Assume game is in progress until we find out otherwise.
  }

  componentDidMount() {
    const {fbc} = this.props
    fbc.signinAdmin()
    .then(() => {
      client.getAttendees().then(attendees => {
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
        fbc.database.public.adminRef('killMethods').on('value', data => {
          const val = data.val()
          if (val) {
            const killMethods = Object.keys(val).reduce((arr, i) => {arr[+i] = {...val[i], id: +i}; return arr}, []);
            this.setState({killMethods})
          } else {
            fbc.database.public.adminRef('killMethods').set(defaultKillMethods)
          }
        })
      })
    })
  }

  render() {
    const {attendees, killMethods, players, isGameInProgress} = this.state
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
              <div>
                <h4>Custom Elimination Methods <button onClick={this.resetMethods}>Reset</button></h4>
                <ol className="methods">
                  {[0,1,2,3].map(i => (
                    <li key={i}>
                      <input type="text" maxLength={2} className="method-icon" value={killMethods[i].title} onChange={this.updateMethodTitle(i)} />
                      <input type="text" maxLength={65} placeholder="Description" className="method-description" value={killMethods[i].description} onChange={this.updateMethodDescription(i)} />
                      <input type="text" maxLength={65} placeholder="Instructions" className="method-instructions" value={killMethods[i].instructions} onChange={this.updateMethodInstructions(i)} />
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          : <div>Loading...</div>
        }
      </div>
    )
  }

  renderUser(user, isPlayer) {
    const { id, firstName, lastName } = user
    const action = isPlayer ? x => this.removePlayer(x) : x => this.addPlayer(x)
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
    const {fbc} = this.props
    const tokenRef = fbc.database.private.adminableUsersRef(userId).child('adminToken')
    if (isAdmin) {
      this.setState()
      fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
    } else {
      tokenRef.remove()
    }
  }

  addPlayer(user) {
    this.props.fbc.database.public.usersRef(user.id).set(user)
  }
  addAllPlayers = () => {
    const {attendees, players} = this.state
    const playersById = players.reduce((players, player) => { players[player.id] = player; return players; }, {})
    const nonPlayers = attendees ? attendees.filter(a => !playersById[a.id]) : null
    if (window.confirm(`Are you sure you want to add all ${nonPlayers.length} attendees as players?`)) {
      attendees.forEach(p => this.addPlayer(p))
    }
  }

  removePlayer(user) {
    this.props.fbc.database.public.usersRef(user.id).remove()
  }
  removeAllPlayers = () => {
    const {players} = this.state
    if (window.confirm(`Are you sure you want to remove all ${players.length} players?`)) {
      players.forEach(p => this.removePlayer(p))
    }
  }
  abortGame = () => {
    const {fbc} = this.props
    if (window.confirm(`Are you sure you want to abort this game with ${this.state.players.length} players?`)) {
      const killsRef = fbc.database.public.allRef('kills')
      const targetsRef = fbc.database.public.adminRef('targets')
      killsRef.remove()
      targetsRef.remove()
    }
  }

  updateMethodTitle = index => e => this.props.fbc.database.public.adminRef('killMethods').child(index).update({title: e.target.value})
  updateMethodDescription = index => e => this.props.fbc.database.public.adminRef('killMethods').child(index).update({description: e.target.value})
  updateMethodInstructions = index => e => this.props.fbc.database.public.adminRef('killMethods').child(index).update({instructions: e.target.value})
  resetMethods = () => {
    if (window.confirm('Are you sure you want to reset the elimination methods back to the defaults?')) {
      this.props.fbc.database.public.adminRef('killMethods').set(defaultKillMethods)
    }
  }
}

export default provideFirebaseConnectorToReactComponent(client, 'assassins', (props, fbc) => <App {...props} fbc={fbc} />, PureComponent)

function sortPlayers(a,b) {
  const aFirst = (a.firstName || '').toLowerCase()
  const bFirst = (b.firstName || '').toLowerCase()
  const aLast = (a.lastName || '').toLowerCase()
  const bLast = (b.lastName || '').toLowerCase()
  if (aFirst !== bFirst) return aFirst < bFirst ? -1 : 1
    return aLast < bLast ? -1 : 1
}
