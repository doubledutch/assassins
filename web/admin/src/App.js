import React, { Component } from 'react'
import './App.css'

import client from '@doubledutch/admin-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
const fbc = FirebaseConnector(client, 'assassins')

fbc.initializeAppWithSimpleBackend()

export default class App extends Component {
  constructor() {
    super()

    this.state = { sharedTasks: [] }
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(() => {
    })
  }

  render() {
    return (
      <div className="App">
        <p className="App-intro">
          Assassins admin
        </p>
        <h3>TBD:</h3>
        <button onClick={() => fbc.getLongLivedAdminToken().then(token=>console.log(token))}>Create long lived token</button>
        <ul>
          { this.state.sharedTasks.map(task => {
            const { image, firstName, lastName } = task.creator
            return (
              <li key={task.key}>
                <img className="avatar" src={image} alt="" />
                <span> {firstName} {lastName} - {task.text} - </span>
                <button onClick={()=>this.markComplete(task)}>Mark complete</button>
              </li>
            )
          }) }
        </ul>
      </div>
    )
  }

  markComplete(task) {
    fbc.database.public.allRef('tasks').child(task.key).remove()
  }
}
