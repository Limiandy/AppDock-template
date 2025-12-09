import { WorkerPool } from '../helper/WorkerPool'

const workerPool = new WorkerPool()

export function useWorkerPool() {
  return {
    workerPool,
  }
}
