import React, {PureComponent } from 'react'
import ReactNative, {
  FlatList, TouchableOpacity, Text, TextInput, View, ScrollView
} from 'react-native'

import Admin from './Admin'

import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import firebase from 'firebase'
const fbc = FirebaseConnector(client, 'assassins')

fbc.initializeAppWithSimpleBackend()
console.disableYellowBox = true

export default class HomeView extends PureComponent {
  constructor() {
    super()

    this.state = {
      users: [],
      targets: null,
      killsBy: {'24601': [client.currentUser.id]}
    }

    this.signin = fbc.signin().then(() => this.setState({isSignedIn: true}))
  }

  componentDidMount() {
    this.signin.then(() => {
      fbc.database.private.adminableUserRef('adminToken').once('value', data => {
        const longLivedToken = data.val()
        if (longLivedToken) {
          firebase.auth().signOut()
          client.longLivedToken = longLivedToken
          fbc.signinAdmin().then(() => {
            this.setState({isAdmin: true})
            wireListeners()
          })
        } else {
          wireListeners()
        }
      })

      const wireListeners = () => {
        fbc.database.public.usersRef().on('child_added', data => {
          const user = data.val().user
          if (user) this.setState({users: [...this.state.users, user]})
        })
  
        fbc.database.public.userRef('user').set(client.currentUser)
  
        fbc.database.public.adminRef('targets').on('value', data => {
          this.setState({targets: data.val()})
        })
  
        fbc.database.public.allRef('kills').on('child_added', data => {
          const kill = data.val()
          this.setState({
            killsBy: {...this.state.killsBy, [kill.by]: this.state.killsBy[kill.by] ? [kill.target, ...this.state.killsBy[kill.by]] : [kill.target]}
          })
        })
      }
    })
  }

  render() {
    const usersToShow = this.state.targets
      ? this.state.users.filter(u => this.state.targets[u.id])
      : this.state.users

    const killed = [].concat(...Object.keys(this.state.killsBy).map(by => this.state.killsBy[by]))

    return (
      <View style={s.container}>
        <TitleBar title="Assassins" client={client} signin={this.signin} />
        { this.state.isAdmin && <Admin users={this.state.users} targets={this.state.targets} fbc={fbc} /> }
        { this.state.targets
          ? this.state.targets[client.currentUser.id]
            ? this.state.targets[client.currentUser.id] === client.currentUser.id
              ? <View style={s.me}><Text style={s.meText}>🥇 You are the last assassin standing! 🥇</Text></View>
              : <View style={s.me}>target info... TBD</View>
            : <View style={s.me}><Text>Sorry, you're too late. The game is already afoot!</Text></View>
          : this.state.isSignedIn && <View style={s.me}><Text>Awaiting your first target...</Text></View>
        }
        <FlatList data={usersToShow} keyExtractor={this._keyExtractor} renderItem={this._renderListPlayer} />
      </View>
    )
  }

  _keyExtractor = u => u.id
  _renderListPlayer = ({item}) => (
    <View style={s.listPlayer}>
      <View>
        <Avatar user={item} size={60} />
        <View style={s.killedXContainer}><Text style={s.killedX}>❌</Text></View>
      </View>
      <View style={s.listPlayerRight}>
        <View><Text style={s.listPlayerText}>{item.firstName} {item.lastName}</Text></View>
        { this.state.killsBy[item.id] && (
          <View style={s.kills}>
            <Text style={s.killsIcon}>🎯</Text>
            { this.state.killsBy[item.id].map(id => <Avatar style={s.killedAvatar} key={id} user={this.state.users[id]} size={Math.min(30, 240 / this.state.killsBy[item.id].length)} />) }
          </View>)}
        <View>
        </View>
      </View>
    </View>
  )
}

const fontSize = 18
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: '#d9e1f9',
  },
  me: {
    padding: 10,
    alignItems: 'center'
  },
  meText: {
    fontSize: 18
  },
  listPlayer: {
    padding: 10,
    flex: 1,
    flexDirection: 'row',
  },
  listPlayerRight: {
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center'
  },
  listPlayerText: {
    fontSize: 18,
    flex: 1
  },
  killedXContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  killedX: {
    paddingLeft: 3,
    fontSize: 35,
    textAlign: 'center',
    position: 'absolute',
    backgroundColor: 'transparent'
  },
  killsIcon: {
    fontSize: 20
  },
  kills: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  killedAvatar: {
    marginRight: 3
  },
  scroll: {
    flex: 1,
    padding: 15
  },
  task: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10
  },
  checkmark: {
    textAlign: 'center',
    fontSize
  },
  creatorAvatar: {
    marginRight: 4
  },
  creatorEmoji: {
    marginRight: 4,
    fontSize
  },
  taskText: {
    fontSize,
    flex: 1
  },
  compose: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10
  },
  sendButtons: {
    justifyContent: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    margin: 5
  },
  sendButtonText: {
    fontSize: 20,
    color: 'gray'
  },
  composeText: {
    flex: 1
  }
})
