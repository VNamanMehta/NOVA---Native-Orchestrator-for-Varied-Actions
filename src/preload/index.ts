import { contextBridge } from 'electron'
import { api } from './api'

if (!process.contextIsolated) {
  throw new Error('Nova requires contextIsolation. Refusing to expose the preload bridge.')
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}
