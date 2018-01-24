import React, { PureComponent } from 'react'
import './Avatar.css'

const defaultSize = 25
export default class Avatar extends PureComponent {
  constructor() {
    super()
    this.state = {}
    this.s = null
  }

  render() {
    const {user} = this.props
    if (!user) return null
    return user.image
      ? <img src={user.image} alt="" className="Avatar" style={this.getStyle()} />
      : <span className="Initials" style={this.getStyle()}>
          {user.firstName ? user.firstName.substring(0,1) : ''}{user.lastName ? user.lastName.substring(0,1) : ''}
        </span>
  }

  getStyle() {
    const size = this.props.size || defaultSize
    return {
      borderRadius: `${size/2}px`,
      height: size,
      width: size,
      fontSize: `${size * 0.55}px`,
      lineHeight: `${size}px`
    }
  }
}
