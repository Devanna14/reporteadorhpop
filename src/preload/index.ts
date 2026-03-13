import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Esto es lo que "expone" el objeto electron a la ventana de React
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define en window)
  window.electron = electronAPI
}