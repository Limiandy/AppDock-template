import { reactive } from 'vue'
import { suppliers as seedSuppliers, type SupplierRecord } from './datasets'

/**
 * 原型供应商状态仓库：让各阶段列表之间的流转真实生效（初筛→入库/不合格、
 * 移除→回收站→恢复/彻底删除、收藏/取消收藏、补充资料通知）。
 * 仅内存态，刷新页面后回到种子数据。
 */
const state = reactive({
  suppliers: seedSuppliers.map((item) => ({ ...item })) as SupplierRecord[],
})

function findIndex(id: string) {
  return state.suppliers.findIndex((item) => item.id === id)
}

function move(id: string, stage: SupplierRecord['stage']) {
  const index = findIndex(id)
  if (index < 0) return
  state.suppliers[index] = { ...state.suppliers[index], stage }
}

export function useSupplierStore() {
  return {
    suppliers: state.suppliers,

    byStage(stage: SupplierRecord['stage']) {
      return state.suppliers.filter((item) => item.stage === stage)
    },

    /** 初筛 → 储备 */
    store(id: string) {
      move(id, 'reserve')
    },

    /** 初筛 → 不合格 */
    reject(id: string) {
      move(id, 'rejected')
    },

    /** 储备 → 收藏 */
    favorite(id: string) {
      move(id, 'favorite')
    },

    /** 收藏 → 储备 */
    unfavorite(id: string) {
      move(id, 'reserve')
    },

    /** 储备 / 收藏 / 不合格 → 回收站 */
    remove(id: string) {
      move(id, 'recycle')
    },

    /** 回收站 → 储备 */
    restore(id: string) {
      move(id, 'reserve')
    },

    /** 回收站 → 彻底删除 */
    purge(id: string) {
      const index = findIndex(id)
      if (index >= 0) state.suppliers.splice(index, 1)
    },

    /** 补充资料：仅记录已通知（原型用标签体现） */
    notifySupplement(id: string) {
      const index = findIndex(id)
      if (index < 0) return
      const record = state.suppliers[index]
      if (!record.honors.includes('已通知补充')) {
        state.suppliers[index] = { ...record, honors: [...record.honors, '已通知补充'] }
      }
    },

    reset() {
      state.suppliers = seedSuppliers.map((item) => ({ ...item }))
    },
  }
}
