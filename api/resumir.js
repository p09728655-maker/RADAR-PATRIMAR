/* Leitura do dia escrita pelo Claude.

   A chave da API fica numa variável de ambiente da Vercel e nunca sai daqui:
   o navegador só vê o texto pronto. Colocar a chave no index.html seria
   entregá-la a qualquer visitante que abrisse o código-fonte da página.

   Para ligar: no painel da Vercel, Settings → Environment Variables,
   criar ANTHROPIC_API_KEY com a chave e publicar de novo. Sem a variável,
   a função responde 503 e o botão explica o que falta — o resto do painel
   continua funcionando sem IA nenhuma. */

import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-opus-5";
const MAX_MANCHETES = 80;
const MAX_TITULO = 180;
const MAX_RESUMO = 220;

/* O pensamento adaptativo do modelo sai do mesmo teto que o texto. Com o
   teto antigo, de 2000, subir o esforço truncava a leitura no meio da
   frase. Folga suficiente para a leitura curta que se pede abaixo. */
const MAX_TOKENS = 8000;

const INSTRUCAO = `Você escreve a leitura diária de notícias para a equipe de
PCP da Patrimar Móveis: uma indústria de móveis planejados, que fabrica sob
encomenda e vive de acertar plano de produção, capacidade, compra de insumo e
prazo de entrega.

Quem lê é quem decide o que a fábrica vai produzir na semana. Em trinta
segundos, precisa saber o que do dia muda alguma coisa para ele. Notícia que
não muda nada não vale linha.

Cada manchete vem assim:
[Seção] Título (Veículo · Nh · N veículos) — linha fina
"Nh" é há quantas horas saiu. "N veículos" é em quantos veículos diferentes o
mesmo assunto apareceu: número alto é assunto que repercutiu, não é
necessariamente assunto importante para a fábrica. Use os dois como contexto,
não como nota.

Formato da resposta, em português do Brasil:
- Um parágrafo de abertura com o fio principal do dia, no máximo três frases.
- Depois, uma linha por seção que tiver algo que valha, no formato
  "Seção — o que se destaca e o que isso muda para a fábrica". Seção sem nada
  que preste, não escreva a linha. É melhor três linhas boas do que quatro.
- Feche com uma linha começando por "De olho:" apontando o que merece
  acompanhamento nos próximos dias.

Como escrever:
- Diga a consequência, não repita a manchete. "Aço subiu" é a manchete;
  "componente metálico de gaveta e corrediça encarece" é a leitura.
- Português direto de quem trabalha na indústria. Sem jargão de consultoria,
  sem "cenário desafiador", sem "importante ressaltar", sem adjetivo que não
  informa.
- Número só se estiver na manchete, com a fonte. Nunca estime.

Regras:
- Use apenas o que está nas manchetes recebidas. Não complete com o que você
  sabe do mundo e não invente desdobramento.
- Manchete ambígua fica de fora; não especule o que ela quer dizer.
- Quando o dia não tiver nada que afete a Patrimar, diga isso com todas as
  letras em vez de forçar relevância. Um dia fraco descrito com honestidade
  vale mais do que um dia inventado.
- Sem saudação, sem título, sem marcação, sem lista com marcadores.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "use POST" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      erro: "sem chave",
      comoResolver:
        "Na Vercel: Settings → Environment Variables → ANTHROPIC_API_KEY. Depois publique de novo."
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
    .map(i => {
      const secao = limpar(i?.secao, 40);
      const veiculo = limpar(i?.veiculo, 60);
      const titulo = limpar(i?.titulo, MAX_TITULO);
      if (!titulo) return "";

      const horas = Number.isFinite(i?.horas) && i.horas >= 0
        ? `${Math.min(Math.round(i.horas), 999)}h`
        : "sem data";
      const cobertura = Number.isFinite(i?.cobertura) && i.cobertura > 1
        ? ` · ${Math.min(Math.round(i.cobertura), 99)} veículos`
        : "";
      const linhaFina = limpar(i?.resumo, MAX_RESUMO);

      return `[${secao}] ${titulo} (${veiculo} · ${horas}${cobertura})` +
        (linhaFina ? ` — ${linhaFina}` : "");
    })
    .filter(Boolean);

  if (!manchetes.length) {
    return res.status(400).json({ erro: "nenhuma manchete aproveitável" });
  }

  try {
    const cliente = new Anthropic();

    const resposta = await cliente.beta.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      system: INSTRUCAO,
      // A leitura é o produto, não um rascunho: ligar o assunto à fábrica
      // exige mais do que a leitura rasa que o esforço baixo entregava.
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [
        {
          role: "user",
          content: "Manchetes do dia:\n\n" + manchetes.join("\n")
        }
      ]
    });

    if (resposta.stop_reason === "refusal") {
      return res.status(422).json({ erro: "o modelo recusou escrever sobre essas manchetes" });
    }

    const texto = resposta.content
      .filter(bloco => bloco.type === "text")
      .map(bloco => bloco.text)
      .join("\n")
      .trim();

    if (!texto) {
      return res.status(502).json({ erro: "resposta vazia" });
    }

    if (resposta.stop_reason === "max_tokens") {
      return res.status(502).json({
        erro: "a leitura foi cortada antes do fim; tente de novo"
      });
    }

    return res.status(200).json({
      resumo: texto,
      modelo: resposta.model,
      gasto: {
        entrada: resposta.usage?.input_tokens ?? null,
        saida: resposta.usage?.output_tokens ?? null
      }
    });
  } catch (erro) {
    const status = erro?.status;
    if (status === 401) return res.status(503).json({ erro: "a chave da API foi recusada" });
    if (status === 429) return res.status(429).json({ erro: "limite de uso atingido, tente em instantes" });
    return res.status(502).json({ erro: erro?.message || "falha ao gerar a leitura" });
  }
}
