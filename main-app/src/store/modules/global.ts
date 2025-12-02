import { defineStore } from 'pinia'

interface GlobalStoreState {
  microLoading: boolean
}

export const useGlobalStore = defineStore('global', {
  state: (): GlobalStoreState => ({
    microLoading: false,
  }),
  getters: {
    getMicroLoading(): boolean {
      return this.microLoading
    },
  },
  actions: {
    setMicroLoading(value: boolean) {
      this.microLoading = value
    },
  },
})
