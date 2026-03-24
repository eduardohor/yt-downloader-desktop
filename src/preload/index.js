import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  analyzeUrl: (url) => ipcRenderer.invoke('analyze-url', url),
  analyzePlaylist: (url) => ipcRenderer.invoke('analyze-playlist', url),
  startDownload: (payload) => ipcRenderer.invoke('start-download', payload),
  cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
  openFolder: (pasta) => ipcRenderer.invoke('open-folder', pasta),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  onProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('download-progress', handler)
    return () => ipcRenderer.removeListener('download-progress', handler)
  }
})
