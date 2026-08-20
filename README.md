# Radar Diário — Patrimar

Painel de notícias em arquivo único, sem etapa de compilação. Lê feeds RSS
públicos direto no navegador e organiza em quatro seções, todas voltadas ao
ramo: **Patrimar**, **PPCP e Indústria**, **Moveleiro** e **Inteligência
Artificial**.

A aba Patrimar é a da casa: abre o painel, fica marcada com a estrela da
marca e reúne menções à empresa, o mercado de planejados e a concorrência.

Não há seção de notícia geral. Feed de jornal aberto trazia terremoto,
estreia de série e emoji junto com o que interessa; as fontes de hoje são
consultas fechadas no assunto.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | O painel inteiro: estrutura, estilo e lógica |
| `api/feed.js` | Ponte própria: busca os feeds pelo mesmo domínio, sem CORS |
| `api/resumir.js` | Escreve a leitura do dia com o Claude, guardando a chave no servidor |
| `api/mural.js` | Mural interno: guarda os recados e as notícias fixadas da aba Patrimar |
| `package.json` | Dependência e o `type: module` das funções; o painel segue sem compilação |
| `manifest.json` | Permite instalar como aplicativo no celular e no PC |
| `sw.js` | Service worker: guarda o casco do app, nunca as notícias |
| `logo-patrimar.png` | Logotipo do cabeçalho |
| `icon-192.png` | Ícone do atalho |
| `icon-512.png` | Ícone em alta resolução |
| `icon-maskable-512.png` | Versão adaptável, para a máscara do Android |
| `apple-touch-icon.png` | Ícone da tela de início do iPhone |
| `Logotipo Patrimar.jpg` | Arte original da marca, de onde saíram o logo e os ícones |

Todos ficam na raiz do repositório, sem subpastas.

## Como publicar

1. Criar um repositório novo no GitHub (exemplo: `radar-diario`)
2. Na tela do repositório vazio, usar **uploading an existing file** e arrastar
   os arquivos de uma vez
3. Confirmar o commit
4. No Vercel: **Add New → Project**, selecionar o repositório e clicar em Deploy

Não é preciso escolher framework nem definir comando de build. O Vercel
reconhece site estático automaticamente.

## Como instalar no celular

Abrir o endereço publicado e escolher a opção de instalar:

- **Android (Chrome):** menu de três pontinhos → *Instalar aplicativo*
- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*
- **Computador (Chrome ou Edge):** ícone de instalação na barra de endereço

O atalho abre em janela própria, com o ícone vermelho da Patrimar.

## Manutenção

### Acentuação dos feeds

Nem todo feed é UTF-8. Lido como se fosse, "vigário" vira "vig?rio". A
codificação certa é procurada em ordem — cabeçalho HTTP, declaração do
próprio XML, e por fim UTF-8 e windows-1252 — e vence a primeira leitura sem
caractere perdido. A conferência existe nos dois lados: no `api/feed.js`,
que já devolve tudo em UTF-8, e no navegador, para o caso de a notícia ter
vindo por uma ponte pública.

### Trocar ou acrescentar fontes

No `index.html`, procurar a constante `SECOES`. Cada seção é uma lista de
fontes no formato `{ v: "Nome exibido", u: "URL do feed" }`. O campo opcional
`reserva` guarda um segundo endereço, usado quando o primeiro não responde.

Para acompanhar um assunto sem depender de um veículo específico, usar a
função auxiliar `gn("termos de busca")`, que monta uma consulta no Google
Notícias em português.

### Como o painel chega até os feeds

O navegador não consegue ler RSS de outro domínio sem um intermediário.

A ponte principal é a própria: `api/feed.js` roda como função da Vercel, no
mesmo endereço do painel. Não há CORS, não há cota de terceiro e a resposta
fica cinco minutos no cache da borda — as fontes recebem uma visita em vez de
uma para cada aparelho que abre o app. Ela só aceita os domínios das fontes
configuradas; uma ponte aberta viraria proxy de qualquer endereço da internet.
Ao acrescentar uma fonte nova, incluir o domínio dela na lista `DOMINIOS` do
`api/feed.js`.

Como reserva, o painel mantém sete pontes públicas gratuitas na constante
`PONTES` e vai testando uma a uma:

- começa pela ponte que respondeu da última vez, guardada no aparelho;
- ponte que falha vai perdendo posição e, depois de quatro tropeços seguidos,
  sai do resto da atualização;
- o placar zera a cada atualização, então uma ponte que voltou ao ar é testada
  de novo;
- se o feed do veículo estiver fora do ar, a fonte cai para o endereço
  `reserva` — uma busca no Google Notícias restrita àquele site.

As requisições passam por uma fila única de seis simultâneas. Sem ela as 26
fontes disparam de uma vez, o navegador segura a maioria na fila de conexões
e o tempo limite estoura antes de a requisição sair — que era o motivo mais
comum de o painel abrir vazio.

Fora da Vercel — em um servidor sem `/api`, por exemplo — a ponte própria
falha três vezes, sai da rodada e as públicas assumem sozinhas. Para apontar
para outro intermediário, como um Apps Script, basta trocar o valor de
`CONFIG.PROXY_PROPRIO` no topo do bloco de script.

### Quando uma fonte não responde

O painel não apaga o que já tinha: mantém as notícias anteriores daquela
fonte, marca o veículo em âmbar no rodapé e mostra o horário de cada matéria,
para não passar manchete velha por nova. Se nenhuma fonte de uma seção
responder, aparece um aviso explicando o que fazer.

## Resumo do dia e impressão

O botão **Resumo do dia**, na barra de filtros, troca a lista pelas principais
manchetes de cada seção. A escolha não usa IA: cada manchete ganha nota pelos
assuntos mais repetidos do dia que ela contém, com um empurrão para as mais
recentes — assunto que vários veículos publicam ao mesmo tempo costuma ser o
que importa. Quantas entram por seção é `CONFIG.RESUMO_POR_SECAO`.

O botão **Imprimir** abre a caixa de impressão do navegador, que também salva
em PDF. O papel sai sem cabeçalho, filtros nem rodapé: só o logotipo, a data e
as notícias em duas colunas. Vale para as duas telas — no resumo sai o resumo,
na lista sai a seção aberta.

## Buscar no arquivo

O filtro de período tem dois grupos. Em **Notícias do dia** ficam os recortes
de hora do radar. Em **Arquivo** ficam os últimos anos.

Ao escolher um ano, o campo de busca muda de função: em vez de filtrar a lista
na tela, ele consulta o arquivo do Google Notícias com recorte de data ao
teclar **Enter**. É assim que se alcança matéria de 2024 — o RSS dos veículos
só carrega o que saiu nos últimos dias.

A consulta enviada é `termo after:ANO-01-01 before:ANO+1-01-01`. O resultado
ainda passa por uma conferência de data no navegador: matéria de outro ano é
descartada e o total de descartadas aparece quando a busca fica vazia. Para
voltar ao radar, escolher *Qualquer período*. Quantos anos aparecem na lista é
`CONFIG.ARQUIVO_ANOS`.

## Mural interno

Na aba Patrimar, acima das notícias, fica o mural: o que é publicado ali
aparece para todo mundo que abre o app.

Dois tipos de aviso convivem no mesmo bloco, do mais recente para o mais
antigo:

- **Recado** — texto escrito pela equipe. Botão **Novo recado**.
- **Fixada** — manchete do próprio painel. Botão **Fixar notícia** liga o
  modo de fixar, que faz aparecer um alfinete no canto de cada cartão;
  clicar no alfinete abre a caixa já com o título e o link preenchidos.

No modo de fixar também aparece o ✕ para tirar um aviso do mural.

Publicar e apagar pedem a senha, conferida no servidor — o navegador nunca
decide isso sozinho. A senha digitada fica só na memória da aba, para não
precisar redigitar a cada aviso, e some quando a aba fecha. Ler é aberto:
quem tem o app vê o mural sem senha nenhuma.

Link de aviso só é aceito em `http` ou `https`, para ninguém publicar um
`javascript:` que rodaria no aparelho de quem abrisse.

### O que ligar na Vercel

O painel é estático, então o texto precisa morar em algum lugar. O mural usa
o Redis da Vercel:

1. No projeto, aba **Storage**, criar um banco **Redis**. Ao conectar ao
   projeto, a Vercel cadastra sozinha `KV_REST_API_URL` e `KV_REST_API_TOKEN`
   (os nomes `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` também
   servem — a Vercel entrega ora um par, ora o outro).
2. Em **Settings → Environment Variables**, criar `SENHA_MURAL` com a senha
   que a equipe vai usar para publicar.
3. Publicar de novo.

Sem isso, o mural aparece com o aviso de que não está configurado e o resto
do painel funciona igual.

## Leitura do dia escrita por IA

Dentro do **Resumo do dia** há o botão **Escrever a leitura do dia**. Ele
manda as manchetes já selecionadas para `api/resumir.js`, que chama o Claude
e devolve um parágrafo de abertura, uma linha por seção e um "De olho:" com o
que merece acompanhamento.

É sob demanda, nunca automático: sem clique, não há chamada nem custo. O
modelo é instruído a usar apenas as manchetes recebidas, sem completar com
conhecimento próprio nem estimar número. Ainda assim, é texto de máquina —
o rodapé do bloco lembra de conferir antes de repassar.

### Onde vai a chave da API

Na Vercel: **Settings → Environment Variables → `ANTHROPIC_API_KEY`**, com a
chave da Anthropic, e publicar de novo.

A chave fica no servidor e nunca chega ao navegador. Colocá-la no
`index.html` seria entregá-la a qualquer visitante que abrisse o código-fonte
da página. Sem a variável, a função responde 503 e o botão explica o que
falta — o resto do painel funciona igual, sem IA nenhuma.

O modelo é `claude-opus-5`, com esforço baixo, resposta limitada a 2000
tokens e no máximo 80 manchetes por chamada. Na tabela da Anthropic isso dá
alguns centavos de dólar por clique. Está ligado também o desvio automático
de recusa (`fallbacks`), para o botão não morrer numa manchete que o modelo
prefira não comentar.

## Instalação

No Chrome e no Edge o painel mostra o botão **Instalar** assim que o navegador
reconhece o app. No iPhone o Safari não oferece esse convite, então aparece uma
faixa explicando o caminho: Compartilhar → Adicionar à Tela de Início. A faixa
some depois de fechada uma vez.

### Depois de alterar o `sw.js`

Aumentar o número da versão em `const CACHE = "radar-casco-v3"` para
`v4`, `v5` e assim por diante. Sem isso, o navegador continua servindo a
versão antiga guardada.

### Trocar a marca

O cabeçalho usa `logo-patrimar.png` e os atalhos usam `icon-192.png` e
`icon-512.png`, todos derivados de `Logotipo Patrimar.jpg`. Para trocar a
arte, substituir os arquivos mantendo os mesmos nomes e proporções e
aumentar a versão do `sw.js`.

## Observações

- A única chamada de IA é o botão da leitura do dia, e só quando alguém
  clica. Sem isso, o custo de operação é zero.
- As notícias nunca são guardadas em cache pelo service worker, para não
  correr o risco de a tela abrir com manchete velha parecendo atual.
- O vermelho `#DB2126` é reservado para marca e ação principal. Falha de
  fonte usa âmbar, com o nome da fonte visível no rodapé.
- A marca "novo" compara a data da notícia com a última vez que o painel
  foi aberto naquele aparelho.
- As seções aparecem à medida que as fontes respondem, em vez de a tela ficar
  parada até a última delas.
- Manchetes vindas do Google Notícias perdem o sufixo " - Veículo" e passam a
  exibir o veículo de origem ao lado do assunto.
- A grade acompanha a tela: quatro colunas no monitor largo, três no PC comum
  e no tablet deitado, duas no tablet em pé e uma no celular.
