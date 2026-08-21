# Radar Diário — Patrimar

Painel de notícias em arquivo único, sem etapa de compilação. Lê feeds RSS
públicos direto no navegador e organiza em cinco seções, todas voltadas ao
ramo: **Patrimar**, **PPCP e Indústria**, **Moveleiro**, **Tendências** e
**Inteligência Artificial**.

A aba Patrimar é a da casa: abre o painel, fica marcada com a estrela da
marca e reúne menções à empresa, o mercado de planejados e a concorrência.

Não há seção de notícia geral. Feed de jornal aberto trazia terremoto,
estreia de série e emoji junto com o que interessa; as fontes de hoje são
consultas fechadas no assunto.

## O que sobe primeiro

A grade não é uma fila por horário. Notícia recente e irrelevante ficava
acima da que interessava, e a mesma notícia aparecia três vezes com o crédito
de três veículos. Agora cada manchete recebe uma nota:

- **Tema** — palavras que pesam naquela seção, na constante `TEMAS`. "Patrimar"
  vale mais do que "planejados", que vale mais do que "franquia".
- **Cobertura** — em quantos veículos diferentes o mesmo assunto apareceu.
  Assunto que saiu em quatro lugares costuma ser o que importa; o cartão
  mostra isso como *"4 veículos"*.
- **Recência** — conta e também desconta. A partir de três dias a manchete
  perde posição de verdade; antes ela apenas deixava de ganhar bônus, então
  matéria de abril com tema forte subia igual à de hoje.
- **Descontos** — chamada de clique ("veja", "confira", "10 fotos") perde
  posição; manchete sem data também.

Assunto que nunca vai interessar ao PCP — horóscopo, futebol, sorteio — sai
antes de disputar espaço, pela constante `RUIDO`.

### O que nem chega e o que não passa

Dois cortes antes da nota decidir a fila:

- **Recorte de data na origem.** O Google Notícias ordena por relevância, não
  por data: sem recorte devolve matéria de abril junto com a de hoje. As
  consultas levam `when:` (7 dias por padrão, ajustável nas configurações), e
  o que não vem não precisa ser filtrado depois. A busca no arquivo não leva
  recorte, porque lá ele é outro.
- **Régua de relevância.** O que fica abaixo de `CONFIG.PISO_RELEVANCIA` sai.
  Mostrar noventa manchetes por aba não é completude, é empurrar para quem lê
  o trabalho de separar o que presta. Em dia fraco o piso cede: entram as
  melhores até `CONFIG.MINIMO_SECAO`, porque seção vazia seria pior e
  esconderia que o dia foi fraco.

As URLs das fontes são montadas **na hora da busca**, não na carga: sem isso,
trocar a janela nas configurações só teria efeito depois de recarregar a
página.

O primeiro colocado vira **destaque**: ocupa a largura de dois cartões, com
título maior e o filete vermelho da marca. Só ele usa o vermelho, que assim
volta a ser âncora em vez de enfeite repetido em toda a grade. O destaque só
aparece com a fila por relevância e sem filtro ligado — fora disso o primeiro
lugar seria acidente de ordenação.

O seletor **Mais relevantes / Mais recentes** troca a fila sem rebuscar nada,
e a escolha fica gravada no aparelho.

### Notícia repetida

Dois veículos publicam o mesmo fato com títulos diferentes. Comparar o texto
inteiro não pega isso; comparar as palavras que carregam sentido, pega. São
duas medidas, porque uma só erra:

- **Jaccard** (palavras em comum sobre o total) compara títulos de tamanho
  parecido, mas pune o curto: *"Patrimar anuncia expansão da fábrica em MG"*
  contra *"Patrimar Móveis anuncia expansão da fábrica em Minas Gerais"* dá
  0,57 e escaparia, embora o curto esteja inteiro dentro do longo.
- **Contenção** (comuns sobre o menor dos dois) pega esse caso, mas sozinha é
  frouxa — dois títulos de três palavras se parecem por acidente. Vale só
  quando o título curto já tem quatro palavras com sentido.

O que sobrevive guarda a lista de quem publicou, e é esse número que aparece
no cartão e vai junto para a leitura do dia.

### Tendências tem régua própria

Cor, acabamento e textura decidem o que a fábrica vai produzir, mas não se
parecem com notícia de indústria. Por isso a seção é separada em vez de
misturada no Moveleiro: a nota de lá premia "exportação", "MDF" e
"moveleira", então matéria sobre cor do ano pontuaria baixo e a régua a
cortaria.

A seção tem pesos próprios em `TEMAS.tendencias` — tendência, coleção,
paleta, Pantone, acabamento, revestimento, marcenaria, interiores.

E tem uma exceção que importa: o desconto por **chamariz de clique não vale
aqui**. "Veja as cores que vão dominar 2026" e "confira os acabamentos do
Salone" é como se escreve sobre design; ali a palavra é o gênero do texto,
não isca. Punir isso esvaziaria a seção inteira. A lista de seções isentas é
a constante `SEM_CHAMARIZ`.

O corte de ruído continua valendo: "horóscopo do dia: cores da sorte para
cada signo" sai, mesmo falando de cor.

Para juntar tudo no Moveleiro em vez de manter a aba, basta mover as fontes
de `SECOES` e acrescentar as linhas de `TEMAS.tendencias` em `TEMAS.moveleiro`.

### A outra Patrimar

Existe a **Patrimar Engenharia**, construtora e incorporadora de Minas, sem
relação nenhuma com a Patrimar Móveis. Buscar por "Patrimar" traz as duas, e
a aba da casa enchia de lançamento imobiliário e VGV.

A consulta do Google Notícias já pede para excluir `-engenharia`,
`-construtora`, `-incorporadora` e `-imobiliário`, mas a linguagem de busca é
frouxa e deixa passar. Quem decide é a trava no `index.html`, na constante
`EXCLUIR`: manchete com marca de construtora sai da aba **a menos que também
fale de móvel** — caso raro em que pode ser notícia das duas, como uma
incorporadora fechando parceria com fábrica de planejados.

A exclusão vale só nesta seção. Obra e mercado imobiliário continuam
aparecendo nas outras abas, onde são assunto legítimo.

## Cartões ou lista

O botão ao lado dos filtros alterna a densidade. **Cartões** para explorar,
com linha fina e resumo. **Lista** para escanear: uma linha por notícia, três
vezes mais manchete na mesma tela. A escolha fica gravada no aparelho.

No celular, os filtros de ordenação, veículo e período ficam atrás do botão
**Filtros** — no telefone eles custavam quatro linhas de tela antes da
primeira notícia. Busca, resumo e densidade seguem à vista.

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

Nem todo feed é UTF-8, e o erro acontece nos dois sentidos:

- Feed em ISO-8859-1 lido como UTF-8 transforma "vigário" em "vig?rio".
- Feed em UTF-8 lido como ISO-8859-1 transforma "persistência" em
  "persistÃªncia".

O segundo é mais comum e muito mais silencioso. A regra antiga procurava a
codificação em ordem — cabeçalho HTTP, declaração do XML, depois os palpites
— e aceitava a primeira leitura sem caractere perdido. Só que **ler UTF-8
como windows-1252 nunca produz caractere perdido**: windows-1252 tem símbolo
para quase todo byte. Feed que declarava ISO-8859-1 no cabeçalho mas entregava
bytes UTF-8 vencia de saída, e o teste aprovava a leitura errada.

Agora a primeira tentativa é UTF-8 em **modo estrito**, antes de olhar
qualquer declaração. Texto latin-1 com acento quase nunca forma sequência
UTF-8 válida — "á" isolado é o byte `0xE1` seguido de um espaço, que o
decodificador estrito recusa. Quem passa no estrito é UTF-8 de verdade; quem
não passa cai para o que o feed declarar, e windows-1252 no fim da fila.

A conferência existe nos dois lados: no `api/feed.js`, que já devolve tudo em
UTF-8, e no navegador, para o caso de a notícia ter vindo por uma ponte
pública.

### Trocar ou acrescentar fontes

No `index.html`, procurar a constante `SECOES`. Cada seção é uma lista de
fontes no formato `{ v: "Nome exibido", u: "URL do feed" }`. O campo opcional
`reserva` guarda um segundo endereço, usado quando o primeiro não responde.

Para acompanhar um assunto sem depender de um veículo específico, usar a
função auxiliar `gn("termos de busca")`, que monta uma consulta no Google
Notícias em português.

### Consulta em inglês

Feira de máquina alemã e italiana quase não sai na imprensa brasileira: LIGNA,
Interzum e Xylexpo são cobertas lá fora e chegam aqui pela revista técnica,
com semanas de atraso. Para esses assuntos vale perguntar em inglês, com a
função `gnEn("termos")` — a manchete vem em inglês, e é melhor do que não vir.

Consequência que não pode ser esquecida: manchete em inglês não casa com
padrão em português. `TEMAS.ppcp` e `TEMAS.tendencias` têm linhas próprias
para os termos em inglês (`woodworking`, `machinery`, `furniture fair`), senão
essas fontes pontuariam zero e a régua as cortaria inteiras.

**Cuidado com a precedência.** No Google, `OR` liga mais forte que o E
implícito: `A OR B C` é lido como `(A OR B) E C`, não como `A OU (B E C)`.
Várias consultas estavam escritas supondo o contrário. Use parênteses
explícitos — `(Movergs OR Abimóvel) (móveis OR moveleiro)` — e `-termo` para
excluir.

Os feeds do The Verge e do TechCrunch saíram: eram tecnologia de consumo, e
quase nada passava na régua. No lugar entrou uma consulta sobre IA em cadeia
de suprimentos. Para trazer os dois de volta, recolocar em `SECOES` e incluir
os domínios em `DOMINIOS`, no `api/feed.js`.

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

As requisições passam por uma fila única de seis simultâneas. Sem ela as 38
fontes disparam de uma vez, o navegador segura a maioria na fila de conexões
e o tempo limite estoura antes de a requisição sair — que era o motivo mais
comum de o painel abrir vazio.

Fora da Vercel — em um servidor sem `/api`, por exemplo — a ponte própria
falha três vezes, sai da rodada e as públicas assumem sozinhas. Para apontar
para outro intermediário, como um Apps Script, basta trocar o valor de
`CONFIG.PROXY_PROPRIO` no topo do bloco de script.

### Quando uma fonte não responde

O painel não apaga o que já tinha: mantém as notícias anteriores daquela
fonte e mostra o horário de cada matéria, para não passar manchete velha por
nova. Se nenhuma fonte de uma seção responder, aparece um aviso explicando o
que fazer.

O rodapé mostra só a exceção. Com tudo no ar, é uma linha dizendo quantas
fontes responderam; havendo falha, aparece a contagem em âmbar e o nome de
quem não respondeu. Listar as 38 fontes com bolinha verde não informava nada.

## Radar executivo

O botão **Radar**, na barra de filtros, troca a grade pelo radar do dia. Ele
não responde *"quais notícias saíram hoje"* — a grade já faz isso. Responde
*"o que aconteceu hoje que pode importar para a Patrimar, e o que observar ou
fazer"*.

A estrutura é fixa e cada parte só aparece se tiver conteúdo:

1. **Alertas principais** — no máximo três, com impacto (alto/médio/baixo) e
   horizonte (imediato / esta semana / próximas semanas / longo prazo). Dia
   sem alerta diz que não há, em vez de promover notícia média para encher.
2. **O que isso significa para a Patrimar** — leitura por área: Comercial,
   PPCP, Compras, Produção, Financeiro. Só entram as áreas realmente tocadas.
3. **Notícias por categoria** — PPCP & Indústria, Mercado moveleiro, Mercado &
   Negócios, Tecnologia & IA, Tendências. Categoria sem notícia relevante não
   aparece. Cada notícia traz o que aconteceu, por que importa, o que observar
   e a ação — ou *"Monitorar."* quando não há ação justificável.
4. **De olho** — de três a cinco assuntos para acompanhar, sem repetir o texto
   das notícias.

### Por que isso é escrito por IA

Impacto, área atingida e consequência são julgamento sobre cada notícia.
Contagem de palavra-chave sabe **ordenar** — é o que a régua da grade faz —
mas não sabe dizer *por que* uma manchete importa sem inventar. Como inventar
é o pior resultado possível num radar de decisão, essa parte é escrita pelo
modelo, em `api/resumir.js`.

A instrução tem uma regra que manda nas outras: **não inventar relação com a
Patrimar**. Sem impacto sustentado pela manchete, a classificação é baixa e o
campo diz *"Sem relação direta com a operação."*

### Como o front e o modelo se entendem

A resposta volta em **JSON validado por esquema** (`output_config.format`),
não em texto — assim não há texto para interpretar e nenhum campo aparece
faltando na tela.

As manchetes vão numeradas (`n0`, `n1`…) e cada análise volta com o id que
entrou. **Link, veículo e hora saem do painel**, do item de verdade: o modelo
não repete metadado, e por isso não erra crédito nem endereço. Id que não casa
com nenhum item é descartado em silêncio.

A chamada é sob demanda, no botão. É bem maior que o resumo que existia antes
— por isso `maxDuration` de 60 segundos na função, e `effort: "medium"`:
esforço baixo devolve classificação preguiçosa, que aqui é o pior defeito.

### Cores de impacto

O vermelho da marca (`#DB2126`) fica só na identidade, no filete do cabeçalho.
Impacto alto usa um vermelho de status próprio, mais fechado. Se fossem o
mesmo, a marca viraria alarme e o alarme viraria enfeite. E nenhum estado
depende só de cor: o selo sempre traz a palavra — Alto, Médio, Baixo.

O botão **Imprimir** sai com o radar em formato de relatório: selo com borda em
vez de fundo (fundo colorido some em impressora de escritório), título de
categoria colado na primeira notícia e sem botão nenhum.

## Configurações

A engrenagem no topo abre as configurações. Tudo ali fica gravado **neste
navegador** e em mais lugar nenhum.

### Chave da API

Serve só para escrever a leitura do dia. São duas origens possíveis, nesta
ordem:

1. A chave digitada aqui, que viaja no corpo do pedido para `api/resumir.js`.
   Mora no `localStorage` do navegador de quem digitou.
2. A variável `ANTHROPIC_API_KEY` da Vercel, que é o padrão da equipe.

Sem nenhuma das duas, o botão da leitura explica o que falta e o resto do
painel funciona igual.

**Por que não uma constante no `index.html`.** O `index.html` é servido para
qualquer visitante: chave colada ali é legível por quem abrir o código-fonte
da página. E como o arquivo vai para o GitHub, a chave seria commitada — o
GitHub detecta e a Anthropic revoga. Até isso acontecer, qualquer um gasta na
conta. Por isso ela mora no navegador.

Vale saber: como a função aceita chave vinda do pedido, quem alcança
`/api/resumir` pode mandar a própria chave e gastar a própria conta. Não
expõe a chave de ninguém, mas o caminho existe.

### Fontes

A lista de todas as fontes, agrupada por seção, com uma caixinha cada. O que
for desmarcado **não é buscado** — a fonte some da fila, do filtro de veículos
e do rodapé, e o que ela já tinha em cache desaparece da tela.

São 38 fontes, e cada uma custa uma ida à ponte numa fila de seis simultâneas.
Desligar as que não interessam é o ajuste mais direto se a atualização estiver
demorando.

O atalho **ligar/desligar todas** de cada seção é alternador: com todas ligadas,
um clique desliga a seção inteira; com alguma desligada, um clique liga tudo.

A chave guardada leva o id da seção junto (`ppcp::Feiras internacionais`), porque
nome de fonte se repete entre seções — *Feiras internacionais* existe em PPCP e
em Tendências, e desligar uma não pode calar a outra.

Salvar com mudança de fonte dispara uma atualização: fonte recém-ligada nunca
foi lida e precisa ser buscada. Mexer só na régua não rebusca nada.

### Janela e régua

- **Buscar notícias dos últimos** — o recorte `when:` pedido ao Google
  Notícias. Vale a partir da próxima atualização.
- **Régua de relevância** — o piso de nota. Frouxa mostra quase tudo,
  apertada só o que tem tema forte. Vale na hora, sem rebuscar.

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

Para **tirar** um aviso, o ✕ no canto do próprio aviso. Pede confirmação e a
senha, conferida no servidor.

Antes o ✕ só existia dentro do modo de fixar: para apagar um recado era preciso
clicar em *Fixar notícia*, que é sobre outra coisa e ainda enchia todos os
cartões de alfinete. Ninguém descobria. Mostrar o botão não afrouxa nada — o
que estava escondido era o caminho, não a proteção.

Publicar e apagar pedem a senha, conferida no servidor — o navegador nunca
decide isso sozinho. A senha digitada fica só na memória da aba, para não
precisar redigitar a cada aviso, e some quando a aba fecha. Ler é aberto:
quem tem o app vê o mural sem senha nenhuma.

Link de aviso só é aceito em `http` ou `https`, para ninguém publicar um
`javascript:` que rodaria no aparelho de quem abrisse.

### Recado vindo de outro app da casa

RitmoProd, Controle de Faltas e o que vier depois publicam no mural sem que a
senha saia daqui.

O caminho óbvio seria cada app chamar `/api/mural` direto. É justamente o que
**não** se faz: obrigaria a abrir a API para outros domínios, e a senha do
mural teria de viajar até cada app — ficaria guardada em quantos lugares
houver app, em vez de um.

Em vez disso o app externo monta o texto e abre o Radar com ele na URL. A
caixa de publicação abre preenchida, uma pessoa lê o que vai ser publicado e
confirma com a senha, no domínio do próprio Radar.

```
https://<radar>/?mural=1&titulo=…&texto=…&autor=…&link=…
```

Tudo opcional menos o `mural=1`; sem título nem texto, nada abre. Os limites
são os mesmos do `api/mural.js` (140 / 1200 / 60 / 600) e o que passar é
cortado na chegada, para a caixa não abrir com texto que o servidor recusaria.
Link que não seja `http(s)` é descartado. Os parâmetros somem da barra assim
que a caixa abre: recarregar não republica nem deixa o texto no histórico.

Para ligar um app novo, são duas linhas:

```js
const q = new URLSearchParams({ mural:'1', titulo, texto, autor:'PCP' });
window.open(RADAR_URL + '/?' + q.toString(), '_blank');
```

O texto chega de fora, mas só preenche um formulário que alguém confere, e
publicar continua exigindo a senha. Por isso não há filtro de conteúdo na
chegada — há revisão humana, que é mais confiável do que lista de palavras.

### O que ligar na Vercel

O painel é estático, então o texto precisa morar em algum lugar. O mural usa
o Redis da Vercel:

1. No projeto, aba **Storage** → **Create Database** → **Upstash** → **Redis**.
   Atenção ao item do menu chamado só "Redis" (*Official Redis for Vercel*):
   é outro produto e entrega conexão TCP, não a API REST que as funções usam.
   Ao conectar ao projeto, a Vercel cadastra sozinha `KV_REST_API_URL` e
   `KV_REST_API_TOKEN` (os nomes `UPSTASH_REDIS_REST_URL` e
   `UPSTASH_REDIS_REST_TOKEN` também servem — a Vercel entrega ora um par,
   ora o outro).
2. Em **Settings → Environment Variables**, criar `SENHA_MURAL` com a senha
   que a equipe vai usar para publicar.
3. Publicar de novo.

Sem isso, o mural aparece com o aviso de que não está configurado e o resto
do painel funciona igual. Para saber o que exatamente falta, abrir
`/api/mural` no navegador: a resposta lista o que está faltando e os nomes
das variáveis que aquele deploy enxerga — nomes apenas, nunca valores.

## Leitura do dia escrita por IA

Dentro do **Resumo do dia** há o botão **Escrever a leitura do dia**. Ele
manda as manchetes já selecionadas para `api/resumir.js`, que chama o Claude
e devolve um parágrafo de abertura, uma linha por seção e um "De olho:" com o
que merece acompanhamento. As três partes são renderizadas com pesos
diferentes na tela: bloco de texto corrido fazia a leitura parecer rasa mesmo
quando não era.

Junto de cada título vai o veículo, **há quantas horas saiu** e **em quantos
veículos o assunto apareceu**. Sem a hora o modelo não sabe o que é de hoje;
sem a cobertura não sabe o que repercutiu. A instrução pede a consequência
para a fábrica, não a repetição da manchete: *"aço subiu"* é a manchete,
*"componente metálico de gaveta e corrediça encarece"* é a leitura. E manda
dizer com todas as letras quando o dia não teve nada que afete a Patrimar,
em vez de forçar relevância.

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
