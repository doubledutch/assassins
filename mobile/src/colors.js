import client, { Color } from '@doubledutch/rn-client'

const primaryColor = new Color(client.primaryColor)

export default {
  gray: new Color({...primaryColor.limitLightness(0.4).hsv(), s: 0.2}).rgbString(),
  lightGray: new Color({...primaryColor.limitLightness(0.45).hsv(), s: 0.2}).rgbString(),
  darkGray: new Color({...primaryColor.limitLightness(0.2).hsv(), s: 0.2}).rgbString(),
  neon: '#4dfb89',
  darkNeon: '#42a26f'
}