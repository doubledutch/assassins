export default function Database(fbc) {
  fbc.initializeAppWithSimpleBackend()

  const killMethodsRef = fbc.database.public.adminRef('killMethods')
  const killsRef = fbc.database.public.allRef('kills')
  const targetsRef = fbc.database.public.adminRef('targets')
  const usersRef = fbc.database.public.usersRef()
  const playerRef = player => fbc.database.public.usersRef(player.id)

  return {
    database: fbc.database,
    signin: () => fbc.signin(),

    watchPlayers(component) {
      usersRef.on('child_added', data => {
        component.setState(state => (
          {
            players: [...state.players, {...data.val(), id: data.key}].sort((a,b) => {
              if (a.lastName !== b.lastName) return a.lastName < b.lastName ? -1 : 1
              return a.firstName < b.firstName ? -1 : 1
            })
          }))
      })
      usersRef.on('child_removed', data => {
        component.setState(state => ({players: state.players.filter(p => p.id !== data.key)}))
      })
      usersRef.on('child_changed', data => {
        component.setState(state => ({players: state.players.map(p => p.id === data.key ? data.val() : p)}))
      })
    },
    removePlayer(player) {
      playerRef(player).remove()
    },
    watchTargets(component) {
      targetsRef.on('value', data => {
        component.setState({targets: data.val()})
      })
    },
    setTargets(targets) {
      targetsRef.set(targets)
    },
    removeTargets() {
      targetsRef.remove()
    },
    watchKills(component) {
      killsRef.on('child_added', data => {
        const kill = data.val()

        component.setState(state => ({
          killsBy: {...state.killsBy, [kill.by]: state.killsBy[kill.by] ? [kill.target, ...state.killsBy[kill.by]] : [kill.target]},
          killed: {...state.killed, [kill.target]: kill.by},
          kills: [kill, ...state.kills]
        }))
      })

      // Watch removal of all kills
      killsRef.on('value', data => {
        if (!data.val()) component.setState({killsBy: {}, killed: {}, kills: []})
      })
    },
    addKill(kill) {
      killsRef.push(kill)
    },
    removeKills() {
      killsRef.remove()
    },
    getKilled(killsBy) {
      return [].concat(...Object.keys(killsBy).map(by => killsBy[by])).reduce((map, id) => { map[id] = true; return map }, {})
    },
    watchKillMethods(component) {
      killMethodsRef.on('value', data => {
        const val = data.val()
        if (val) {
          component.setState({killMethods: Object.keys(val).reduce((arr, i) => {arr[+i] = {...val[i], id: +i}; return arr}, [])})
        }
      })
    },
    setPlayerKillMethod(killMethod) {
      fbc.database.public.userRef('killMethod').set(killMethod)
    }
  }
}
