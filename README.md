```
██████╗ ███████╗████████╗██████╗  ██████╗ ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██████╔╝█████╗     ██║   ██████╔╝██║   ██║██║   ██║███████║██║   ██║██║     ██║   
██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   
```

> **Emulação retro no browser. Sem instalação. Sem cadastro. Só jogar.**

[![Site](https://img.shields.io/badge/SITE-emu.dellabeneta.com-2d6e4e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://emu.dellabeneta.com)
[![Deploy](https://img.shields.io/badge/DEPLOY-GitHub_Actions-cc8800?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/dellabeneta/emu.dellabeneta.com/actions)
[![CDN](https://img.shields.io/badge/CDN-Cloudflare-b05a10?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![Host](https://img.shields.io/badge/HOST-Amazon_S3-aa6600?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)

### O que é isso?

**RetroVault** é um catálogo interativo de jogos clássicos com emulação direto no browser. Interface estilo terminal CRT com efeito scanlines, tema cyberpunk verde/âmbar, suporte a 14 plataformas e centenas de títulos selecionados a dedo. Acessa, escolhe uma plataforma, escolhe o jogo e começa a jogar. É isso.

### Plataformas disponíveis

| Plataforma | Lançamento | Era | Emulador |
|---|---|---|---|
| Nintendo Entertainment System | 1983 | 80s | fceumm |
| Super Nintendo Entertainment System | 1990 | 90s | snes9x |
| Sega Master System | 1985 | 80s | genesis_plus_gx |
| Sega Mega Drive / Genesis | 1988 | 80s | genesis_plus_gx |
| Nintendo Game Boy | 1989 | 80s | gambatte |
| Nintendo Game Boy Color | 1998 | 90s | gambatte |
| Nintendo Game Boy Advance | 2001 | 00s | mgba |
| Sony PlayStation 1 | 1994 | 90s | pcsx_rearmed |
| Nintendo 64 | 1996 | 90s | mupen64plus |
| Arcade Classics (FBNeo) | — | 80s/90s | fbneo |
| Capcom Play System 1 | 1988 | 80s | fbneo |
| Capcom Play System 2 | 1993 | 90s | fbneo |
| Capcom Play System 3 | 1996 | 90s | fbneo |
| SNK Neo Geo MVS | 1990 | 90s | fbneo |

> Cerca de **290 jogos** catalogados, filtráveis por década e plataforma.

### Como usar

**Mouse / Touch**
- Navegue pelo carousel de plataformas com as setas
- Clique numa plataforma para ver os jogos
- Clique num jogo para iniciar

**Teclado**
| Tecla | Ação |
|---|---|
| `← →` | Navegar entre plataformas |
| `↑ ↓` | Navegar entre jogos |
| `Enter` | Iniciar jogo |
| `P` | Focar busca de plataforma |
| `J` | Focar busca de jogo |

**Idiomas:** PT-BR / EN — botão no canto superior direito.

### Stack técnica

```
Frontend            → HTML + CSS + JavaScript (sem frameworks, sem build)
Emulação            → EmulatorJS via CDN (cdn.emulatorjs.org) + SRI
Hospedagem          → AWS S3 (static website hosting)
CDN / HTTPS         → Cloudflare (proxy + cache + certificado)
Cache               → Cache Rules na Cloudflare (ROMs com TTL de 1 mês)
Contador de visitas → Cloudflare Worker + Workers KV
CI/CD               → GitHub Actions (test → deploy → smoke) + gitleaks
Segurança           → Bucket policy + WAF (geo + hotlink) + SRI + Security Headers
```

### Arquitetura

O diagrama abaixo mostra o fluxo completo de uma requisição — do usuário até os dados.

```
  Usuário abre emu.dellabeneta.com
              │
              ▼
  ┌───────────────────────────────────────────────────┐
  │                   Cloudflare                      │
  │    cache · HTTPS · WAF (geo+hotlink) · headers    │
  └────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴────────────┐
           │                        │
           │ GET /api/visits        │ GET /*
           │                        │ (html, css, js, roms, assets)
           ▼                        ▼
  ┌─────────────────────┐   ┌──────────────────────┐
  │  Cloudflare Worker  │   │       AWS S3         │
  │  retrovault-visits  │   │   bucket restrito    │
  │                     │   │                      │
  │  incrementa count   │   │  index.html          │
  │  retorna JSON       │   │  data.js             │
  │  { count: N }       │   │  script.js           │
  └──────────┬──────────┘   │  style.css           │
             │              │  favicon.ico         │
             │              │  assets/ · roms/     │
             ▼              └──────────────────────┘
  ┌─────────────────────┐
  │    Workers KV       │
  │    VISITORS         │
  │    { count: N }     │
  └─────────────────────┘

  GitHub ──push──► Actions: test ──► deploy ──► smoke
```

**Como o contador funciona na prática:**
1. Usuário abre o site — o browser carrega o `script.js` do S3 via Cloudflare
2. O JS faz `fetch('/api/visits')` — a Cloudflare roteia para o Worker
3. O Worker lê o valor atual do KV, incrementa, grava e retorna `{ count: N }`
4. O número aparece no rodapé ao lado do ícone de olho

### CI/CD

O workflow `.github/workflows/deploy-emu.yml` executa 3 jobs em sequência:

| Job | O que faz | Condição |
|---|---|---|
| `test` | Varredura de segredos (`gitleaks`) + testes unitários + validação do catálogo contra o S3 | Sempre ao push em `main` |
| `deploy` | Envia os 5 arquivos ao S3 + purge seletivo na Cloudflare | Só se `test` passar |
| `smoke` | Valida a borda ao vivo, contra produção | Só após `deploy` |

O purge de cache é **seletivo** — invalida apenas `index.html`, `data.js`, `script.js`, `style.css` e `favicon.ico`, preservando o cache de ROMs e assets na Cloudflare.

O purge é feito por chamada direta à API da Cloudflare, não por action de terceiro, e o job **reprova** se a resposta não trouxer `"success": true`. Purge que falha em silêncio é pior que purge nenhum: o deploy fica verde servindo conteúdo velho.

As credenciais AWS e Cloudflare são gerenciadas via GitHub Secrets, sem nenhuma informação sensível no código.

**Detalhe do smoke test:** o site é restrito ao Brasil, e runners do GitHub são estrangeiros. As requisições do CI atravessam o bloqueio por um header secreto (`SMOKE_KEY`). A localização do runner, em vez de obstáculo, virou parte do teste — uma requisição **sem** o header tem que receber `403`, o que valida o bloqueio geográfico de fora do país a cada deploy.

### Testes

```
tests/
├── infra/
│   ├── security.sh     # borda: geo, hotlink, cache, headers, HTTPS, favicon
│   └── catalog.js      # toda ROM do catálogo existe no S3 (disco como fallback)
└── unit/
    ├── i18n.js         # traduções PT/EN sincronizadas
    └── platforms.js    # estrutura obrigatória do PLATFORMS[]
```

Para rodar localmente:

```bash
bash tests/infra/security.sh
node tests/infra/catalog.js
node tests/unit/i18n.js
node tests/unit/platforms.js
```

O `security.sh` detecta o país de saída da execução e adapta as asserções: rodando do Brasil ele pula o teste de bloqueio geográfico, porque dali o teste não seria conclusivo. Testes que não podem concluir são **pulados com o motivo impresso**, nunca dados como aprovados.

### Estrutura do projeto

```
emu.dellabeneta.com/
├── index.html              # estrutura da interface
├── style.css               # tema CRT cyberpunk (verde #00ff88 + âmbar #ffaa00)
├── data.js                 # catálogo PLATFORMS[] e textos das plataformas
├── script.js               # lógica, i18n, integração EmulatorJS
├── favicon.ico
├── sync-s3.sh              # utilitário: sincroniza roms/ e assets/ com o S3
├── assets/                 # imagens das plataformas (S3, fora do git)
├── roms/                   # arquivos de jogo (S3, fora do git)
├── docs/
│   └── backlog.md          # plano de ação e decisões em aberto
├── tests/
│   ├── infra/
│   │   ├── security.sh
│   │   └── catalog.js
│   └── unit/
│       ├── i18n.js
│       └── platforms.js
└── .github/
    └── workflows/
        └── deploy-emu.yml
```

### Rodando localmente

Não precisa de build. Só precisa servir os arquivos estáticos — qualquer servidor HTTP funciona.

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# VS Code
# extensão Live Server → botão "Go Live"
```

> As ROMs precisam estar na pasta `roms/` localmente para o emulador funcionar.

### Sincronizando ROMs e assets com o S3

ROMs e assets não são versionados no git — vivem diretamente no S3. Para sincronizar após adicionar novos arquivos:

```bash
bash sync-s3.sh
```

Requer AWS CLI configurado localmente com as credenciais corretas.

### Cache e custo

As ROMs são o volume de dados do projeto. Quando cada partida vira um download
novo na origem, o egress do S3 aparece na fatura rápido.

O diagnóstico: o plano Free da Cloudflare só cacheia extensões conhecidas por
padrão. `.zip` e `.bin` entravam nessa lista; `.nes`, `.sfc`, `.gba` e companhia
**não** — retornavam `cf-cache-status: DYNAMIC` e sem nenhum `Cache-Control`.
Ou seja: toda partida ia até o S3, e nada ficava no navegador do jogador.

A correção foi uma Cache Rule em `/roms/*`:

| Configuração | Valor |
|---|---|
| Cache eligibility | `Eligible for cache` |
| Edge TTL | 1 mês (override origin) |
| Browser TTL | 1 mês (override origin) |

ROM é conteúdo imutável, então TTL longo é seguro. O `Browser TTL` resolve o
`Cache-Control` que a origem não enviava — reabrir o mesmo jogo passou a não
gerar requisição alguma.

Medido nos headers depois da mudança: `.nes` saiu de `DYNAMIC` para `HIT`, com
`Cache-Control: max-age=2678400`.

No mesmo passo, o `favicon.ico` caiu de **1,4 MB para 14,7 KB** — era maior que
qualquer ROM de NES do catálogo e carregava em toda visita. O smoke test tem
guarda para os dois casos, para que nenhum regrida em silêncio.

### Segurança

| Camada | Implementação |
|---|---|
| Acesso ao S3 | Bucket policy restrita aos IPs da Cloudflare — requisições diretas ao endpoint S3 retornam **403 Forbidden**. Todo o tráfego é obrigado a passar pela borda. |
| Bloqueio geográfico | WAF Custom Rule libera apenas o Brasil. Duas exceções deliberadas: bots verificados (`cf.client.bot`, para preservar indexação no Google e preview de link em WhatsApp/Discord) e um header secreto usado pelo CI. |
| Hotlink protection | WAF Custom Rule bloqueia `/roms/*` quando o `Referer` existe e não é do próprio domínio nem da CDN do EmulatorJS. Impede que outro site embuta o catálogo consumindo a banda daqui. |
| Integridade do EmulatorJS | SRI (Subresource Integrity) com hash SHA-256 na tag de carregamento — o browser recusa executar o script se o arquivo do CDN externo for adulterado. |
| Security headers | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin` e `Permissions-Policy` negando geolocalização, microfone, câmera e pagamento. |
| Segredos no repositório | `gitleaks` roda no CI antes do deploy, sobre o histórico do git. Segredo commitado reprova o pipeline e o release não sai. |

**Limites conhecidos.** Documentados de propósito, porque controle sem limite
declarado é marketing:

- Bloqueio geográfico depende de geolocalização por IP e hotlink protection
  depende do header `Referer`. VPN contorna o primeiro; `Referrer-Policy:
  no-referrer` contorna o segundo. São redução de superfície e de custo, não
  barreira contra atacante determinado.
- Regra de WAF nova **não** afeta objeto que já está no cache da borda. Foi
  preciso um purge para o hotlink protection valer nas ROMs já cacheadas.
- O endpoint do Formspree fica exposto no JS do cliente. É inevitável em
  front-end puro; a mitigação é a proteção anti-spam do próprio Formspree e a
  restrição de domínio.

### Modelo de ameaça

Vale explicitar o que este projeto **não** precisa proteger, porque é isso que
define o desenho:

- **Não há autenticação.** Não existe conta, login ou sessão. Sem credencial de
  usuário, não há credencial de usuário para vazar.
- **Não há base de usuários.** O único estado persistido é o contador de visitas
  no Workers KV: um inteiro, sem qualquer vínculo com pessoa.
- **O único dado pessoal é o formulário de feedback**, que pede nome e
  comentário. Ele não é armazenado na infraestrutura do projeto — vai direto ao
  Formspree, que é o responsável pelo tratamento.

O que sobra a proteger, então, é **a infraestrutura e o custo**: impedir acesso
direto ao bucket, impedir que terceiros sirvam o conteúdo às nossas custas, e
garantir que o que o browser executa é exatamente o que foi publicado.

### Contador de visitas

O rodapé exibe o número total de visitas ao site em tempo real, representado por um ícone de olho.

A solução é serverless e totalmente dentro da infraestrutura Cloudflare:

| Componente | Papel |
|---|---|
| **Cloudflare Worker** (`retrovault-visits`) | Função JavaScript que roda na borda da rede Cloudflare, sem servidor dedicado. Intercepta `GET /api/visits`, incrementa o contador e retorna JSON. |
| **Workers KV** (`VISITORS`) | Banco chave-valor distribuído globalmente. Armazena uma única chave: `count`. Leitura e escrita em qualquer edge da Cloudflare sem latência de região. |
| **Rota** | `emu.dellabeneta.com/api/visits` aponta exclusivamente para o Worker — o resto do tráfego segue para o S3 normalmente. |

Não há servidor, não há banco de dados relacional, não há dependência externa. O Worker é análogo a uma AWS Lambda com API Gateway — mas roda no edge, com cold start zero e integrado nativamente ao mesmo proxy que já serve o site.

### Feedback

O rodapé do site tem um botão **Feedback** que abre um modal para qualquer visitante deixar uma opinião, sugestão ou reportar um bug. O formulário pede nome completo e um comentário em texto livre (máximo 300 caracteres).

Os envios chegam por email via [Formspree](https://formspree.io) — sem backend, sem banco de dados. O endpoint do Formspree fica exposto no JS do cliente por design (é inevitável em front-end puro), mas o formulário tem proteção anti-spam nativa do Formspree e está restrito ao domínio `emu.dellabeneta.com`.

*[RetroVault] — feito por [@dellabeneta](https://github.com/dellabeneta)*
