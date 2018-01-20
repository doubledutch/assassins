import React, { PureComponent } from 'react'
import ReactNative, {
  Alert, FlatList, Image, PermissionsAndroid, TouchableOpacity, Text, TextInput, View
} from 'react-native'

import QRCode from 'react-native-qrcode'
import QRCodeScanner from 'react-native-qrcode-scanner'

import Admin from './Admin'
import Welcome from './Welcome'

import client, { Avatar, Color, TitleBar } from '@doubledutch/rn-client'
import colors from './colors'
import FirebaseConnector from '@doubledutch/firebase-connector'
import firebase from 'firebase'
const fbc = FirebaseConnector(client, 'assassins')

fbc.initializeAppWithSimpleBackend()
console.disableYellowBox = true

const targetsRef = fbc.database.public.adminRef('targets')
const killsRef = fbc.database.public.allRef('kills')
const userRef = fbc.database.public.userRef('user')
const usersRef = fbc.database.public.usersRef()
const killMethodsRef = fbc.database.public.adminRef('killMethods')

export default class HomeView extends PureComponent {
  constructor() {
    super()

    this.state = {
      users: [],
      targets: null,
      killMethods: null,
      killsBy: {}
    }

    this.signin = fbc.signin().then(() => this.setState({isSignedIn: true}))
  }

  componentDidMount() {
    this.signin.then(() => {
      fbc.database.private.adminableUserRef('adminToken').once('value', async data => {
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
        usersRef.on('value', data => {
          const val = data.val()
          if (val) {
            this.setState({users: Object.keys(val).map(id => val[id].user)})
          } else {
            this.setState({users: []})
          }
        })
  
        // Always signal that the player is in the game when it is open.
        userRef.on('value', data => !data.val() && userRef.set(client.currentUser))
  
        targetsRef.on('value', data => {
          this.setState({targets: data.val()})
        })

        killsRef.on('child_added', data => {
          const kill = data.val()

          this.setState(prevState => ({
            killsBy: {...prevState.killsBy, [kill.by]: prevState.killsBy[kill.by] ? [kill.target, ...prevState.killsBy[kill.by]] : [kill.target]}
          }))
        })

        // Removes all kills
        killsRef.on('value', data => {
          if (!data.val()) this.setState({killsBy: {}})
        })

        killMethodsRef.on('value', data => {
          const val = data.val()
          if (val) {
            this.setState({killMethods: Object.keys(val).reduce((arr, i) => {arr[+i] = {...val[i], id: +i}; return arr}, [])})
          }
        })
      }
    })
  }

  render() {    
    this.killed = this._getKilled()

    const usersToShow = this.state.targets
      ? this.state.users.filter(u => this.state.targets[u.id])
      : this.state.users

    usersToShow.sort((a,b) =>
      (this.killed[b.id] ? 0 : 10000) - (this.killed[a.id] ? 0 : 10000)
      + (this.state.killsBy[b.id] || []).length - (this.state.killsBy[a.id] || []).length)

    const me = this.state.users.find(u => u.id === client.currentUser.id)

    return (
      <View style={s.container}>
        <Image style={s.backgroundImage} source={{uri:''}} />
        <TitleBar title="Assassins" client={client} signin={this.signin} />
        { this.state.isAdmin && <Admin users={this.state.users} targets={this.state.targets} fbc={fbc} /> }
        { !me || !me.killMethod
          ? <Welcome fbc={fbc} killMethods={this.state.killMethods} />
          : [
            this.renderMain(),
            this.state.killMethods && <FlatList
              data={usersToShow}
              extraData={this.state.killsBy}
              keyExtractor={this._keyExtractor}
              renderItem={this._renderListPlayer}
            /> 
          ]
        }
      </View>
    )
  }

  renderLoading(text) {
    return (
      <View style={s.container}>
        <Image style={s.loadingImage} source={{uri:''}} />
        <Text style={{position: 'absolute', top: 5, left: 5, color: 'white', backgroundColor: 'transparent'}}>{text}</Text>
      </View>
    )
  }

  renderMain() {    
    if (!this.state.killMethods) return this.renderLoading('LOADING...')

    const me = this.state.users.find(u => u.id === client.currentUser.id)
    const whoAssassinatedMe = this._whoAssassinatedMe()
    const yourTarget = this._yourTarget()

    if (this.state.targets) {
      if (this.state.targets[client.currentUser.id]) {
        if (whoAssassinatedMe) {
          return (
            <View>
              <Text style={s.dead}>DEAD!</Text>
              <Text style={s.centerText}>{whoAssassinatedMe.firstName} {whoAssassinatedMe.lastName} took you down{this.killed[whoAssassinatedMe.id] ? ' before also being eliminated' : ''}!</Text>
              <View style={s.me}>
                <View>
                  <Avatar user={client.currentUser} size={100} client={client} />
                  <View style={s.killedXContainer}><Text style={s.killedXBig}>❌</Text></View>
                </View>
                <Text style={s.gun}>🔫</Text>
                <View>
                  <Avatar user={whoAssassinatedMe} size={100} client={client} />
                  { this.killed[whoAssassinatedMe.id] && <View style={s.killedXContainer}><Text style={s.killedXBig}>❌</Text></View> }
                </View>
              </View>
            </View>
          )
        } else if (Object.keys(this.killed).length >= Object.keys(this.state.targets).length - 1) {
          return <View style={s.me}><Text style={[s.meText, s.centerText]}>🥇 You are the last assassin standing! 🥇</Text></View>
        } else if (yourTarget) {
          const killMethod = this.state.killMethods[+yourTarget.killMethod] || this.state.killMethods[0]
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
          <Text style={{padding: 5, color: 'black', backgroundColor: 'transparent'}}>Awaiting your first target...</Text>
        </View>
      )
    }

    return null
  }

  _getKilled = () => [].concat(...Object.keys(this.state.killsBy).map(by => this.state.killsBy[by])).reduce((map, id) => { map[id] = true; return map }, {})

  _keyExtractor = u => u.id
  _renderListPlayer = ({item}) => (
    <View style={s.listPlayer}>
      <View>
        <Avatar user={item} size={60} client={client} />
        { this.killed[item.id] && <View style={s.killedXContainer}><Text style={s.killedX}>❌</Text></View> }
      </View>
      <View style={s.listPlayerRight}>
        <View style={s.listPlayerName}>
          <Text style={s.listPlayerText}>{item.firstName} {item.lastName}</Text>
          { this.state.targets && this.state.isAdmin && !this.killed[item.id] && <TouchableOpacity onPress={() => this._adminMarkAssassinated(item)}>
            <Text style={s.buttonText}>Mark dead</Text>
          </TouchableOpacity> }
          { !this.state.targets && this.state.isAdmin && <TouchableOpacity onPress={() => this._adminRemoveStalePlayer(item)}>
            <Text style={s.buttonText}>Remove stale</Text>
          </TouchableOpacity> }
          { !this.state.targets && this.state.isAdmin &&
            (item.isExcluded
              ? <TouchableOpacity onPress={() => this._excludePlayerFromNextGame(item, false)}><Text style={s.centerText}>❌</Text></TouchableOpacity>
              : <TouchableOpacity onPress={() => this._excludePlayerFromNextGame(item, true)}><Text style={s.centerText}>✅</Text></TouchableOpacity>
            ) }
        </View>
        { this.state.killsBy[item.id] && (
          <View style={s.kills}>
            <Text style={s.killsIcon}>🎯</Text>
            { this.state.killsBy[item.id].map(id => <Avatar style={s.killedAvatar} key={id} user={this.state.users.find(u => u.id === id)} size={Math.min(30, 240 / this.state.killsBy[item.id].length)} client={client} />) }
          </View>)}
        <View>
        </View>
      </View>
    </View>
  )

  _excludePlayerFromNextGame(player, isExcluded) {
    fbc.database.public.usersRef(player.id).child('user').child('isExcluded').set(isExcluded)
  }

  _adminMarkAssassinated(player) {
    const assassinId = this.findAssassinIdFor(player.id)
    const assassin = this.state.users.find(u => u.id === assassinId)
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

  _adminRemoveStalePlayer(player) {
    fbc.database.public.usersRef(player.id).remove()
  }

  _markAssassinated(player, assassinId) {
    if (!assassinId) assassinId = client.currentUser.id
    killsRef.push({ by: assassinId, target: player.id })
  }

  _whoAssassinatedMe() {
    const assassinId = Object.keys(this.state.killsBy).find(id => this.state.killsBy[id].includes(client.currentUser.id))
    if (assassinId) return this.state.users.find(u => u.id === assassinId)
    return null
  }

  _yourTarget() {
    if (!this.state.targets) return null
    const killed = this._getKilled()
    let targetId = this.state.targets[client.currentUser.id]
    while (client.currentUser.id !== targetId && killed[targetId]) targetId = this.state.targets[targetId]
    return this.state.users.find(u => u.id === targetId)
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

    const killed = this._getKilled()
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
