import React, { PureComponent } from 'react'
import ReactNative, {
  Alert, FlatList, Image, PermissionsAndroid, TouchableOpacity, TextInput, View
} from 'react-native'

import QRCode from 'react-native-qrcode'
import QRCodeScanner from 'react-native-qrcode-scanner'

import Admin from './Admin'
import Button from './Button'
import Text from './Text'
import Welcome from './Welcome'
import Database from './db'

import client, { Avatar, Color, TitleBar } from '@doubledutch/rn-client'
import colors from './colors'
import FirebaseConnector from '@doubledutch/firebase-connector'
import firebase from 'firebase'
const fbc = FirebaseConnector(client, 'assassins')
const db = Database(fbc)

export default class HomeView extends PureComponent {
  constructor() {
    super()

    this.state = {
      players: [],
      targets: null,
      killMethods: null,
      killsBy: {},
      killed: {}
    }

    this.signin = db.signin().then(() => this.setState({isSignedIn: true}))
  }

  componentDidMount() {
    this.signin.then(() => {
      db.database.private.adminableUserRef('adminToken').once('value', async data => {
        const longLivedToken = data.val()
        if (longLivedToken) {
          console.log('Attendee appears to be admin.  Logging out and logging in w/ admin token.')
          await firebase.auth().signOut()
          client.longLivedToken = longLivedToken
          await fbc.signinAdmin()
          console.log('Re-logged in as admin')
          this.setState({isAdmin: true})
        }
        wireListeners()
      })

      const wireListeners = () => {
        db.watchPlayers(this)
        db.watchTargets(this)
        db.watchKills(this)
        db.watchKillMethods(this)
      }
    })
  }

  render() {
    const {isAdmin, isAdminExpanded, killed, killMethods, killsBy, players, targets} = this.state
    players.sort((a,b) => {
      const score = (killed[b.id] ? 0 : 10000) - ([a.id] ? 0 : 10000)
        + (killsBy[b.id] || []).length - (killsBy[a.id] || []).length
      if (score !== 0) return score
      if (a.lastName !== b.lastName) return a.lastName < b.lastName ? -1 : 1
      return a.firstName < b.firstName ? -1 : 1
    })

    const me = players.find(u => u.id === client.currentUser.id)

    return (
      <View style={s.container}>
        <TitleBar title="Assassins" client={client} signin={this.signin} />
        { isAdmin && <View style={isAdminExpanded ? {flex:1} : null}>
            <Button
              style={s.adminButton}
              onPress={this._toggleAdmin}
              text={`${isAdminExpanded ? 'Hide' : 'Show'} admin panel`} />
            <Admin
              isExpanded={isAdminExpanded}
              targets={targets}
              db={db}
              markAssassinated={this._adminMarkAssassinated} />
          </View>
        }
        { !isAdminExpanded && (!me || !me.killMethod
            ? this.state.killMethods ? <Welcome db={db} killMethods={killMethods} /> : this.renderLoading('LOADING...')
            : <View style={s.container}>
                { this.renderMain() }
                { killMethods && <FlatList
                  data={players}
                  extraData={killsBy}
                  keyExtractor={this._keyExtractor}
                  renderItem={this._renderListPlayer}
                /> }
              </View>
            )
        }
      </View>
    )
  }

  renderLoading(text) {
    return (
      <View style={s.container}>
        <Text style={{position: 'absolute', top: 5, left: 5}}>{text}</Text>
      </View>
    )
  }

  renderMain() {    
    const {killed, killMethods, players, targets} = this.state
    const me = players.find(u => u.id === client.currentUser.id)
    const whoAssassinatedMe = this._whoAssassinatedMe()
    const yourTarget = this._yourTarget()

    if (targets && killMethods) {
      if (targets[client.currentUser.id]) {
        if (whoAssassinatedMe) {
          return (
            <View>
              <Text style={s.dead}>DEAD!</Text>
              <Text style={s.centerText}>{whoAssassinatedMe.firstName} {whoAssassinatedMe.lastName} took you down{killed[whoAssassinatedMe.id] ? ' before also being eliminated' : ''}!</Text>
              <View style={s.me}>
                <View>
                  <Avatar user={client.currentUser} size={100} client={client} />
                  <View style={s.killedXContainer}><Text style={s.killedXBig}>❌</Text></View>
                </View>
                <Text style={s.gun}>🔫</Text>
                <View>
                  <Avatar user={whoAssassinatedMe} size={100} client={client} />
                  { killed[whoAssassinatedMe.id] && <View style={s.killedXContainer}><Text style={s.killedXBig}>❌</Text></View> }
                </View>
              </View>
            </View>
          )
        } else if (Object.keys(killed).length >= Object.keys(this.state.targets).length - 1) {
          return <View style={s.me}><Text style={[s.meText, s.centerText]}>🥇 You are the last assassin standing! 🥇</Text></View>
        } else if (yourTarget) {
          const killMethod = killMethods[+yourTarget.killMethod] || killMethods[0]
          return (
            <View>
              <View style={s.me}>
                <View style={s.scannerContainer}>
                  { this.state.showScanner
                    ? <QRCodeScanner
                        onRead={this._onScan}
                        cameraStyle={{height: 100, width: 100}}
                        permissionDialogTitle="Camera Permission"
                        permissionDialogMessage="Required to unlock your assassin skills" />
                    : <TouchableOpacity onPress={this._showScanner} style={s.tapToScan}><Text style={[s.alignCenter, s.centerText]}>Tap to scan</Text></TouchableOpacity> }
                </View>
                <View style={s.alignCenter}>
                  <Text style={s.centerText}>Your target:</Text>
                  <Avatar user={yourTarget} size={100} client={client} />
                  <Text style={s.centerText}>{yourTarget.firstName} {yourTarget.lastName}</Text>
                </View>
                <View style={s.alignCenter}>
                  <Text style={s.centerText}>Secret code:</Text>
                  <QRCode
                    value={JSON.stringify(client.currentUser.id)}
                    size={100}
                    bgColor='black'
                    fgColor='white' />
                  <Text style={s.centerText}>Forfeit if killed</Text>
                </View>
              </View>
              <View style={s.killMethod}>
                <Text style={s.killMethodTitle}>Mission: {killMethod.title}</Text>
                <Text>{killMethod.description}</Text>
              </View>
            </View>
          )
        }
      } else {
        return <View style={s.me}><Text style={s.centerText}>Sorry, you&#39;re too late. The game is already afoot!</Text></View>
      }
    } else if (this.state.isSignedIn) {
      return (
        <View>
          <Text style={{padding: 5}}>Awaiting your first target...</Text>
        </View>
      )
    }

    return null
  }

  _toggleAdmin = () => {
    this.setState({isAdminExpanded: !this.state.isAdminExpanded})
  }

  _keyExtractor = u => u.id
  _renderListPlayer = ({item}) => (
    <View style={s.listPlayer}>
      <View>
        <Avatar user={item} size={60} client={client} />
        { this.state.killed[item.id] && <View style={s.killedXContainer}><Text style={s.killedX}>❌</Text></View> }
      </View>
      <View style={s.listPlayerRight}>
        <View style={s.listPlayerName}>
          <Text style={s.listPlayerText}>{item.firstName} {item.lastName}</Text>
          { this.state.targets && this.state.isAdmin && !this.state.killed[item.id] && <TouchableOpacity onPress={() => this._adminMarkAssassinated(item)}>
            <Text style={s.buttonText}>Mark dead</Text>
          </TouchableOpacity> }
        </View>
        { this.state.killsBy[item.id] && (
          <View style={s.kills}>
            <Text style={s.killsIcon}>🎯</Text>
            { this.state.killsBy[item.id].map(id => <Avatar style={s.killedAvatar} key={id} user={this.state.players.find(u => u.id === id)} size={Math.min(30, 240 / this.state.killsBy[item.id].length)} client={client} />) }
          </View>)}
        <View>
        </View>
      </View>
    </View>
  )

  _adminMarkAssassinated = player => {
    const assassinId = this.findAssassinIdFor(player.id)
    const assassin = this.state.players.find(u => u.id === assassinId)
    if (assassinId && assassin) {
      Alert.alert(
        `Mark ${player.firstName} assassinated by ${assassin.firstName}`,
        'Use your admin powers to do this?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'OK', onPress: () => {
            this._markAssassinated(player, assassinId)
          }},
        ]
      )
    }
  }

  _markAssassinated(player, assassinId) {
    if (!assassinId) assassinId = client.currentUser.id
    db.addKill({ by: assassinId, target: player.id })
  }

  _whoAssassinatedMe() {
    const assassinId = Object.keys(this.state.killsBy).find(id => this.state.killsBy[id].includes(client.currentUser.id))
    if (assassinId) return this.state.players.find(u => u.id === assassinId)
    return null
  }

  _yourTarget() {
    if (!this.state.targets) return null
    const killed = db.getKilled(this.state.killsBy)
    let targetId = this.state.targets[client.currentUser.id]
    while (client.currentUser.id !== targetId && killed[targetId]) targetId = this.state.targets[targetId]
    return this.state.players.find(u => u.id === targetId)
  }

  _showScanner = () => this.setState({showScanner: true})
  
  _onScan = code => {
    this.setState({showScanner: false})
    const scannedUserId = JSON.parse(code.data)
    const yourTarget = this._yourTarget()
    if (yourTarget && yourTarget.id === scannedUserId) {
      this._markAssassinated(yourTarget, client.currentUser.id)
      Alert.alert('Hit!', 'Good job, and watch your back!')
    } else {
      Alert.alert('Careful!', 'A case of mistaken identity? Don\'t whack the wrong person!')
    }
  }

  findAssassinIdFor(playerId) {
    if (!this.state.targets) return null
    const reverseTargets = Object.keys(this.state.targets)
      .map(assassinId => ({ assassinId, targetId: this.state.targets[assassinId] }))
      .reduce((reverseTargets, {assassinId, targetId}) => { reverseTargets[targetId] = assassinId; return reverseTargets }, {})

    const killed = db.getKilled(this.state.killsBy)
    let assassinId = reverseTargets[playerId]
    while (assassinId !== playerId && killed[assassinId]) assassinId = reverseTargets[assassinId]
    if (assassinId === playerId) return null
    return assassinId
  }
}

const fontSize = 18
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray, // '#4b4a57',
  },
  adminButton: {
    margin: 5,
  },
  me: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  meText: {
    fontSize: 18
  },
  listPlayer: {
    padding: 7,
    flex: 1,
    flexDirection: 'row',
  },
  listPlayerRight: {
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center'
  },
  listPlayerName: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  listPlayerText: {
    fontSize: 18,
    backgroundColor: 'transparent',
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
    fontSize: 35,
    textAlign: 'center',
    position: 'absolute',
    backgroundColor: 'transparent'
  },
  killedXBig: {
    fontSize: 60,
    textAlign: 'center',
    position: 'absolute',
    backgroundColor: 'transparent'    
  },
  killsIcon: {
    fontSize: 20,
    backgroundColor: 'transparent'
  },
  kills: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  killedAvatar: {
    marginRight: 3
  },
  buttonText: {
    color: 'blue',
    backgroundColor: 'transparent'
  },
  gun: {
    fontSize: 60,
    backgroundColor: 'transparent'
  },
  dead: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
  centerText: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 3
  },
  alignCenter: {
    alignItems: 'center'
  },
  scannerContainer: {
    height: 100, width: 100,
    backgroundColor: client.primaryColor,
    justifyContent: 'center'
  },
  tapToScan: {
    flex: 1,
    justifyContent: 'center'
  },
  killMethod: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: new Color({...(new Color(client.primaryColor)).hsv(), s: 0.4, v: 1.0}).rgbString()    
  },
  killMethodTitle: {
    fontSize: 24,
    paddingBottom: 5
  },
  loadingImage: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover'
  },
  backgroundImage: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    opacity: 0.3,
    resizeMode: 'cover'
  }
})
