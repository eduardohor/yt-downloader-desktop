import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { spawn, spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ffmpegStatic from 'ffmpeg-static'

function detectarNodePath() {
  const cmd = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(cmd, ['node'], { encoding: 'utf-8' })
  if (result.status === 0) return result.stdout.trim().split('\n')[0].trim()
  return null
}

const nodePath = detectarNodePath()

const isDev = is.dev
const resourcesPath = isDev
  ? join(process.cwd(), 'assets/bin')
  : join(process.resourcesPath, 'bin')

const ytdlpBin =
  process.platform === 'win32'
    ? join(resourcesPath, 'yt-dlp.exe')
    : join(resourcesPath, 'yt-dlp')

// em dev usa ffmpeg-static, em produção usa o binário bundled em resources/bin
const ffmpegBin = isDev
  ? ffmpegStatic
  : process.platform === 'win32'
    ? join(process.resourcesPath, 'bin', 'ffmpeg.exe')
    : join(process.resourcesPath, 'bin', 'ffmpeg')

const historyPath = join(app.getPath('userData'), 'history.json')

function lerHistorico() {
  if (!existsSync(historyPath)) return []
  try {
    return JSON.parse(readFileSync(historyPath, 'utf-8'))
  } catch {
    return []
  }
}

function salvarHistorico(historico) {
  writeFileSync(historyPath, JSON.stringify(historico, null, 2), 'utf-8')
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 680,
    minWidth: 640,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    title: 'YT Downloader',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('analyze-url', async (_event, url) => {
  return new Promise((resolve, reject) => {
    const args = ['--dump-json', '--no-playlist']
    if (nodePath) args.push('--js-runtimes', `node:${nodePath}`)
    args.push(url)
    const proc = spawn(ytdlpBin, args)
    let output = ''
    let errorOutput = ''

    proc.stdout.on('data', (data) => { output += data.toString() })
    proc.stderr.on('data', (data) => { errorOutput += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Erro ao analisar URL'))
        return
      }
      try {
        const info = JSON.parse(output)

        const formats = info.formats || []

        const videoHeights = [
          ...new Set(
            formats
              .filter((f) => f.height && f.height > 0)
              .map((f) => f.height)
          )
        ].sort((a, b) => b - a)

        const audioBitrates = formats
          .filter((f) => f.abr && f.abr > 0)
          .map((f) => Math.round(f.abr))
        const maxAudioBitrate = audioBitrates.length > 0 ? Math.max(...audioBitrates) : 128

        // Streams de áudio ordenados por bitrate
        const audioFormats = formats
          .filter((f) => f.abr && f.abr > 0)
          .sort((a, b) => (b.abr || 0) - (a.abr || 0))

        const melhorAudio = audioFormats[0]
        const audioSize = melhorAudio ? (melhorAudio.filesize || melhorAudio.filesize_approx || 0) : 0

        // Tamanho estimado para alta qualidade (stream de áudio bruto, antes da conversão para mp3)
        const audioSizeHigh = audioSize

        // Tamanho estimado para qualidade média: calcula com base em 128kbps × duração
        const duracao = info.duration || 0
        const audioSizeMedium = duracao > 0 ? Math.round((128000 / 8) * duracao) : 0

        // Tamanho aproximado por resolução (video stream + audio stream)
        const sizesByHeight = {}
        videoHeights.forEach((h) => {
          const melhorVideo = formats
            .filter((f) => f.height === h)
            .sort((a, b) => (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0))[0]
          const videoSize = melhorVideo ? (melhorVideo.filesize || melhorVideo.filesize_approx || 0) : 0
          if (videoSize > 0) sizesByHeight[h] = videoSize + audioSize
        })

        resolve({
          title: info.title,
          thumbnail: info.thumbnail,
          duration: info.duration,
          uploader: info.uploader,
          isPlaylist: false,
          videoHeights,
          maxAudioBitrate,
          sizesByHeight,
          audioSizeHigh,
          audioSizeMedium
        })
      } catch {
        reject(new Error('Erro ao processar informações do vídeo'))
      }
    })
  })
})

ipcMain.handle('analyze-playlist', async (_event, url) => {
  return new Promise((resolve, reject) => {
    const args = ['--flat-playlist', '--dump-json']
    if (nodePath) args.push('--js-runtimes', `node:${nodePath}`)
    args.push(url)
    const proc = spawn(ytdlpBin, args)
    let output = ''
    let errorOutput = ''

    proc.stdout.on('data', (data) => { output += data.toString() })
    proc.stderr.on('data', (data) => { errorOutput += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Erro ao analisar playlist'))
        return
      }
      try {
        const lines = output.trim().split('\n').filter(Boolean)
        const items = lines.map((line) => JSON.parse(line))
        resolve({ count: items.length, title: items[0]?.playlist_title || 'Playlist' })
      } catch {
        reject(new Error('Erro ao processar playlist'))
      }
    })
  })
})

const downloadProcesses = new Map()

ipcMain.handle('start-download', async (_event, { url, format, outputDir, downloadId }) => {
  return new Promise((resolve, reject) => {
    const pastaBase = outputDir || app.getPath('downloads')
    const isAudio = format.startsWith('mp3')
    const pasta = join(pastaBase, 'YTDownloader', isAudio ? 'audio' : 'videos')
    mkdirSync(pasta, { recursive: true })

    const labelFormato = isAudio
      ? (format === 'mp3-high' ? 'high' : 'medium')
      : format === 'mp4-best' ? 'best' : format.replace('mp4-', '') + 'p'
    const outputTemplate = join(pasta, `%(title)s_${labelFormato}.%(ext)s`)
    let args = ['--ffmpeg-location', ffmpegBin, '-o', outputTemplate, '--newline']
    if (nodePath) args.push('--js-runtimes', `node:${nodePath}`)

    if (format === 'mp4-best') {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best')
      args.push('--merge-output-format', 'mp4')
    } else if (format === 'mp4-1080') {
      args.push('-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]')
      args.push('--merge-output-format', 'mp4')
    } else if (format === 'mp4-720') {
      args.push('-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]')
      args.push('--merge-output-format', 'mp4')
    } else if (format === 'mp4-480') {
      args.push('-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]')
      args.push('--merge-output-format', 'mp4')
    } else if (format === 'mp4-360') {
      args.push('-f', 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360]')
      args.push('--merge-output-format', 'mp4')
    } else if (format === 'mp3-high') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else if (format === 'mp3-medium') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '5')
    }

    args.push(url)

    const proc = spawn(ytdlpBin, args)
    downloadProcesses.set(downloadId, proc)

    const progressRegex = /\[download\]\s+([\d.]+)%/
    let ultimoArquivo = ''

    proc.stdout.on('data', (data) => {
      const texto = data.toString()
      const matchDest = texto.match(/\[(?:download|Merger)\] Destination: (.+)/)
      if (matchDest) ultimoArquivo = matchDest[1].trim()

      const match = texto.match(progressRegex)
      if (match) {
        const percent = parseFloat(match[1])
        mainWindow.webContents.send('download-progress', { downloadId, percent })
      }
    })

    proc.stderr.on('data', (data) => {
      console.error('[yt-dlp stderr]', data.toString())
    })

    proc.on('close', (code) => {
      downloadProcesses.delete(downloadId)
      if (code === 0) {
        const historico = lerHistorico()
        historico.unshift({ id: downloadId, url, format, arquivo: ultimoArquivo, pasta, data: new Date().toISOString() })
        salvarHistorico(historico.slice(0, 50))
        resolve({ sucesso: true, arquivo: ultimoArquivo, pasta })
      } else if (code === null) {
        resolve({ sucesso: false, cancelado: true })
      } else {
        reject(new Error(`yt-dlp encerrou com código ${code}`))
      }
    })

    proc.on('error', (err) => {
      downloadProcesses.delete(downloadId)
      reject(err)
    })
  })
})

ipcMain.handle('cancel-download', (_event, downloadId) => {
  const proc = downloadProcesses.get(downloadId)
  if (proc) {
    proc.kill()
    downloadProcesses.delete(downloadId)
    return true
  }
  return false
})

ipcMain.handle('open-folder', (_event, pasta) => {
  const alvo = pasta || join(app.getPath('downloads'), 'YTDownloader')
  mkdirSync(alvo, { recursive: true })
  shell.openPath(alvo)
})

ipcMain.handle('select-output-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Escolha a pasta de downloads'
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('get-history', () => lerHistorico())

ipcMain.handle('clear-history', () => salvarHistorico([]))

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.pessoal.ytdownloader')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
