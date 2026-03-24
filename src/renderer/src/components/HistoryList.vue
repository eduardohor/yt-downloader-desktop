<script setup>
import { onMounted } from 'vue'
import { useHistory } from '../composables/useHistory'

const { historico, carregarHistorico, limparHistorico, formatarData, labelFormato } = useHistory()

onMounted(carregarHistorico)

function abrirPasta(pasta) {
  window.api.openFolder(pasta)
}
</script>

<template>
  <div class="history">
    <div class="header">
      <span class="titulo">Histórico</span>
      <button v-if="historico.length > 0" class="btn-limpar" @click="limparHistorico">
        Limpar
      </button>
    </div>

    <div v-if="historico.length === 0" class="vazio">
      Nenhum download ainda
    </div>

    <ul v-else class="lista">
      <li v-for="item in historico" :key="item.id" class="item">
        <div class="item-info">
          <div class="item-titulo" :title="item.url">
            {{ item.url.length > 50 ? item.url.slice(0, 50) + '...' : item.url }}
          </div>
          <div class="item-meta">
            <span class="badge">{{ labelFormato(item.format) }}</span>
            <span class="data">{{ formatarData(item.data) }}</span>
          </div>
        </div>
        <button class="btn-pasta" @click="abrirPasta(item.pasta)" title="Abrir pasta">
          📂
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.titulo {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-limpar {
  background: transparent;
  border: none;
  color: #555;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}

.btn-limpar:hover {
  color: #ff4444;
}

.vazio {
  font-size: 13px;
  color: #444;
  text-align: center;
  padding: 16px 0;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1e1e24;
  border: 1px solid #2a2a32;
  border-radius: 8px;
  padding: 10px 12px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-titulo {
  font-size: 13px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  align-items: center;
}

.badge {
  font-size: 11px;
  background: #2a2a3a;
  color: #888;
  border-radius: 4px;
  padding: 1px 6px;
}

.data {
  font-size: 11px;
  color: #555;
}

.btn-pasta {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.btn-pasta:hover {
  opacity: 1;
}

.lista::-webkit-scrollbar {
  width: 4px;
}
.lista::-webkit-scrollbar-track {
  background: transparent;
}
.lista::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}
</style>
