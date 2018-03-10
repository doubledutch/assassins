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
