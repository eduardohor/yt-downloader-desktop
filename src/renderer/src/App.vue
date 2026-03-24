<script setup>
import { ref } from 'vue'
import UrlInput from './components/UrlInput.vue'
import FormatSelector from './components/FormatSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import VideoInfo from './components/VideoInfo.vue'
import HistoryList from './components/HistoryList.vue'
import { useDownload } from './composables/useDownload'

const {
  status,
  progress,
  videoInfo,
  erro,
  outputDir,
  pastaDestino,
  analisarUrl,
  iniciarDownload,
  cancelarDownload,
  selecionarPasta,
  resetar
} = useDownload()

const formato = ref('mp4-best')
const urlAtual = ref('')
const abaAtiva = ref('download') // download | history

async function onAnalisar(url) {
  urlAtual.value = url
  resetar()
  await analisarUrl(url)
}

async function onDownload() {
  await iniciarDownload(urlAtual.value, formato.value)
}

function onNovoDownload() {
  resetar()
  urlAtual.value = ''
  formato.value = 'mp4-best'
}

function abrirPasta() {
  window.api.openFolder(pastaDestino.value)
}
</script>

<template>
  <div class="app">
    <!-- Cabeçalho -->
    <header class="header">
      <div class="logo">
        <span class="logo-icon">▶</span>
        <span class="logo-text">YT Downloader</span>
      </div>
      <nav class="nav">
        <button
          class="nav-btn"
          :class="{ ativo: abaAtiva === 'download' }"
          @click="abaAtiva = 'download'"
        >
          Download
        </button>
        <button
          class="nav-btn"
          :class="{ ativo: abaAtiva === 'history' }"
          @click="abaAtiva = 'history'"
        >
          Histórico
        </button>
      </nav>
    </header>

    <!-- Conteúdo -->
    <main class="main">

      <!-- Aba de download -->
      <div v-if="abaAtiva === 'download'" class="aba-download">

        <!-- URL Input -->
        <UrlInput
          v-if="status !== 'done'"
          :status="status"
          :disabled="status === 'downloading' || status === 'analyzing'"
          @analisar="onAnalisar"
        />

        <!-- Info do vídeo após análise -->
        <VideoInfo v-if="videoInfo" :videoInfo="videoInfo" />

        <!-- Mensagem de erro na análise -->
        <div v-if="status === 'error' && erro" class="erro">
          {{ erro }}
        </div>

        <template v-if="videoInfo && status !== 'done'">
          <FormatSelector
            v-model="formato"
            :disabled="status === 'downloading'"
            :videoHeights="videoInfo.videoHeights"
            :maxAudioBitrate="videoInfo.maxAudioBitrate"
            :sizesByHeight="videoInfo.sizesByHeight"
            :audioSizeHigh="videoInfo.audioSizeHigh"
            :audioSizeMedium="videoInfo.audioSizeMedium"
          />
        </template>

        <template v-if="videoInfo">
          <ProgressBar
            :progress="progress"
            :status="status"
            @cancelar="cancelarDownload"
          />

          <div v-if="status === 'done'" class="sucesso">
            <span>Download concluído!</span>
            <div class="sucesso-acoes">
              <button class="btn-sec" @click="abrirPasta">
                Abrir pasta
              </button>
              <button class="btn-sec" @click="onNovoDownload">
                Novo download
              </button>
            </div>
          </div>

          <div class="acoes" v-if="status !== 'done' && status !== 'downloading'">
            <button class="btn-download" @click="onDownload">
              Baixar
            </button>
            <div class="pasta-row">
              <span class="pasta-label">📁 {{ outputDir || 'Pasta padrão (Downloads/YTDownloader)' }}</span>
              <button class="btn-link" @click="selecionarPasta">Alterar</button>
            </div>
          </div>
        </template>

      </div>

      <!-- Aba de histórico -->
      <div v-if="abaAtiva === 'history'" class="aba-history">
        <HistoryList />
      </div>

    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #111116;
  color: #eee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  height: 100vh;
  overflow: hidden;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #1e1e24;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  color: #ff4444;
  font-size: 18px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #eee;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  color: #eee;
  background: #1e1e24;
}

.nav-btn.ativo {
  color: #eee;
  background: #1e1e24;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.aba-download {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 620px;
  margin: 0 auto;
}

.aba-history {
  max-width: 620px;
  margin: 0 auto;
}

.erro {
  font-size: 13px;
  color: #ff6666;
  background: #2a1515;
  border: 1px solid #4a2020;
  border-radius: 8px;
  padding: 10px 14px;
}

.sucesso {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #152a15;
  border: 1px solid #204a20;
  border-radius: 8px;
  padding: 14px;
  font-size: 14px;
  color: #66cc66;
}

.sucesso-acoes {
  display: flex;
  gap: 8px;
}

.acoes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-download {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.btn-download:hover:not(:disabled) {
  background: #e03030;
}

.btn-download:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-sec {
  background: #2a2a32;
  color: #ccc;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sec:hover {
  background: #32323c;
  color: #eee;
}

.pasta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.pasta-label {
  color: #555;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-link {
  background: transparent;
  border: none;
  color: #ff4444;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  flex-shrink: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.main::-webkit-scrollbar {
  width: 4px;
}
.main::-webkit-scrollbar-track {
  background: transparent;
}
.main::-webkit-scrollbar-thumb {
  background: #2a2a32;
  border-radius: 2px;
}
</style>
