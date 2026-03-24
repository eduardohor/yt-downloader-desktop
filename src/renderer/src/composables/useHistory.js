import { ref } from 'vue'

export function useHistory() {
  const historico = ref([])

  async function carregarHistorico() {
    historico.value = await window.api.getHistory()
  }

  async function limparHistorico() {
    await window.api.clearHistory()
    historico.value = []
  }

  function formatarData(isoString) {
    const data = new Date(isoString)
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function labelFormato(format) {
    const labels = {
      'mp4-best': 'MP4 (melhor)',
      'mp4-720': 'MP4 720p',
      'mp4-480': 'MP4 480p',
      'mp3-high': 'MP3 alta',
      'mp3-medium': 'MP3 média'
    }
    return labels[format] || format
  }

  return {
    historico,
    carregarHistorico,
    limparHistorico,
    formatarData,
    labelFormato
  }
}
