<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: String,
  disabled: Boolean,
  videoHeights: Array,
  maxAudioBitrate: Number,
  sizesByHeight: Object,
  audioSizeHigh: Number,
  audioSizeMedium: Number
})

function formatarTamanho(bytes) {
  if (!bytes || bytes === 0) return null
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

const emit = defineEmits(['update:modelValue'])

const formatosVideo = computed(() => {
  const alturas = props.videoHeights || []
  const sizes = props.sizesByHeight || {}
  const opcoes = []

  function subLabel(res, heightReal) {
    const qualidade = res >= 2160 ? '4K' : res >= 1440 ? '2K' : res >= 1080 ? 'Full HD' : res >= 720 ? 'HD' : res >= 480 ? 'SD' : 'baixa resolução'
    const tamanho = formatarTamanho(sizes[heightReal])
    return tamanho ? `${qualidade} · ~${tamanho}` : qualidade
  }

  if (alturas.length > 0) {
    const melhor = alturas[0]
    opcoes.push({
      value: 'mp4-best',
      label: `MP4 — ${melhor}p (melhor disponível)`,
      sub: subLabel(melhor, melhor),
      icon: '🎬'
    })
  }

  const resolucoes = [1080, 720, 480, 360]
  for (const res of resolucoes) {
    const disponivel = alturas.some((h) => h <= res)
    if (!disponivel) continue
    const real = alturas.find((h) => h <= res) || res
    if (real === alturas[0]) continue
    opcoes.push({
      value: `mp4-${res}`,
      label: `MP4 — ${res}p`,
      sub: subLabel(res, real),
      icon: '📹'
    })
  }

  return opcoes
})

const formatosAudio = computed(() => {
  const maxBitrate = props.maxAudioBitrate || 128
  const tamanhoHigh = formatarTamanho(props.audioSizeHigh)
  const tamanhoMedium = formatarTamanho(props.audioSizeMedium)

  const subHigh = maxBitrate >= 192
    ? `até ${Math.min(maxBitrate, 320)} kbps${tamanhoHigh ? ` · ~${tamanhoHigh}` : ''}`
    : `${maxBitrate} kbps (máximo disponível)${tamanhoHigh ? ` · ~${tamanhoHigh}` : ''}`

  const subMedium = `128 kbps · arquivo menor${tamanhoMedium ? ` · ~${tamanhoMedium}` : ''}`

  return [
    { value: 'mp3-high', label: 'MP3 — Alta qualidade', sub: subHigh, icon: '🎵' },
    { value: 'mp3-medium', label: 'MP3 — Qualidade padrão', sub: subMedium, icon: '🎵' }
  ]
})
</script>

<template>
  <div class="format-selector">
    <div class="grupo">
      <label class="label">Vídeo</label>
      <div class="opcoes">
        <button
          v-for="f in formatosVideo"
          :key="f.value"
          class="opcao"
          :class="{ ativo: props.modelValue === f.value }"
          :disabled="props.disabled"
          @click="emit('update:modelValue', f.value)"
        >
          <span class="icon">{{ f.icon }}</span>
          <span class="texts">
            <span class="text">{{ f.label }}</span>
            <span class="sub">{{ f.sub }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="grupo">
      <label class="label">Somente áudio</label>
      <div class="opcoes">
        <button
          v-for="f in formatosAudio"
          :key="f.value"
          class="opcao"
          :class="{ ativo: props.modelValue === f.value }"
          :disabled="props.disabled"
          @click="emit('update:modelValue', f.value)"
        >
          <span class="icon">{{ f.icon }}</span>
          <span class="texts">
            <span class="text">{{ f.label }}</span>
            <span class="sub">{{ f.sub }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.format-selector {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.opcoes {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.opcao {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1e1e24;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 9px 14px;
  cursor: pointer;
  text-align: left;
  color: #aaa;
  transition: all 0.15s;
}

.opcao:hover:not(:disabled) {
  border-color: #555;
  color: #eee;
}

.opcao:hover:not(:disabled) .sub {
  color: #777;
}

.opcao.ativo {
  border-color: #ff4444;
  color: #fff;
  background: #2a1a1a;
}

.opcao.ativo .sub {
  color: #cc8888;
}

.opcao:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon {
  font-size: 15px;
  flex-shrink: 0;
}

.texts {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.text {
  font-size: 13px;
  font-weight: 500;
  color: inherit;
}

.sub {
  font-size: 11px;
  color: #555;
}
</style>
