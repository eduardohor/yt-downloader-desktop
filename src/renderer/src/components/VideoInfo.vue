<script setup>
const props = defineProps({
  videoInfo: Object
})

function formatarDuracao(segundos) {
  if (!segundos) return ''
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="video-info" v-if="props.videoInfo">
    <div v-if="props.videoInfo.isPlaylist" class="playlist">
      <div class="playlist-icon">📋</div>
      <div class="playlist-text">
        <div class="titulo">{{ props.videoInfo.title }}</div>
        <div class="meta">Playlist · {{ props.videoInfo.count }} vídeos</div>
      </div>
    </div>
    <div v-else class="video">
      <img
        v-if="props.videoInfo.thumbnail"
        :src="props.videoInfo.thumbnail"
        alt="thumbnail"
        class="thumb"
      />
      <div class="dados">
        <div class="titulo">{{ props.videoInfo.title }}</div>
        <div class="meta">
          <span v-if="props.videoInfo.uploader">{{ props.videoInfo.uploader }}</span>
          <span v-if="props.videoInfo.duration"> · {{ formatarDuracao(props.videoInfo.duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-info {
  width: 100%;
  background: #1e1e24;
  border: 1px solid #333;
  border-radius: 10px;
  overflow: hidden;
}

.video {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
}

.thumb {
  width: 100px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.dados {
  flex: 1;
  min-width: 0;
}

.titulo {
  font-size: 14px;
  font-weight: 600;
  color: #eee;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}

.playlist {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.playlist-icon {
  font-size: 28px;
}

.playlist-text .titulo {
  font-size: 14px;
  font-weight: 600;
  color: #eee;
}

.playlist-text .meta {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}
</style>
