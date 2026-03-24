import { ref } from 'vue'

export function useDownload() {
  const status = ref('idle') // idle | analyzing | downloading | done | error | cancelled
  const progress = ref(0)
  const videoInfo = ref(null)
  const erro = ref(null)
  const downloadId = ref(null)
  const arquivoDestino = ref(null)
  const pastaDestino = ref(null)
  const outputDir = ref(null)

  let removeProgressListener = null

  async function analisarUrl(url) {
    status.value = 'analyzing'
    erro.value = null
    videoInfo.value = null

    try {
      if (url.includes('list=') && !url.includes('watch?v=')) {
        const info = await window.api.analyzePlaylist(url)
        videoInfo.value = { ...info, isPlaylist: true }
      } else {
        const info = await window.api.analyzeUrl(url)
        videoInfo.value = info
      }
      status.value = 'idle'
    } catch (e) {
      erro.value = e.message || 'Erro ao analisar URL'
      status.value = 'error'
    }
  }

  async function iniciarDownload(url, format) {
    status.value = 'downloading'
    progress.value = 0
    erro.value = null
    arquivoDestino.value = null

    const id = `dl-${Date.now()}`
    downloadId.value = id

    removeProgressListener = window.api.onProgress((data) => {
      if (data.downloadId === id) {
        progress.value = data.percent
      }
    })

    try {
      const resultado = await window.api.startDownload({
        url,
        format,
        outputDir: outputDir.value,
        downloadId: id
      })

      if (resultado.cancelado) {
        status.value = 'cancelled'
      } else {
        arquivoDestino.value = resultado.arquivo
        pastaDestino.value = resultado.pasta
        status.value = 'done'
        progress.value = 100
      }
    } catch (e) {
      erro.value = e.message || 'Erro durante o download'
      status.value = 'error'
    } finally {
      if (removeProgressListener) {
        removeProgressListener()
        removeProgressListener = null
      }
      downloadId.value = null
    }
  }

  async function cancelarDownload() {
    if (downloadId.value) {
      await window.api.cancelDownload(downloadId.value)
    }
  }

  async function selecionarPasta() {
    const pasta = await window.api.selectOutputDir()
    if (pasta) outputDir.value = pasta
  }

  function resetar() {
    status.value = 'idle'
    progress.value = 0
    erro.value = null
    arquivoDestino.value = null
    videoInfo.value = null
    pastaDestino.value = null
  }

  return {
    status,
    progress,
    videoInfo,
    erro,
    outputDir,
    arquivoDestino,
    pastaDestino,
    analisarUrl,
    iniciarDownload,
    cancelarDownload,
    selecionarPasta,
    resetar
  }
}
