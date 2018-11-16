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
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import QRCode from 'react-native-qrcode'
import QRCodeScanner from 'react-native-qrcode-scanner'

import client, { Avatar, Color, TitleBar } from '@doubledutch/rn-client'
import { provideFirebaseConnectorToReactComponent } from '@doubledutch/firebase-connector'
import firebase from 'firebase/app'
import Admin from './Admin'
import Box from './Box'
import Button from './Button'
import CrossHairs from './CrossHairs'
import Header from './Header'
import Smiley, { SmileyRain } from './Smiley'
import Text from './Text'
import Welcome from './Welcome'
import Database from './db'
import { killMethodImages } from './images'

import colors from './colors'

const defaultKillMethods = [
  {
    title: '📇',
    description: 'You accept a business card from the target agent',
    instructions: 'Hand your business card to the target',
  },
  {
    title: '😄',
    description: 'The target agent places a sticker on you without you knowing',
    instructions: 'Place a sticker on the target without them knowing',
  },
  {
    title: '📸',
    description: 'The target agent takes a photo with you and him/herself',
    instructions: 'Take a photo with yourself and the target',
  },
]

class HomeView extends PureComponent {
  constructor(props) {
    super(props)

    this.db = Database(props.fbc)
    this.state = {
      players: [],
      targets: null,
      killMethods: defaultKillMethods,
      kills: [],
      killsBy: {},
      killed: {},
      tab: 1,
    }

    this.signin = this.db.signin()
  }

  componentDidMount() {
    const { fbc } = this.props
    client.getPrimaryColor().then(primaryColor => {
      this.setState({ primaryColor })
      this.s = createStyles({ primaryColor })
    })
    client.getCurrentUser().then(currentUser => {
      this.setState({ currentUser })
      this.signin.then(() => {
        const wireListeners = () => {
          this.db.watchTargets(this)
          this.db.watchKills(this)
          this.db.watchPlayers(this)
          this.db.watchKillMethods(this)
          // Small hack at the end to know when initial data is all loaded.
          this.db.database.public.adminRef().once('value', () => this.setState({ isLoaded: true }))
        }

        this.db.database.private.adminableUserRef('adminToken').on('value', data => {
          const longLivedToken = data.val()
          if (longLivedToken) {
            // Attendee appears to be an admin. Log out and log in w/ admin token.
            const switchToAdmin = async () => {
              await firebase.auth().signOut()
              client.longLivedToken = longLivedToken
              await fbc.signinAdmin()
              // We are now logged in as admin
              this.setState({ isAdmin: true })
              wireListeners()
            }
            switchToAdmin()
          } else {
            wireListeners()
          }
        })
      })
    })
  }

  componentWillUnmount() {
    firebase.auth().signOut()
  }

  render() {
    const {
      currentUser,
      isAdmin,
      isAdminExpanded,
      isLoaded,
      killMethods,
      players,
      primaryColor,
      targets,
    } = this.state
    if (!currentUser || !primaryColor) return null
    const me = players.find(u => u.id === currentUser.id)
    return (
      <View style={this.s.container}>
        <TitleBar title="Ice Breaker Espionage" client={client} signin={this.signin} />
        {isAdmin && (
          <View style={isAdminExpanded ? { flex: 1 } : null}>
            <Button
              style={s.adminButton}
              onPress={this._toggleAdmin}
              text={`${isAdminExpanded ? 'Hide' : 'Show'} admin panel`}
            />
            <Admin
              isExpanded={isAdminExpanded}
              targets={targets}
              db={this.db}
              markAssassinated={this._adminMarkAssassinated}
            />
          </View>
        )}
        {isAdminExpanded ? null : isLoaded ? ( // Admin panel hides everything else
          me ? (
            me.killMethod ? (
              targets ? (
                this.renderMain(me)
              ) : (
                <View style={s.centerChildren}>
                  <CrossHairs size={200} text="AWAITING YOUR FIRST TARGET" rotate />
                </View>
              )
            ) : (
              <Welcome db={this.db} killMethods={killMethods} currentUser={currentUser} />
            )
          ) : targets ? (
            <View style={s.centerChildren}>
              <CrossHairs size={200} text="GAME ALREADY IN PROGRESS" rotate />
            </View>
          ) : (
            <View style={s.centerChildren}>
              <CrossHairs size={200} text="Nothing to see here, civilian..." rotate />
            </View>
          )
        ) : (
          <View style={s.centerChildren}>
            <CrossHairs size={200} text="LOADING..." rotate />
          </View>
        )}
      </View>
    )
  }

  renderPhoto = height => {
    if (height > 700) {
      return 200
    }
    if (height > 650) {
      return 150
    }
    return 100
  }

  renderCode = height => {
    if (height > 700) {
      return 300
    }
    if (height > 650) {
      return 280
    }
    return 240
  }

  renderMain() {
    const {
      currentUser,
      justKilled,
      killed,
      killMethods,
      kills,
      killsBy,
      primaryColor,
      showScanner,
    } = this.state
    let { tab } = this.state

    const whoAssassinatedMe = this._whoAssassinatedMe()
    const yourTarget = this._yourTarget()
    const killMethod = yourTarget ? killMethods[+yourTarget.killMethod] || killMethods[0] : null
    const alive = this.state.players.filter(p => !killed[p.id])
    const isGameOverForMe = alive.length < 1 || whoAssassinatedMe
    const height = Dimensions.get('window').height

    if (tab === 0 && isGameOverForMe) tab = 1
    if (alive.length <= 1) tab = 2

    return (
      <View style={this.s.container}>
        <View style={this.s.container}>
          {tab === 0 ? (
            <View style={this.s.container}>
              <Header text="Secret Code" />
              <View style={[s.section, this.s.container]}>
                <Text style={{ fontSize: 16 }}>
                  If you are eliminated, the target agent will scan this secret code
                </Text>
                <View style={s.qrcode}>
                  <QRCode
                    value={JSON.stringify(currentUser.id)}
                    size={this.renderCode(height)}
                    bgColor="#000000"
                    fgColor="#ffffff"
                  />
                </View>
              </View>
            </View>
          ) : tab === 1 ? (
            whoAssassinatedMe ? (
              <View style={this.s.container}>
                <Header text="Mission Failed" />
                <View style={s.section}>
                  <Box>
                    <Text style={{ fontSize: 18, marginBottom: 15 }}>You were eliminated by:</Text>
                    {this.renderDebriefForPlayer(whoAssassinatedMe, 60)}
                  </Box>
                </View>
                {(killsBy[currentUser.id] || []).length > 0 && (
                  <View style={this.s.container}>
                    <Header text="Mission Debrief" />
                    <ScrollView style={this.s.container}>
                      <View style={s.section}>
                        <Box>
                          <Text style={{ marginBottom: 10 }}>You eliminated:</Text>
                          {killsBy[currentUser.id].map(id =>
                            this.renderDebriefForPlayer(
                              this.state.players.find(p => p.id === id),
                              40,
                            ),
                          )}
                          <Text style={{ marginBottom: 10, marginTop: 20 }}>
                            You were eliminated by:
                          </Text>
                          {this.renderDebriefForPlayer(whoAssassinatedMe, 40)}
                        </Box>
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : showScanner ? (
              <View style={{ flex: 1, paddingBottom: 10 }}>
                {client._b.isEmulated ? (
                  <Text>No scanner in emulator</Text>
                ) : (
                  <QRCodeScanner
                    onRead={this._onScan}
                    permissionDialogTitle="Camera Permission"
                    permissionDialogMessage="Required to eliminate your target"
                  />
                )}
                <Button text="CANCEL" onPress={() => this.setState({ showScanner: false })} />
              </View>
            ) : justKilled ? (
              <View style={this.s.container}>
                <Header text="Mission Accomplished" />
                <View style={[this.s.container, s.section]}>
                  <View style={this.s.container}>
                    <Box>
                      <Text style={{ fontSize: 18, marginBottom: 15 }}>You eliminated:</Text>
                      {this.renderDebriefForPlayer(justKilled, 60)}
                    </Box>
                  </View>
                  <Button text="NEXT MISSION" onPress={() => this.setState({ justKilled: null })} />
                </View>
              </View>
            ) : (
              <View style={this.s.container}>
                <Header text="Target Acquired" />
                <View style={[s.section, this.s.container]}>
                  <Box
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      padding: 20,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Avatar size={this.renderPhoto(height)} user={yourTarget} client={client} />
                    <View>
                      <Text style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>
                        {this.truncateName(yourTarget)}
                      </Text>
                      <Text style={{ fontSize: 18, textAlign: 'center' }}>
                        {this.truncateCompany(height, yourTarget)}
                      </Text>
                    </View>
                  </Box>
                  <Box style={{ marginVertical: 7, flexDirection: 'row', alignItems: 'center' }}>
                    {this.renderMethodIcon(killMethod)}
                    <Text style={{ flex: 1, fontSize: 16 }}>{killMethod.instructions}</Text>
                  </Box>
                  <Button text="CONFIRM MISSION COMPLETE" onPress={this._showScanner}>
                    <TabImage type="secret_code" selected />
                  </Button>
                </View>
              </View>
            )
          ) : (
            <View style={this.s.container}>
              {alive.length === 1 ? (
                <View>
                  <Header text="Winner" />
                  <View style={{ alignItems: 'center' }}>
                    <SmileyRain style={{ opacity: 0.9 }} primaryColor={primaryColor} />
                    <Avatar
                      size={100}
                      user={alive[0]}
                      client={client}
                      style={{ marginVertical: 10 }}
                    />
                    <Text style={{ fontSize: 20, marginBottom: 10 }}>
                      {this.truncateName(alive[0])}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={this.s.container}>
                  <Header text="Mission Updates" />
                  {kills.length > 0 ? (
                    <FlatList
                      style={[s.section, { flex: 0.6 }]}
                      data={kills}
                      keyExtractor={this._killKeyExtractor}
                      renderItem={this.renderMissionUpdate}
                    />
                  ) : (
                    <Text style={s.section}>No eliminations yet. Who will be the first?</Text>
                  )}
                </View>
              )}

              <Header text="Leaderboard" />
              {this.renderLeaderboard()}
            </View>
          )}
        </View>
        {alive.length > 1 && (
          <View style={this.s.tabs}>
            {!isGameOverForMe && (
              <TouchableOpacity style={s.tab} onPress={() => this.setState({ tab: 0 })}>
                <TabImage type="secret_code" selected={tab === 0} />
                <Text style={[s.tabText, tab === 0 ? { color: colors.neon } : null]}>
                  Secret Code
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.tab} onPress={() => this.setState({ tab: 1 })}>
              <CrossHairs size={20} color={tab === 1 ? colors.neon : 'white'} />
              <Text style={[s.tabText, tab === 1 ? { color: colors.neon } : null]}>
                Current Target
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tab} onPress={() => this.setState({ tab: 2 })}>
              <TabImage type="trophy" selected={tab === 2} />
              <Text style={[s.tabText, tab === 2 ? { color: colors.neon } : null]}>
                Leaderboard
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  _killKeyExtractor = kill => `${kill.by}:${kill.target}`

  truncateName = user => {
    let name = `${user.firstName} ${user.lastName}`
    if (name.length > 20) {
      name = `${name.substring(0, 20)}...`
    }
    return name
  }

  truncateCompany = (height, user) => {
    if (height > 650) {
      const spacer = user.title && user.company ? ', ' : ''
      let title = user.title + spacer + user.company
      if (title.length > 30) {
        title = `${title.substring(0, 30)}...`
      }
      return title
    }
  }

  renderMethodIcon = m => {
    if (m.title === '😄') return <Smiley size={50} style={s.killMethodTitleComponent} />
    const image = killMethodImages[m.title]
    if (image)
      return <Image source={image} style={[s.killMethodTitleComponent, s.killMethodTitleImage]} />
    return <Text style={{ fontSize: 50, marginRight: 10 }}>{m.title}</Text>
  }

  renderDebriefForPlayer(player, avatarSize) {
    return (
      <View key={player.id} style={{ flexDirection: 'row' }}>
        <Avatar size={avatarSize} user={player} client={client} style={{ marginRight: 7 }} />
        <View style={{ flex: 1, justifyContent: 'space-around' }}>
          <Text style={{ fontSize: 18 }}>{this.truncateName(player)}</Text>
          <Text>
            {player.title}
            {player.title && player.company ? ', ' : ''}
            {player.company}
          </Text>
        </View>
      </View>
    )
  }

  renderMissionUpdate = ({ item }) => {
    const renderPlayer = player => (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Avatar size={40} user={player} client={client} />
        <Text style={{ fontSize: 16, marginTop: 7, textAlign: 'center' }}>
          {this.truncateName(player)}
        </Text>
      </View>
    )
    const { players, primaryColor } = this.state
    const killer = players.find(u => u.id === item.by)
    const killed = players.find(u => u.id === item.target)
    return (
      <Box style={{ flexDirection: 'row', marginBottom: 5 }}>
        {renderPlayer(killer)}
        <View
          style={{
            flex: 0.7,
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingVertical: 5,
          }}
        >
          <Smiley size={30} primaryColor={primaryColor} />
          <Text>Eliminated</Text>
        </View>
        {renderPlayer(killed)}
      </Box>
    )
  }

  renderLeaderboard() {
    const { players, killed, kills, killsBy } = this.state
    players.sort((a, b) => {
      const score =
        (killed[b.id] ? 0 : 10000) -
        (killed[a.id] ? 0 : 10000) +
        (killsBy[b.id] || []).length -
        (killsBy[a.id] || []).length
      if (score !== 0) return score
      if (a.lastName !== b.lastName) return a.lastName < b.lastName ? -1 : 1
      return a.firstName < b.firstName ? -1 : 1
    })

    return (
      <FlatList
        style={[s.section, this.s.container]}
        data={players}
        extraData={kills}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderListPlayer}
      />
    )
  }

  _toggleAdmin = () => {
    this.setState({ isAdminExpanded: !this.state.isAdminExpanded })
  }

  _keyExtractor = u => u.id

  _renderListPlayer = ({ item }) => (
    <Box style={[s.listPlayer, this.state.killed[item.id] ? { opacity: 0.6 } : null]}>
      <Avatar user={item} size={50} client={client} style={{ marginRight: 18 }} />
      <View style={{ justifyContent: 'space-between', flex: 1 }}>
        <Text style={{ fontSize: 18 }}>{this.truncateName(item)}</Text>
        <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }]}>
          {this.state.killsBy[item.id] && (
            <View style={[s.row, { marginRight: 5 }]}>
              <Text>Eliminated: </Text>
              {this.state.killsBy[item.id].map(id => (
                <Avatar
                  style={s.smallAvatar}
                  key={id}
                  user={this.state.players.find(u => u.id === id)}
                  size={20}
                  client={client}
                />
              ))}
            </View>
          )}
          {this.state.killed[item.id] && (
            <View style={s.row}>
              <Text>Eliminated by: </Text>
              <Avatar
                style={s.smallAvatar}
                user={this._whoAssassinated(item.id)}
                size={20}
                client={client}
              />
            </View>
          )}
        </View>
      </View>
    </Box>
  )

  _adminMarkAssassinated = player => {
    const assassinId = this.findAssassinIdFor(player.id)
    const assassin = this.state.players.find(u => u.id === assassinId)
    if (assassinId && assassin) {
      Alert.alert(
        `Mark ${this.truncateName(player)} eliminated by ${this.truncateName(assassin)}`,
        'Use your admin powers to do this?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK',
            onPress: () => {
              this._markAssassinated(player, assassinId)
            },
          },
        ],
      )
    }
  }

  _markAssassinated(player, assassinId) {
    if (!assassinId) assassinId = this.state.currentUser.id
    this.db.addKill({ by: assassinId, target: player.id })
  }

  _whoAssassinatedMe() {
    const assassinId = Object.keys(this.state.killsBy).find(id =>
      this.state.killsBy[id].includes(this.state.currentUser.id),
    )
    if (assassinId) return this.state.players.find(u => u.id === assassinId)
    return null
  }

  _whoAssassinated(playerId) {
    const assassinId = Object.keys(this.state.killsBy).find(id =>
      this.state.killsBy[id].includes(playerId),
    )
    if (assassinId) return this.state.players.find(u => u.id === assassinId)
    return null
  }

  _yourTarget() {
    if (!this.state.targets) return null
    const killed = this.db.getKilled(this.state.killsBy)
    let targetId = this.state.targets[this.state.currentUser.id]
    while (this.state.currentUser.id !== targetId && killed[targetId])
      targetId = this.state.targets[targetId]
    return this.state.players.find(u => u.id === targetId)
  }

  _showScanner = () => this.setState({ showScanner: true })

  _onScan = code => {
    this.setState({ showScanner: false })
    if (code) {
      try {
        const scannedUserId = JSON.parse(code.data)
        const yourTarget = this._yourTarget()
        if (yourTarget && yourTarget.id === scannedUserId) {
          this._markAssassinated(yourTarget, this.state.currentUser.id)
          this.setState({ justKilled: yourTarget })
          Alert.alert('Success!', 'Good job, and watch your back!')
        } else {
          Alert.alert('Careful!', "A case of mistaken identity? Don't target the wrong person!")
        }
      } catch (e) {
        // Bad code
      }
    }
  }

  findAssassinIdFor(playerId) {
    if (!this.state.targets) return null
    const reverseTargets = Object.keys(this.state.targets)
      .map(assassinId => ({ assassinId, targetId: this.state.targets[assassinId] }))
      .reduce((reverseTargets, { assassinId, targetId }) => {
        reverseTargets[targetId] = assassinId
        return reverseTargets
      }, {})

    const killed = this.db.getKilled(this.state.killsBy)
    let assassinId = reverseTargets[playerId]
    while (assassinId !== playerId && killed[assassinId]) assassinId = reverseTargets[assassinId]
    if (assassinId === playerId) return null
    return assassinId
  }
}

export default provideFirebaseConnectorToReactComponent(
  client,
  'assassins',
  (props, fbc) => <HomeView {...props} fbc={fbc} />,
  PureComponent,
)

const TabImage = props => (
  <Image
    source={{
      uri: `https://dml2n2dpleynv.cloudfront.net/extensions/espionage/${props.type}_${
        props.selected ? 'green' : 'white'
      }.png`,
    }}
    style={s.tabImage}
  />
)

const createStyles = ({ primaryColor }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: new Color({
        ...new Color(primaryColor).limitLightness(0.3).hsv(),
        s: 0.15,
      }).rgbString(),
    },
    tabs: {
      flexDirection: 'row',
      height: 60,
      backgroundColor: new Color({
        ...new Color(primaryColor).limitLightness(0.4).hsv(),
        s: 0.15,
      }).rgbString(),
    },
  })

const s = StyleSheet.create({
  tab: {
    flex: 1,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabImage: {
    height: 20,
    width: 20,
  },
  tabText: {
    fontSize: 13,
  },
  section: {
    padding: 7,
    paddingTop: 13,
    paddingBottom: 18,
  },
  centerChildren: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButton: {
    margin: 5,
  },
  me: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  meText: {
    fontSize: 18,
  },
  listPlayer: {
    padding: 9,
    marginBottom: 4,
    flexDirection: 'row',
  },
  listPlayerRight: {
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listPlayerText: {
    fontSize: 18,
    backgroundColor: 'transparent',
    flex: 1,
  },
  killedXContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  killedX: {
    fontSize: 35,
    textAlign: 'center',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  killedXBig: {
    fontSize: 60,
    textAlign: 'center',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  killsIcon: {
    fontSize: 20,
    backgroundColor: 'transparent',
  },
  kills: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    marginRight: 6,
  },
  buttonText: {
    color: 'blue',
    backgroundColor: 'transparent',
  },
  gun: {
    fontSize: 60,
    backgroundColor: 'transparent',
  },
  dead: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  centerText: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 3,
  },
  alignCenter: {
    alignItems: 'center',
  },
  qrcode: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  killMethodTitle: {
    fontSize: 24,
    paddingBottom: 5,
  },
  killMethodTitleComponent: {
    height: 50,
    marginRight: 10,
  },
  killMethodTitleImage: {
    width: 65,
    resizeMode: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    opacity: 0.3,
    resizeMode: 'cover',
  },
})
