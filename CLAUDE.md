# YT Downloader Desktop

App desktop para baixar vídeos e músicas do YouTube. Construído com Electron + yt-dlp bundled.

## Objetivo

Aplicativo simples e funcional para uso pessoal em dois computadores:
- Mac (uso próprio)
- Windows (PC da igreja)

Sem servidor, sem dependências externas — tudo roda localmente após instalação.

---

## Stack

- **Electron** — framework desktop (gera .dmg para Mac e .exe para Windows)
- **electron-builder** — empacotamento e geração dos instaladores
- **yt-dlp** — binário bundled, responsável por todos os downloads
- **ffmpeg** — binário bundled, responsável pela conversão de formatos
- **Vue 3** — interface do usuário (Renderer Process), com Composition API
- **Vite** — bundler do frontend (já integrado via electron-vite)
- **Node.js** — backend do Electron (Main Process)

---

## Arquitetura

```
src/
  main/
    index.js         ← Main Process (Node.js): janela, IPC, spawn do yt-dlp
  preload/
    index.js         ← Bridge segura entre Renderer e Main (contextBridge)
  renderer/
    src/
      App.vue        ← Componente raiz
      components/
        UrlInput.vue      ← Campo de URL + botão analisar
        FormatSelector.vue ← Seletor de formato (MP4/MP3/qualidade)
        ProgressBar.vue   ← Barra de progresso em tempo real
        HistoryList.vue   ← Histórico de downloads
      composables/
        useDownload.js    ← Lógica de download (estado reativo)
        useHistory.js     ← Gerenciamento do histórico local
assets/
  bin/
    yt-dlp           ← Binário do yt-dlp (Mac ARM64/x64)
    yt-dlp.exe       ← Binário do yt-dlp (Windows)
    ffmpeg           ← Binário do ffmpeg (Mac)
    ffmpeg.exe       ← Binário do ffmpeg (Windows)
```

## Inicialização do projeto

```bash
npm create @quick-start/electron yt-downloader -- --template vue
cd yt-downloader
npm install
npm run dev   # inicia em modo desenvolvimento com hot reload
```

Isso já configura Electron + Vue 3 + Vite + hot reload prontos para usar.

### Comunicação IPC

O Renderer **nunca** acessa Node.js diretamente. Toda comunicação passa pelo `preload/index.js` via `contextBridge`. Os composables Vue chamam `window.api` que é exposto pelo preload:

```
Renderer → ipcRenderer.invoke('download', payload)
Main     → ipcMain.handle('download', handler)
         → spawna yt-dlp como child_process
         → envia progresso via ipcMain.emit → webContents.send
```

---

## Funcionalidades do escopo atual (v1)

- [ ] Campo para colar URL do YouTube
- [ ] Seletor de formato:
  - Vídeo MP4 (melhor qualidade disponível)
  - Vídeo MP4 720p
  - Vídeo MP4 480p
  - Somente áudio MP3 (alta qualidade)
  - Somente áudio MP3 (média qualidade)
- [ ] Barra de progresso em tempo real (capturada do stdout do yt-dlp)
- [ ] Nome e thumbnail do vídeo exibidos após análise da URL
- [ ] Botão para abrir a pasta de downloads
- [ ] Histórico simples dos últimos downloads (salvo em JSON local)
- [ ] Suporte a playlists (baixa todos os itens em sequência)

### Fora do escopo v1 (implementar depois)

- Transcrição com Whisper
- Agendamento de downloads
- Download simultâneo paralelo
- Integração com nuvem

---

## Binários bundled

Os binários do yt-dlp e ffmpeg devem ser incluídos na pasta `assets/bin/` e **não** depender de instalação prévia no sistema.

### Como obter os binários

**yt-dlp:**
```bash
# Mac ARM64
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos -o assets/bin/yt-dlp
chmod +x assets/bin/yt-dlp

# Windows (baixar manualmente)
# https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
```

**ffmpeg:**
Usar o pacote `ffmpeg-static` do npm para bundling simplificado:
```bash
npm install ffmpeg-static
```
O caminho do binário fica disponível via `require('ffmpeg-static')`.

### Detectar plataforma no Main Process

```javascript
const { platform } = process;
const ytdlpBin = platform === 'win32'
  ? path.join(__dirname, 'assets/bin/yt-dlp.exe')
  : path.join(__dirname, 'assets/bin/yt-dlp');
```

---

## Segurança do Electron

Seguir as boas práticas obrigatórias:

```javascript
// main.js — sempre assim
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // NUNCA true
    contextIsolation: true,      // SEMPRE true
    preload: path.join(__dirname, 'preload.js')
  }
})
```

---

## Estado reativo no Vue

Usar `ref` e `computed` da Composition API para gerenciar estado do download:

```javascript
// composables/useDownload.js
import { ref } from 'vue'

export function useDownload() {
  const progress = ref(0)
  const status = ref('idle') // idle | analyzing | downloading | done | error
  const videoInfo = ref(null)

  async function startDownload(url, format) {
    status.value = 'downloading'
    window.api.onProgress((percent) => {
      progress.value = percent
    })
    await window.api.download({ url, format })
    status.value = 'done'
  }

  return { progress, status, videoInfo, startDownload }
}
```

---

O yt-dlp emite linhas de progresso no stdout. Capturar e repassar para a UI:

```javascript
// Exemplo de linha de saída do yt-dlp:
// [download]  45.3% of 128.50MiB at 2.50MiB/s ETA 00:38

const progressRegex = /\[download\]\s+([\d.]+)%/;

ytdlpProcess.stdout.on('data', (data) => {
  const match = data.toString().match(progressRegex);
  if (match) {
    const percent = parseFloat(match[1]);
    mainWindow.webContents.send('download-progress', { percent });
  }
});
```

---

## Pasta de downloads

- Padrão: pasta `Downloads` do sistema operacional (`app.getPath('downloads')`)
- Organizar em subpastas por tipo: `Downloads/YTDownloader/videos/` e `Downloads/YTDownloader/audio/`
- Permitir que o usuário altere a pasta nas configurações (salvar em `electron-store`)

---

## Empacotamento

```json
// package.json — configuração do electron-builder
{
  "build": {
    "appId": "com.pessoal.ytdownloader",
    "productName": "YT Downloader",
    "mac": {
      "target": ["dmg"],
      "arch": ["arm64", "x64"]
    },
    "win": {
      "target": ["nsis"],
      "arch": ["x64"]
    },
    "extraResources": [
      { "from": "assets/bin/", "to": "bin/", "filter": ["**/*"] }
    ]
  }
}
```

---

## Convenções de código

- Arquivos em português nos comentários quando relevante para o contexto
- `async/await` em vez de callbacks
- Tratar erros do yt-dlp: URL inválida, vídeo indisponível, sem conexão
- Não hardcodar caminhos — usar `path.join` e `app.getPath()` sempre

---

## Comandos úteis

```bash
npm run dev          # Inicia em modo desenvolvimento com hot reload
npm run build:mac    # Gera instalador .dmg
npm run build:win    # Gera instalador .exe (requer Wine no Mac ou CI)
```

---

## Próximos passos sugeridos (v2)

1. Adicionar Whisper para transcrição de áudio
2. Suporte a outras plataformas (Instagram, Twitter/X)
3. Download paralelo de múltiplas URLs
4. Interface de configurações (pasta de saída, qualidade padrão)
