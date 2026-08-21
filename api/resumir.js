/* Radar executivo escrito pelo Claude.

   Não é um resumo de notícias. O painel já lista o que saiu; o que falta a
   quem decide é o passo seguinte: isso afeta a Patrimar, qual área, quanto, e
   o que fazer a respeito. Esse julgamento não sai de contagem de palavra-chave
   — precisa de alguém lendo as manchetes. Daí a chamada ao modelo.

   A resposta vem em JSON validado por esquema, não em texto: o front-end
   desenha o radar a partir dos campos, e cada notícia volta com o id que
   entrou, para o painel casar com o link e o veículo de verdade em vez de
   confiar no que o modelo escreveria de memória.

   A chave da API vem da variável de ambiente da Vercel ou das configurações
   do painel; nunca é gravada nem devolvida. */

import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-opus-5";
const MAX_MANCHETES = 60;
const MAX_TITULO = 180;
const MAX_RESUMO = 220;

/* O radar é muito maior que o parágrafo que existia aqui antes: são três
   alertas, a leitura por área, até vinte notícias analisadas e o De olho.
   O teto acompanha, lembrando que o pensamento adaptativo sai do mesmo lugar. */
const MAX_TOKENS = 16000;

/* A geração leva bem mais que uma resposta curta. Sem isto a função morre no
   limite padrão da Vercel e o painel recebe erro de rede sem explicação. */
export const maxDuration = 60;

const AREAS = ["comercial", "ppcp", "compras", "producao", "financeiro"];
const CATEGORIAS = ["ppcp", "moveleiro", "mercado", "tecnologia", "tendencias"];
const IMPACTOS = ["alto", "medio", "baixo"];

const texto = { type: "string" };

/* Os tetos de quantidade NÃO entram no esquema: a API recusa `maxItems` em
   output_config.format.schema com 400 ("For 'array' type, property 'maxItems'
   is not supported"). O esquema garante a FORMA — que campo existe e que
   valor cada enum aceita; a quantidade é pedida na instrução e cortada aqui
   depois, no LIMITES abaixo. Cortar no código é mais confiável de qualquer
   jeito: vale mesmo que o modelo escreva demais. */
const LIMITES = { alertas: 3, areas: 5, noticias: 20, deOlho: 5, areasPorNoticia: 3 };

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["alertas", "areas", "noticias", "deOlho"],
  properties: {
    alertas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "titulo", "impacto", "horizonte", "resumo", "porQueImporta"],
        properties: {
          id: texto,
          titulo: texto,
          impacto: { type: "string", enum: IMPACTOS },
          horizonte: {
            type: "string",
            enum: ["imediato", "esta_semana", "proximas_semanas", "longo_prazo"]
          },
          resumo: texto,
          porQueImporta: texto
        }
      }
    },
    areas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "texto"],
        properties: { area: { type: "string", enum: AREAS }, texto }
      }
    },
    noticias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "categoria", "impacto", "areas", "oQueAconteceu",
                   "porQueImporta", "oQueObservar", "acao"],
        properties: {
          id: texto,
          categoria: { type: "string", enum: CATEGORIAS },
          impacto: { type: "string", enum: IMPACTOS },
          areas: { type: "array", items: { type: "string", enum: AREAS } },
          oQueAconteceu: texto,
          porQueImporta: texto,
          oQueObservar: texto,
          acao: texto
        }
      }
    },
    deOlho: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["assunto", "acompanhar"],
        properties: { assunto: texto, acompanhar: texto }
      }
    }
  }
};

const INSTRUCAO = `Você monta o radar diário da Patrimar Móveis — indústria de
móveis planejados, fabricação sob encomenda, em Jaci/SP. Quem lê é a
coordenação de PPCP e a gestão: gente que decide plano de produção,
capacidade, compra de insumo e prazo de entrega.

O radar não responde "quais notícias saíram hoje". Responde "o que aconteceu
hoje que pode importar para a Patrimar, e o que devemos observar ou fazer".

Cada manchete chega assim:
[id] [Seção] Título (Veículo · Nh · N veículos) — linha fina
"Nh" é há quantas horas saiu. "N veículos" é em quantos veículos o mesmo
assunto apareceu — sinal de que repercutiu, não de que importa para a fábrica.
Devolva sempre o id exatamente como recebeu: é ele que liga a sua análise ao
link real.

REGRA QUE MANDA EM TODAS AS OUTRAS
Não invente relação com a Patrimar. Se a manchete não sustenta um impacto,
classifique como baixo e diga o que ela é, sem forçar consequência. É melhor
um radar curto e verdadeiro do que um radar cheio e inventado. Número só se
estiver na manchete.

ALERTAS (no máximo 3, e menos se o dia não der)
Só o que de fato pode mexer em carteira, cliente, demanda, capacidade,
produção, compras, crédito, caixa, prazo, fornecedor ou custo. Dia fraco tem
um alerta ou nenhum — não complete para chegar a três.
- resumo: no máximo duas linhas, o que aconteceu.
- porQueImporta: no máximo duas linhas, a consequência concreta para a
  Patrimar. Sem consequência concreta, não é alerta.

ÁREAS
Escreva só das áreas realmente tocadas pelas manchetes de hoje. Área sem nada
fica de fora — lista com cinco itens em que três dizem "sem impacto relevante"
é ruído.
- comercial: mercado e clientes.
- ppcp: demanda, capacidade, sequenciamento, gargalo, prazo.
- compras: matéria-prima, componente, fornecedor.
- producao: capacidade, produtividade, gargalo, turno.
- financeiro: crédito, recebimento, caixa.

NOTÍCIAS
Escolha as que valem a leitura, em ordem de importância. Prefira impacto alto
e médio; notícia de impacto baixo só entra se acrescentar algo. Não repita a
mesma notícia em duas categorias. Não force categoria a existir.
- categoria: ppcp, moveleiro, mercado, tecnologia ou tendencias.
- impacto: alto quando afeta diretamente um dos assuntos da lista acima;
  médio quando é indireto ou merece acompanhamento; baixo quando é
  interessante mas sem efeito operacional.
- areas: as áreas tocadas, no máximo três. Vazio se nenhuma.
- oQueAconteceu: uma ou duas frases, factual.
- porQueImporta: a ligação com a Patrimar. Não havendo ligação sustentada,
  escreva exatamente "Sem relação direta com a operação."
- oQueObservar: o próximo ponto de atenção.
- acao: só quando houver ação justificável pela própria notícia. Caso
  contrário, exatamente "Monitorar."

FOCO DE PPCP
Tendo a manchete relação com demanda, carteira, capacidade, gargalo,
sequenciamento, prazo, matéria-prima, componente, produtividade, automação,
tecnologia industrial, mão de obra, investimento industrial ou tendência do
setor moveleiro, diga a consequência para o planejamento da produção.

DE OLHO (de 3 a 5)
O que acompanhar nos próximos dias. Não repita o texto das notícias: aqui é o
desdobramento, não o resumo.

COMO ESCREVER
Português direto de quem trabalha na indústria. Frase curta. Sem jargão de
consultoria, sem "cenário desafiador", sem "importante ressaltar", sem
adjetivo que não informa. Diga a consequência, não repita a manchete: "aço
subiu" é a manchete; "componente metálico de gaveta e corrediça encarece" é a
análise.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "use POST" });
  }

  const doPedido = typeof req.body?.chave === "string" ? req.body.chave.trim() : "";
  const chave = doPedido || process.env.ANTHROPIC_API_KEY;

  if (!chave) {
    return res.status(503).json({
      erro: "sem chave",
      comoResolver:
        "Abra as configurações do painel (engrenagem no topo) e cole a sua chave da " +
        "Anthropic — ela fica só neste navegador. Para valer para a equipe inteira, " +
        "na Vercel: Settings → Environment Variables → ANTHROPIC_API_KEY."
    });
  }

  if (!/^sk-ant-[\w-]{20,}$/.test(chave)) {
    return res.status(400).json({
      erro: "a chave não tem o formato esperado (começa com sk-ant-)"
    });
  }

  const itens = Array.isArray(req.body?.itens) ? req.body.itens : null;
  if (!itens || !itens.length) {
    return res.status(400).json({ erro: "envie { itens: [...] }" });
  }

  // As manchetes chegam do navegador: entram como texto puro e limitadas em
  // quantidade e tamanho, para não virar entrada aberta nem conta cara.
  const limpar = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

  const manchetes = itens
    .slice(0, MAX_MANCHETES)
    .map((i, n) => {
      const titulo = limpar(i?.titulo, MAX_TITULO);
      if (!titulo) return null;

      const horas = Number.isFinite(i?.horas) && i.horas >= 0
        ? `${Math.min(Math.round(i.horas), 999)}h`
        : "sem data";
      const cobertura = Number.isFinite(i?.cobertura) && i.cobertura > 1
        ? ` · ${Math.min(Math.round(i.cobertura), 99)} veículos`
        : "";
      const linhaFina = limpar(i?.resumo, MAX_RESUMO);

      // O id é nosso, não do modelo: numeração simples que ele só devolve.
      return `[n${n}] [${limpar(i?.secao, 40)}] ${titulo} ` +
        `(${limpar(i?.veiculo, 60)} · ${horas}${cobertura})` +
        (linhaFina ? ` — ${linhaFina}` : "");
    })
    .filter(Boolean);

  if (!manchetes.length) {
    return res.status(400).json({ erro: "nenhuma manchete aproveitável" });
  }

  try {
    const cliente = new Anthropic({ apiKey: chave });

    const resposta = await cliente.beta.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      system: INSTRUCAO,
      output_config: {
        // O radar é julgamento, não transcrição: esforço baixo devolve
        // classificação preguiçosa, que é o pior resultado possível aqui.
        effort: "medium",
        format: { type: "json_schema", schema: ESQUEMA }
      },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: "Manchetes do dia:\n\n" + manchetes.join("\n") }]
    });

    if (resposta.stop_reason === "refusal") {
      return res.status(422).json({ erro: "o modelo recusou analisar essas manchetes" });
    }
    if (resposta.stop_reason === "max_tokens") {
      return res.status(502).json({ erro: "o radar foi cortado antes do fim; tente de novo" });
    }

    const bruto = resposta.content
      .filter(bloco => bloco.type === "text")
      .map(bloco => bloco.text)
      .join("")
      .trim();

    if (!bruto) return res.status(502).json({ erro: "resposta vazia" });

    let radar;
    try {
      radar = JSON.parse(bruto);
    } catch {
      // Com esquema isto não deveria acontecer; se acontecer, é melhor dizer
      // do que entregar meia tela montada com campo faltando.
      return res.status(502).json({ erro: "a resposta não veio no formato esperado" });
    }

    /* Os tetos vivem aqui porque o esquema não os aceita. Sem isto, um dia de
       muita notícia devolveria trinta itens e o radar viraria o clipping que
       ele existe para não ser. */
    const corta = (v, n) => Array.isArray(v) ? v.slice(0, n) : [];
    radar = {
      alertas:  corta(radar.alertas,  LIMITES.alertas),
      areas:    corta(radar.areas,    LIMITES.areas),
      noticias: corta(radar.noticias, LIMITES.noticias)
        .map(n => ({ ...n, areas: corta(n.areas, LIMITES.areasPorNoticia) })),
      deOlho:   corta(radar.deOlho,   LIMITES.deOlho)
    };

    return res.status(200).json({
      radar,
      modelo: resposta.model,
      gasto: {
        entrada: resposta.usage?.input_tokens ?? null,
        saida: resposta.usage?.output_tokens ?? null
      }
    });
  } catch (erro) {
    const status = erro?.status;
    if (status === 401) {
      return res.status(503).json({
        erro: doPedido
          ? "a chave digitada nas configurações foi recusada"
          : "a chave da API foi recusada"
      });
    }
    if (status === 429) return res.status(429).json({ erro: "limite de uso atingido, tente em instantes" });
    return res.status(502).json({ erro: erro?.message || "falha ao montar o radar" });
  }
}
