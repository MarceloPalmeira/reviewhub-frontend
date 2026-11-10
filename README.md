# ReviewHub Frontend

Interface React 18, TypeScript e Vite para os produtos ReviewHub. Consome as APIs pelo gateway e recebe nome, cor, domínios e features de `/product.json`. Inclui autenticação, catálogo, reviews, perfil, seguidores, comentários, curtidas, listas próprias e feed condicionado pelas features. Leia também o README do backend para limites e infraestrutura.

## Desenvolvimento com mise

Instale o [mise](https://mise.jdx.dev/getting-started.html) e mantenha este diretório ao lado de `reviewhub-backend`. O `mise.toml` fixa Node 24.22.2, compatível com o Vitest e o Vite do lockfile. Na raiz do frontend:

```sh
mise trust                 # somente se solicitado
mise install
mise run setup             # npm ci com package-lock.json
mise run start             # Vite com hot reload em http://localhost:5173
mise run dev               # mesmo comando Vite
mise run build
mise run test
mise run lint
mise run format
mise run check             # lint, testes e build
mise tasks ls
```

Para dados reais, derive um produto e inicie o backend conforme seu README. No modo nativo, `mise run start` no backend executa os três serviços e um gateway de desenvolvimento em `http://127.0.0.1:8080`; o Vite encaminha `/api` e `/product.json` a esse gateway. O Axios usa URLs relativas, então o navegador acessa a mesma origem do frontend, normalmente `http://localhost:5173`.

No Docker Compose, o React é compilado no build e servido pelo Nginx em `http://localhost:5173`. O navegador usa URLs relativas e o Nginx encaminha `/api/` e `/product.json` ao gateway interno; o gateway também é publicado no host em `http://localhost:8080`. No backend, use `mise run docker:up`, `mise run db:migrate` e `mise run db:seed`. `API_TARGET` configura apenas o proxy do Vite no desenvolvimento nativo, por exemplo `API_TARGET=http://127.0.0.1:8080 mise run start`; não altera o Nginx do Compose.

O build usa URLs relativas por padrão e requer que o servidor da aplicação encaminhe `/api` e `/product.json` ao gateway de produção. Alternativamente, defina `VITE_API_BASE_URL=https://api.exemplo.com` ao executar `mise run build`; a origem escolhida deve servir ambas as rotas e permitir CORS da origem do frontend. Variáveis `VITE_` são públicas no bundle: nunca inclua credenciais. Não há endereço de localhost embutido por padrão no cliente de produção.

Para E2E, instale o navegador com `npx playwright install chromium`, inicie um ambiente **de teste isolado** com serviços reais e derive o produto correspondente no backend. As tasks não iniciam os serviços nem trocam o produto:

```sh
mise run e2e               # usa E2E_PRODUCT, Complete por padrão
mise run e2e:complete
mise run e2e:cinehub
mise run e2e:matchhub
```

`E2E_BASE_URL` pode apontar ao frontend do ambiente de teste. Os testes criam dados no ambiente indicado. Uma alternativa local com PostgreSQL temporário, sem Docker, é `uv run python scripts/e2e_local.py complete` no backend (ou `cinehub`/`matchhub`). JWT é guardado no armazenamento local; respostas 401 encerram a sessão. Isso apresenta risco de exposição por XSS e precisa de revisão para produção.

React Router, Axios, React Hook Form, Zod, Vitest, Testing Library, jsdom e Biome compõem a stack. `src/api.ts` concentra comunicação e tipos; `src/main.tsx` contém rotas e telas; `src/Social.tsx` implementa interações e feed; `src/ReviewCard.tsx` exibe reviews. Estilos e tokens básicos estão em `src/style.css`.

Os testes verificam login, rota protegida, spoiler, comentários, curtidas e features desligadas com APIs simuladas. O teste HTTP com PostgreSQL está no backend. Os testes Playwright usam APIs reais e foram executados com PostgreSQL e serviços locais por um proxy de teste; a execução pelo Nginx e Compose ainda precisa ser validada. Os testes criam dados no ambiente apontado; use apenas ambiente isolado. Listas de reviews e perfil mostram a primeira página; o total e a média por conteúdo vêm do backend.

## Catálogo externo

No catálogo, selecione um domínio habilitado, informe a busca e escolha a pesquisa externa. Resultados podem ser abertos e importados por usuários autenticados; em seguida o conteúdo recebe reviews e pode ser incluído em listas. A busca local continua disponível quando não há credenciais ou o provedor falha. As médias exibidas são da comunidade ReviewHub e são consultadas em lote. A configuração, limites e atribuições dos provedores estão em `reviewhub-backend/docs/provedores.md`.

## Interface e temas

O design system está em `src/components/ui.tsx` e os tokens responsivos em `src/style.css`. O cabeçalho, as categorias e as ações acompanham o manifesto; a cor de cada produto alimenta os tokens visuais. Capas fornecidas pelo catálogo são exibidas quando disponíveis; na ausência delas, um placeholder local identifica o domínio. A seção “Bem avaliados” usa médias reais das cinco novidades carregadas, sem apresentar um ranking global.

Os testes Playwright verificam os fluxos de cada produto; `e2e/visual.pw.ts` registra capturas desktop e mobile de páginas do Complete e verifica overflow e navegação por teclado. Os arquivos gerados ficam em `test-results/` e não são versionados. Essas verificações não constituem auditoria completa de acessibilidade.
