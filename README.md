# Radar Diário — Patrimar

Painel de notícias em arquivo único, sem etapa de compilação. Lê feeds RSS
públicos direto no navegador e organiza em cinco seções: Brasil, Mundo,
Inteligência Artificial, Moveleiro, PPCP e Indústria.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | O painel inteiro: estrutura, estilo e lógica |
| `manifest.json` | Permite instalar como aplicativo no celular |
| `sw.js` | Service worker: guarda o casco do app, nunca as notícias |
| `logo-patrimar.png` | Logotipo do cabeçalho |
| `icon-192.png` | Ícone do atalho |
| `icon-512.png` | Ícone em alta resolução e versão adaptável |
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

### Trocar ou acrescentar fontes

No `index.html`, procurar a constante `SECOES`. Cada seção é uma lista de
fontes no formato `{ v: "Nome exibido", u: "URL do feed" }`. O campo opcional
`reserva` guarda um segundo endereço, usado quando o primeiro não responde.

Para acompanhar um assunto sem depender de um veículo específico, usar a
função auxiliar `gn("termos de busca")`, que monta uma consulta no Google
Notícias em português.

### Como o painel chega até os feeds

O navegador não consegue ler RSS de outro domínio sem um intermediário. O
painel mantém cinco pontes públicas gratuitas na constante `PONTES` e vai
testando uma a uma:

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

Para eliminar a dependência de terceiros, publicar um Apps Script próprio que
devolva o conteúdo do feed e preencher a URL do `/exec` em
`CONFIG.PROXY_PROPRIO`, no topo do bloco de script. Quando preenchido, ele
entra na frente das pontes públicas.

### Quando uma fonte não responde

O painel não apaga o que já tinha: mantém as notícias anteriores daquela
fonte, marca o veículo em âmbar no rodapé e mostra o horário de cada matéria,
para não passar manchete velha por nova. Se nenhuma fonte de uma seção
responder, aparece um aviso explicando o que fazer.

### Depois de alterar o `sw.js`

Aumentar o número da versão em `const CACHE = "radar-casco-v2"` para
`v3`, `v4` e assim por diante. Sem isso, o navegador continua servindo a
versão antiga guardada.

### Trocar a marca

O cabeçalho usa `logo-patrimar.png` e os atalhos usam `icon-192.png` e
`icon-512.png`, todos derivados de `Logotipo Patrimar.jpg`. Para trocar a
arte, substituir os arquivos mantendo os mesmos nomes e proporções e
aumentar a versão do `sw.js`.

## Observações

- Não há chamada de IA em nenhum ponto. Custo de operação é zero.
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
