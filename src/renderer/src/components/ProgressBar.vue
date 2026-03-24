<script setup>
const props = defineProps({
  progress: Number,
  status: String
})

const emit = defineEmits(['cancelar'])

const mensagens = {
  downloading: 'Baixando...',
  done: 'Concluído!',
  error: 'Erro no download',
  cancelled: 'Cancelado'
}
</script>

<template>
  <div class="progress-bar" v-if="props.status !== 'idle' && props.status !== 'analyzing'">
    <div class="info-row">
      <span class="msg">{{ mensagens[props.status] || '' }}</span>
      <span class="pct" v-if="props.status === 'downloading'">{{ props.progress.toFixed(1) }}%</span>
    </div>
    <div class="bar-track">
      <div
        class="bar-fill"
        :class="{ done: props.status === 'done', error: props.status === 'error' }"
        :style="{ width: props.status === 'done' ? '100%' : `${props.progress}%` }"
      />
    </div>
    <button
      v-if="props.status === 'downloading'"
      class="btn-cancelar"
      @click="emit('cancelar')"
    >
      Cancelar
    </button>
  </div>
</template>

<style scoped>
.progress-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #aaa;
}

.bar-track {
  width: 100%;
  height: 6px;
  background: #2a2a32;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #ff4444;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-fill.done {
  background: #44bb44;
}

.bar-fill.error {
  background: #ff8800;
}

.btn-cancelar {
  align-self: flex-end;
  background: transparent;
  border: 1px solid #555;
  color: #aaa;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancelar:hover {
  border-color: #ff4444;
  color: #ff4444;
}
</style>
