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
      isGameInProgress: true // Assume game is in progress until we find out otherwise.
    }
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(() => {
      client.getUsers().then(attendees => this.setState({attendees}))

      const usersRef = fbc.database.public.usersRef()
      usersRef.on('child_added', data => {
        this.setState(state => ({players: [...state.players, {...data.val(), id: data.key}]}))
      })
      usersRef.on('child_removed', data => {
        this.setState(state => ({players: state.players.filter(p => p.id !== data.key)}))
      })

      fbc.database.public.adminRef('targets').on('value', data => {
        this.setState({isGameInProgress: !!data.val()})
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
                ? <div className="gameState">Game is in progress</div>
                : <div className="gameState">No game in progress</div>
              }
              <div className="userListContainer">
                <h4>Non-player Attendees ({nonPlayers.length})</h4>
                <ul className="userList">
                  { nonPlayers.map(user => this.renderUser(user, false)) }
                </ul>
              </div>
              <div className="userListContainer">
                <h4>Players ({players.length})</h4>
                <ul className="userList">
                { players.map(user => this.renderUser(user, true)) }
              </ul>
              </div>
            </div>
          : <div>Loading...</div>
        }
        {/* <button onClick={() => fbc.getLongLivedAdminToken().then(token=>console.log(token))}>Create long lived token</button> */}
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
        <span> {firstName} {lastName}</span>
      </li>
    )
  }

  addPlayer(user) {
    fbc.database.public.usersRef(user.id).set(user)
  }

  removePlayer(user) {
    fbc.database.public.usersRef(user.id).remove()
  }
}
