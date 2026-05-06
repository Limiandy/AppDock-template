import { defineStore } from 'pinia'
import { App } from 'ant-design-vue'
import type { MessageInstance } from 'ant-design-vue/es/message/interface'
import type { ModalStaticFunctions } from 'ant-design-vue/es/modal/confirm'
import type { NotificationInstance } from 'ant-design-vue/es/notification/interface'
import { ref } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  const message = ref<MessageInstance>({} as MessageInstance)
  const notification = ref<NotificationInstance>({} as NotificationInstance)
  const modal = ref<Omit<ModalStaticFunctions, 'warn'>>({} as Omit<ModalStaticFunctions, 'warn'>)

  function init(appContext: ReturnType<typeof App.useApp>) {
    message.value = appContext.message
    modal.value = appContext.modal
    notification.value = appContext.notification
  }

  return { message, notification, modal, init }
})
