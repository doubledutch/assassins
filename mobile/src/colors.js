import client, { Color } from '@doubledutch/rn-client'

const primaryColor = new Color(client.primaryColor)

export default {
  gray: new Color({...primaryColor.limitLightness(0.3).hsv(), s: 0.15}).rgbString(),
  lightGray: new Color({...primaryColor.limitLightness(0.4).hsv(), s: 0.15}).rgbString(),
  darkGray: new Color({...primaryColor.limitLightness(0.2).hsv(), s: 0.15}).rgbString(),
  neon: '#4dfb89',
  darkNeon: '#42a26f'
}