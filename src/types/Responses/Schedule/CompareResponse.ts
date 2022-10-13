import {KeyboardBuilder} from 'vk-io';

export type CompareResponse = {
  isChanged: boolean
  keyboard?: KeyboardBuilder
  changesList?: string[]
}
