# RetroVault — Plano de ação

Levantado em 29/07/2026. Itens marcados como **verificado** foram testados
empiricamente; os demais são suposição até alguém olhar.

Escopo ativo: fases 1 e 2. O que estava nas fases 3 e 4 foi parado por
decisão de 29/07/2026 e está preservado ao final, em **Arquivado**.

---

## Fase 1 — Verificações pendentes (~20 min, tudo no painel da Cloudflare)

Nenhum destes foi conferido. Não significa que estejam errados — significa
que ninguém olhou. São todos leitura, sem risco de quebrar nada.

- [ ] **SSL/TLS → Overview: modo deve ser `Full (Strict)`**
      Se estiver em `Flexible`, o tráfego Cloudflare→S3 vai sem criptografia.
      É o item de maior impacto da fase.
- [ ] **DNS → Settings: DNSSEC ligado**
      Um clique. Evita sequestro de resolução.
- [ ] **Security → WAF → Managed rules: ruleset gratuito ativo**
      O plano Free inclui o *Cloudflare Free Managed Ruleset* (cobre CVEs
      críticas). Confirmar que não foi desativado.
- [ ] **Security → Bots: Bot Fight Mode**
      Grátis. Corta scanner automatizado.
- [ ] **DNS → Records: todo registro que serve tráfego com proxy ligado**
      Nuvem cinza = requisição não passa pela Cloudflare, e o bloqueio
      geográfico e o cache não se aplicam àquele host.

---

## Fase 2 — Decisões em aberto

### 2.1 Rate limiting

**Estado:** não configurado.

O plano Free dá 1 regra. Para um catálogo de ROMs é provavelmente o item de
maior retorno da fase: limita download repetido do mesmo arquivo e protege a
banda independentemente de `Referer`, que é falsificável.

Se for escolher só um entre 2.1 e 2.2, este.

### 2.2 Hotlink protection

**Estado:** não existe. Verificado — `Referer: https://outrosite.com` em
`/roms/snes/aladdin.sfc` retorna `200`.

**Risco:** outro site aponta o `EJS_gameUrl` dele para o nosso bucket e
serve o catálogo inteiro sem infraestrutura. A banda é nossa.

**Como:** Security → Security rules → Create rule, ação `Block`:

```
(starts_with(http.request.uri.path, "/roms/") and http.referer ne "" and not http.referer contains "emu.dellabeneta.com")
```

O `http.referer ne ""` permite Referer ausente — link direto e usuário com
extensão de privacidade continuam funcionando.

**Depois de criar:** adicionar `EXPECT_HOTLINK: '1'` ao `env` do job `smoke`
em `.github/workflows/deploy-emu.yml`. Os dois testes já existem em
`tests/infra/security.sh`, apenas pulados.

**Limite honesto:** é lombada, não fechadura. Quem hospedar com
`Referrer-Policy: no-referrer` contorna. Resolve embed casual, que é a
maioria. Solução real seria URL assinada via Worker — desproporcional aqui.

**Custo:** 1 das 5 custom rules do plano Free. Cache Rules são cota separada.

### 2.3 HSTS de 30 dias

**Estado:** verificado — `max-age=2592000`.

Funciona, mas fica abaixo do mínimo de 1 ano exigido para entrar na lista de
preload dos navegadores. Só vale mexer se preload for um objetivo.

### 2.4 HTML sem cache

**Estado:** verificado — `cf-cache-status: DYNAMIC` na home.

São ~10 KB por visita indo ao S3. Impacto baixo perto do que já foi
resolvido nas ROMs. Uma Cache Rule com TTL curto (5–15 min) fecha, sem
atrasar deploy de forma perceptível.

### 2.5 Teste de origem trancada

O `security.sh` tem o teste pronto mas pulado, porque falta o secret
`S3_ORIGIN_URL`. O valor está em Cloudflare → DNS → Records → registro
`emu`, campo **Content**, com `http://` na frente.

Valida que a policy do bucket (só IPs da Cloudflare) continua de pé — a
premissa em que geo, cache e WAF se apoiam.

---

## Acompanhamento contínuo

- **Hit ratio do cache** — Analytics → Caching. Deve subir e estabilizar
  agora que `/roms/*` cacheia.
- **Fatura da AWS no fechamento do mês** — é a validação real da Cache Rule.
  O ganho não aparece imediatamente: o cache precisa esquentar por PoP.

---

## Fora de escopo (decidido)

- **Uptime e scan de TLS no pipeline** — não pertencem ao CI. Disponibilidade
  é monitoramento contínuo; TLS muda raramente e cabe num cron mensal.
  CI testa o que o deploy mudou, monitoramento testa o que o tempo quebra.
- **Lighthouse em CI** — flaky, vira ruído que todo mundo aprende a ignorar.

---
---

# Arquivado

> Parado por decisão de 29/07/2026. Não está no escopo ativo. Preservado
> aqui porque o levantamento tem valor se o assunto voltar.

## Observabilidade / Grafana

- Cloudflare **Web Analytics** — Analytics → Web Analytics. Grátis, sem
  token, sem cookie. Entrega Core Web Vitals e navegação real. Cobriria
  sozinho a instrumentação de frontend. É um snippet no `index.html`.
- Cloudflare **Notifications** — alerta por e-mail em erro 5xx na origem,
  pico de tráfego e expiração de certificado. Grátis, sem infraestrutura.
- **Token novo da Cloudflare** com escopo `Zone → Analytics → Read`
  (o antigo foi revogado e deletado).
- **Onde o Grafana roda.** Docker não está instalado na máquina de
  desenvolvimento — decidir entre instalar, VM, ou Grafana Cloud.
- **Dashboard via plugin Infinity** consultando a GraphQL Analytics API
  direto, sem Prometheus (arquitetura já decidida).
  Datasets disponíveis no plano Free: `httpRequests1dGroups`,
  `httpRequests1hGroups`, `httpRequestsAdaptiveGroups` (janela máx. 1 dia),
  `workersInvocationsAdaptive`.
  **Não** disponíveis: `httpRequests1mGroups`,
  `firewallEventsAdaptiveGroups` — por isso exporters prontos não funcionam
  em zone Free.
- **`docs/observability.md`** — documento técnico da arquitetura.

## CI/CD com OIDC

O deploy usa `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` em secrets. São
credenciais de longa duração: não expiram e, se vazarem, valem até alguém
revogar na mão. Com OIDC o GitHub troca um token efêmero por uma role do IAM
e os dois secrets somem do repositório.

Envolveria:
1. Criar um OIDC identity provider na AWS apontando para
   `token.actions.githubusercontent.com`
2. Criar a role com trust policy restrita a este repositório e branch
3. Adicionar `permissions: id-token: write` ao job
4. Trocar as credenciais estáticas por `role-to-assume` na action
5. Deletar os dois secrets
