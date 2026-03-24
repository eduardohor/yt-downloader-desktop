<script setup>
const props = defineProps({
  modelValue: String,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])

const formatos = [
  { value: 'mp4-best', label: 'MP4 — Melhor qualidade', icon: '🎬' },
  { value: 'mp4-720', label: 'MP4 — 720p', icon: '📹' },
  { value: 'mp4-480', label: 'MP4 — 480p', icon: '📹' },
  { value: 'mp3-high', label: 'MP3 — Alta qualidade', icon: '🎵' },
  { value: 'mp3-medium', label: 'MP3 — Média qualidade', icon: '🎵' }
]
</script>

<template>
  <div class="format-selector">
    <label class="label">Formato</label>
    <div class="opcoes">
      <button
        v-for="f in formatos"
        :key="f.value"
        class="opcao"
        :class="{ ativo: props.modelValue === f.value }"
        :disabled="props.disabled"
        @click="emit('update:modelValue', f.value)"
      >
        <span class="icon">{{ f.icon }}</span>
        <span class="text">{{ f.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.format-selector {
  width: 100%;
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.opcoes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.opcao {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1e1e24;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  text-align: left;
  color: #aaa;
  font-size: 14px;
  transition: all 0.15s;
}

.opcao:hover:not(:disabled) {
  border-color: #555;
  color: #eee;
}

.opcao.ativo {
  border-color: #ff4444;
  color: #fff;
  background: #2a1a1a;
}

.opcao:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon {
  font-size: 16px;
}
</style>
