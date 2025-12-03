import { EventEmitter } from 'common'

const eventBus = new EventEmitter()

export function useEvent() {
  return {
    eventBus,
  }
}
