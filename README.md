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
| `icon-192.png` | Ícone do atalho |
| `icon-512.png` | Ícone em alta resolução e versão adaptável |

Todos os cinco ficam na raiz do repositório, sem subpastas.

## Como publicar

1. Criar um repositório novo no GitHub (exemplo: `radar-diario`)
2. Na tela do repositório vazio, usar **uploading an existing file** e arrastar
   os cinco arquivos de uma vez
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
fontes no formato `{ v: "Nome exibido", u: "URL do feed" }`.

Para acompanhar um assunto sem depender de um veículo específico, usar a
função auxiliar `gn("termos de busca")`, que monta uma consulta no Google
Notícias em português.

### Estabilizar a leitura dos feeds

O navegador não consegue ler RSS de outro domínio sem intermediário. Por
padrão o painel usa dois proxies públicos gratuitos, com troca automática
se o primeiro falhar. São serviços de terceiros e podem ficar lentos ou sair
do ar.

Para eliminar essa dependência, publicar um Apps Script próprio que devolva
o conteúdo do feed e preencher a URL do `/exec` em `CONFIG.PROXY_PROPRIO`,
no topo do bloco de script. Quando preenchido, ele passa a ter prioridade
sobre os proxies públicos.

### Depois de alterar o `sw.js`

Aumentar o número da versão em `const CACHE = "radar-casco-v1"` para
`v2`, `v3` e assim por diante. Sem isso, o navegador continua servindo a
versão antiga guardada.

## Observações

- Não há chamada de IA em nenhum ponto. Custo de operação é zero.
- As notícias nunca são guardadas em cache pelo service worker, para não
  correr o risco de a tela abrir com manchete velha parecendo atual.
- O vermelho `#DB2126` é reservado para marca e ação principal. Falha de
  fonte usa âmbar, com o nome da fonte visível no rodapé.
- A marca "novo" compara a data da notícia com a última vez que o painel
  foi aberto naquele aparelho.
