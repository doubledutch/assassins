import React, { PureComponent } from 'react'
import ReactNative, {
  Alert, FlatList, Image, PermissionsAndroid, TouchableOpacity, TextInput, View
} from 'react-native'

import QRCode from 'react-native-qrcode'
import QRCodeScanner from 'react-native-qrcode-scanner'

import Admin from './Admin'
import Box from './Box'
import Button from './Button'
import CrossHares from './CrossHares'
import Header from './Header'
import Smiley from './Smiley'
import Text from './Text'
import Welcome from './Welcome'
import Database from './db'

import client, { Avatar, Color, TitleBar } from '@doubledutch/rn-client'
import colors from './colors'
import FirebaseConnector from '@doubledutch/firebase-connector'
import firebase from 'firebase'
const fbc = FirebaseConnector(client, 'assassins')
const db = Database(fbc)

const killMethods = [
  {title: '📇', description: 'You accept a business card from the enemy agent', instructions: 'Hand your business card to the target'},
  {title: '😄', description: 'The enemy agent places a sticker on you without you knowing', instructions: 'Place a sticker on the target without them knowing'},
  {title: '📸', description: 'The enemy agent takes a photo with you and him/herself', instructions: 'Take a photo with yourself and the target'}
]

export default class HomeView extends PureComponent {
  constructor() {
    super()

    this.state = {
      players: [],
      targets: null,
      kills: [],
      killsBy: {},
      killed: {},
      tab: 1
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
        db.watchTargets(this)
        db.watchKills(this)
        db.watchPlayers(this)
        // Small hack at the end to know when initial data is all loaded.
        db.database.public.adminRef().once('value', () => this.setState({isLoaded: true}))
      }
    })
  }

  render() {
    const {isAdmin, isAdminExpanded, isLoaded, killsBy, players, targets} = this.state
    const me = players.find(u => u.id === client.currentUser.id)

    return (
      <View style={s.container}>
        <TitleBar title="Ice Breaker Espionage" client={client} signin={this.signin} />
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
        { isAdminExpanded
            ? null // Admin panel hides everything else
            : isLoaded
              ? me
                ? me.killMethod
                  ? targets
                    ? this.renderMain(me)
                    : <View style={s.centerChildren}><CrossHares size={200} text="AWAITING YOUR FIRST TARGET" rotate={true} /></View>
                  : <Welcome db={db} killMethods={killMethods} />
                : targets
                  ? <View style={s.centerChildren}><CrossHares size={200} text="GAME ALREADY IN PROGRESS" rotate={true} /></View>
                  : <View style={s.centerChildren}><CrossHares size={200} text="Nothing to see here, civilian..." rotate={true} /></View>
              : <View style={s.centerChildren}><CrossHares size={200} text="LOADING..." rotate={true} /></View>
        }
        {/* { !isAdminExpanded && (!me || !me.killMethod
            ? this.state.killMethods
              ? <Welcome db={db} killMethods={killMethods} />
              : <View style={s.centerChildren}><CrossHares size={200} text="LOADING..." /></View>
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
        } */}
      </View>
    )
  }

  renderMain(me) {
    const {killed, kills, killsBy, tab} = this.state

    const whoAssassinatedMe = this._whoAssassinatedMe()
    const yourTarget = this._yourTarget()
    const killMethod = yourTarget ? killMethods[+yourTarget.killMethod] || killMethods[0] : null
    const isGameOver = Object.keys(killed).length >= Object.keys(this.state.targets).length - 1
    const isGameOverForMe = isGameOver || whoAssassinatedMe
    return (
      <View style={s.container}>
        <View style={s.container}>
          {
            tab === 0 && !isGameOverForMe ? <View style={s.container}>
              <Header text="Secret Code" />
              <View style={[s.section, s.container]}>
                <Text style={{fontSize: 16}}>If you are eliminated, the enemy agent will scan this secret code</Text>
                <View style={s.qrcode}>
                  <QRCode
                    value={JSON.stringify(client.currentUser.id)}
                    size={300}
                    bgColor={colors.neon}
                    fgColor={colors.gray} />
                </View>
              </View>
            </View>
            : tab === 1 && !isGameOverForMe ? <View style={s.container}>
              <Header text="Target Acquired" />
              <View style={[s.section, s.container]}>
                <Box style={{flex: 1, alignItems: 'center', padding: 20, justifyContent: 'space-between'}}>
                  <Avatar size={150} user={yourTarget} client={client} />
                  <View>
                    <Text style={{fontSize: 26, textAlign: 'center', marginBottom: 6}}>{yourTarget.firstName} {yourTarget.lastName}</Text>
                    <Text style={{fontSize: 18, textAlign: 'center'}}>{yourTarget.title}{yourTarget.title && yourTarget.company ? ', ' : ''}{yourTarget.company}</Text>
                  </View>
                </Box>
                <Box style={{marginVertical: 7, paddingVertical: 20, flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{fontSize: 50, marginRight: 10}}>{killMethod.title}</Text>
                  <Text style={{flex:1, fontSize: 16}}>{killMethod.instructions}</Text>
                </Box>
                <Button text="CONFIRM MISSION COMPLETE"><TabImage type="secret_code" selected={true} /></Button>
              </View>
            </View>
            : <View style={s.container}>
              <Header text="Mission Updates" />
              <View style={[s.section, {flex: 0.6}]}>
                { kills.length > 0
                  ? <FlatList data={kills} keyExtractor={this._killKeyExtractor} renderItem={this.renderMissionUpdate} />
                  : <Text>No eliminations yet. Who will be the first?</Text>
                }

              </View>
              <Header text="Leaderboard" />
              <View style={[s.section, s.container]}>
                { this.renderLeaderboard() }
              </View>
            </View>
          }
        </View>
        <View style={s.tabs}>
          { !isGameOverForMe && <TouchableOpacity style={s.tab} onPress={() => this.setState({tab:0})}>
              <TabImage type="secret_code" selected={tab===0} />
              <Text style={[s.tabText, tab===0 ? {color:colors.neon} : null]}>Secret Code</Text>
            </TouchableOpacity> }
          { !isGameOverForMe && <TouchableOpacity style={s.tab} onPress={() => this.setState({tab:1})}>
              <CrossHares size={20} color={tab===1 ? colors.neon : 'white'} />
              <Text style={[s.tabText, tab===1 ? {color:colors.neon} : null]}>Current Target</Text>
            </TouchableOpacity> }
          <TouchableOpacity style={s.tab} onPress={() => this.setState({tab:2})}>
            <TabImage type="trophy" selected={tab===2} />
            <Text style={[s.tabText, tab===2 ? {color:colors.neon} : null]}>Leaderboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  _killKeyExtractor = kill => `${kill.by}:${kill.target}`

  renderMissionUpdate = ({item}) => {
    const renderPlayer = player => (<View style={{flex:1, alignItems: 'center', justifyContent: 'center'}}>
        <Avatar size={40} user={player} client={client} />
        <Text style={{fontSize:16, marginTop: 7, textAlign: 'center'}}>{player.firstName} {player.lastName}</Text>
      </View>)

    const {players} = this.state
    const killer = players.find(u => u.id === item.by)
    const killed = players.find(u => u.id === item.target)
    return (
      <Box style={{flexDirection: 'row'}}>
        {renderPlayer(killer)}
        <View style={{flex: 0.7, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 5}}>
          <Smiley size={30} />
          <Text>Eliminated</Text>
        </View>
        {renderPlayer(killed)}
        </Box>
    )
  }

  renderLeaderboard() {
    const {players, killed, kills, killsBy} = this.state
    players.sort((a,b) => {
      const score = (killed[b.id] ? 0 : 10000) - (killed[a.id] ? 0 : 10000)
        + (killsBy[b.id] || []).length - (killsBy[a.id] || []).length
      if (score !== 0) return score
      if (a.lastName !== b.lastName) return a.lastName < b.lastName ? -1 : 1
      return a.firstName < b.firstName ? -1 : 1
    })

    return (<FlatList
      data={players}
      extraData={kills}
      keyExtractor={this._keyExtractor}
      renderItem={this._renderListPlayer} />)
  }

  // renderMain_OLD() {    
  //   const {killed, players, targets} = this.state
  //   const me = players.find(u => u.id === client.currentUser.id)
  //   const whoAssassinatedMe = this._whoAssassinatedMe()
  //   const yourTarget = this._yourTarget()

  //   if (targets) {
  //     if (targets[client.currentUser.id]) {
  //       if (whoAssassinatedMe) {
  //         return (
  //           <View>
  //             <Text style={s.dead}>DEAD!</Text>
  //             <Text style={s.centerText}>{whoAssassinatedMe.firstName} {whoAssassinatedMe.lastName} took you down{killed[whoAssassinatedMe.id] ? ' before also being eliminated' : ''}!</Text>
  //             <View style={s.me}>
  //               <View>
  //                 <Avatar user={client.currentUser} size={100} client={client} />
  //                 <View style={s.killedXContainer}><Text style={s.killedXBig}>❌</Text></View>
  //               </View>
  //               <Text style={s.gun}>🔫</Text>
  //               <View>
  //                 <Avatar user={whoAssassinatedMe} size={100} client={client} />
  //                 { killed[whoAssassinatedMe.id] && <View style={s.killedXContainer}><Text style={s.killedXBig}>❌</Text></View> }
  //               </View>
  //             </View>
  //           </View>
  //         )
  //       } else if (Object.keys(killed).length >= Object.keys(this.state.targets).length - 1) {
  //         return <View style={s.me}><Text style={[s.meText, s.centerText]}>🥇 You are the last assassin standing! 🥇</Text></View>
  //       } else if (yourTarget) {
  //         const killMethod = killMethods[+yourTarget.killMethod] || killMethods[0]
  //         return (
  //           <View>
  //             <View style={s.me}>
  //               <View style={s.scannerContainer}>
  //                 { this.state.showScanner
  //                   ? <QRCodeScanner
  //                       onRead={this._onScan}
  //                       cameraStyle={{height: 100, width: 100}}
  //                       permissionDialogTitle="Camera Permission"
  //                       permissionDialogMessage="Required to unlock your assassin skills" />
  //                   : <TouchableOpacity onPress={this._showScanner} style={s.tapToScan}><Text style={[s.alignCenter, s.centerText]}>Tap to scan</Text></TouchableOpacity> }
  //               </View>
  //               <View style={s.alignCenter}>
  //                 <Text style={s.centerText}>Your target:</Text>
  //                 <Avatar user={yourTarget} size={100} client={client} />
  //                 <Text style={s.centerText}>{yourTarget.firstName} {yourTarget.lastName}</Text>
  //               </View>
  //               <View style={s.alignCenter}>
  //                 <Text style={s.centerText}>Secret code:</Text>
  //                 <QRCode
  //                   value={JSON.stringify(client.currentUser.id)}
  //                   size={100}
  //                   bgColor='black'
  //                   fgColor='white' />
  //                 <Text style={s.centerText}>Forfeit if killed</Text>
  //               </View>
  //             </View>
  //             <View style={s.killMethod}>
  //               <Text style={s.killMethodTitle}>Mission: {killMethod.title}</Text>
  //               <Text>{killMethod.description}</Text>
  //             </View>
  //           </View>
  //         )
  //       }
  //     } else {
  //       return <View style={s.me}><Text style={s.centerText}>Sorry, you&#39;re too late. The game is already afoot!</Text></View>
  //     }
  //   } else if (this.state.isSignedIn) {
  //     return (
  //       <View>
  //         <Text style={{padding: 5}}>Awaiting your first target...</Text>
  //         <CrossHares size={200} />
  //       </View>
  //     )
  //   }

  //   return null
  // }

  _toggleAdmin = () => {
    this.setState({isAdminExpanded: !this.state.isAdminExpanded})
  }

  _keyExtractor = u => u.id
  _renderListPlayer = ({item}) => (
    <Box style={[s.listPlayer, this.state.killed[item.id] ? {opacity:0.6} : null]}>
      <Avatar user={item} size={50} client={client} style={{marginRight:18}} />
      <View style={{justifyContent:'space-between', flex:1}}>
        <Text style={{fontSize: 18}}>{item.firstName} {item.lastName}</Text>
        <View style={[{flexDirection: 'row', flexWrap:'wrap'}]}>
          { this.state.killsBy[item.id] && <View style={[s.row, {marginRight:5}]}>
              <Text>Eliminated:  </Text>
              { this.state.killsBy[item.id].map(id => <Avatar
                  style={s.smallAvatar} key={id}
                  user={this.state.players.find(u => u.id === id)}
                  size={20} client={client} />)
              }
            </View>
          }
          { this.state.killed[item.id] && <View style={s.row}>
              <Text>Eliminated by:  </Text>
              <Avatar
                style={s.smallAvatar}
                user={this._whoAssassinated(item.id)}
                size={20} client={client} />
            </View>
          }
        </View>
      </View>
    </Box>
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

  _whoAssassinated(playerId) {
    const assassinId = Object.keys(this.state.killsBy).find(id => this.state.killsBy[id].includes(playerId))
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

const TabImage = props => (<Image
  source={{uri: `https://dml2n2dpleynv.cloudfront.net/extensions/espionage/${props.type}_${props.selected ? 'green' : 'white'}.png`}}
  style={s.tabImage} />)

const fontSize = 18
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray, // '#4b4a57',
  },
  tabs: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: colors.lightGray
  },
  tab: {
    flex: 1,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  tabImage: {
    height: 20,
    width: 20
  },
  tabText: {
    fontSize: 13
  },
  section: {
    padding: 7
  },
  centerChildren: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
    padding: 9,
    marginBottom: 4,
    flexDirection: 'row',
  },
  listPlayerRight: {
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center'
  },
  row: {
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
  smallAvatar: {
    marginRight: 6
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
  qrcode: {
    flex: 1,
    alignItems: 'center',
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
  backgroundImage: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    opacity: 0.3,
    resizeMode: 'cover'
  }
})
