<script setup>
import { ref } from 'vue'

const props = defineProps({
  status: String,
  disabled: Boolean
})

const emit = defineEmits(['analisar'])

const url = ref('')

function handleSubmit() {
  const trimmed = url.value.trim()
  if (!trimmed) return
  emit('analisar', trimmed)
}

function handlePaste(e) {
  const texto = e.clipboardData?.getData('text') || ''
  if (texto.includes('youtube.com') || texto.includes('youtu.be')) {
    url.value = texto.trim()
    setTimeout(() => emit('analisar', url.value), 100)
  }
}
</script>

<template>
  <div class="url-input">
    <div class="input-row">
      <input
        v-model="url"
        type="url"
        placeholder="Cole a URL do YouTube aqui..."
        :disabled="props.disabled"
        @keydown.enter="handleSubmit"
        @paste="handlePaste"
        autocomplete="off"
        spellcheck="false"
      />
      <button
        @click="handleSubmit"
        :disabled="props.disabled || !url.trim()"
        class="btn-analisar"
      >
        {{ props.status === 'analyzing' ? 'Analisando...' : 'Analisar' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.url-input {
  width: 100%;
}

.input-row {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  background: #1e1e24;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #eee;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #ff4444;
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input::placeholder {
  color: #555;
}

.btn-analisar {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-analisar:hover:not(:disabled) {
  background: #e03030;
}

.btn-analisar:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
