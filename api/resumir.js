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

const INSTRUCAO = `Você escreve a leitura diária de notícias para a equipe de
PCP da Patrimar Móveis, uma indústria de móveis. Quem lê precisa saber, em
trinta segundos, o que do dia afeta produção, custo, demanda ou o setor
moveleiro.

Formato da resposta, em português do Brasil:
- Um parágrafo de abertura com o fio principal do dia, no máximo três frases.
- Depois, uma linha por seção que tiver algo relevante, no formato
  "Seção — o que se destaca". Seção sem nada que preste, não escreva a linha.
- Feche com uma linha começando por "De olho:" apontando o que merece
  acompanhamento nos próximos dias.

Regras:
- Use apenas o que está nas manchetes recebidas. Não complete com o que você
  sabe do mundo, não estime números e não invente desdobramento.
- Manchete ambígua fica de fora; não especule o que ela quer dizer.
- Sem saudação, sem título, sem marcação, sem lista com marcadores.
- Se as manchetes não sustentarem uma leitura útil, diga isso em uma frase.`;

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
  const manchetes = itens
    .slice(0, MAX_MANCHETES)
    .map(i => {
      const secao = String(i?.secao ?? "").slice(0, 40);
      const veiculo = String(i?.veiculo ?? "").slice(0, 60);
      const titulo = String(i?.titulo ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TITULO);
      return titulo ? `[${secao}] ${titulo} (${veiculo})` : "";
    })
    .filter(Boolean);

  if (!manchetes.length) {
    return res.status(400).json({ erro: "nenhuma manchete aproveitável" });
  }

  try {
    const cliente = new Anthropic();

    const resposta = await cliente.beta.messages.create({
      model: MODELO,
      max_tokens: 2000,                       // a leitura é curta de propósito
      system: INSTRUCAO,
      output_config: { effort: "low" },       // tarefa simples: sai mais barata
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
