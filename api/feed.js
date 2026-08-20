/* Ponte própria do Radar Diário.
   Roda como função da Vercel, no mesmo domínio do painel: sem CORS, sem
   limite de proxy de terceiro e com cache na borda, para que as mesmas
   notícias não sejam buscadas de novo a cada aparelho que abre o app.

   Aceita apenas os domínios das fontes configuradas no index.html — uma
   ponte aberta viraria proxy de qualquer endereço da internet. */

const DOMINIOS = [
  "news.google.com",
  "rss.nytimes.com",
  "nytimes.com",
  "technologyreview.com",
  "arstechnica.com",
  "theverge.com",
  "techcrunch.com"
];

const permitido = host =>
  DOMINIOS.some(d => host === d || host.endsWith("." + d));

/* Nem todo feed é UTF-8. O da Folha, por exemplo, vem em ISO-8859-1 e, lido
   como UTF-8, transforma "vigário" em "vig?rio". A codificação certa é
   procurada em ordem: cabeçalho HTTP, declaração do próprio XML e, por fim,
   os dois palpites comuns. Vence a primeira leitura sem caractere perdido. */
function decodificar(bytes, tipoHttp) {
  const espiada = new TextDecoder("windows-1252").decode(bytes.slice(0, 400));

  const candidatas = [
    (tipoHttp.match(/charset=["']?([\w-]+)/i) || [])[1],
    (espiada.match(/encoding=["']([\w-]+)["']/i) || [])[1],
    "utf-8",
    "windows-1252"
  ].filter(Boolean).map(c => c.toLowerCase());

  let primeira = null;
  for (const nome of new Set(candidatas)) {
    let texto;
    try {
      texto = new TextDecoder(nome).decode(bytes);
    } catch {
      continue;                       // rótulo de codificação desconhecido
    }
    if (primeira === null) primeira = texto;
    if (!texto.includes("\uFFFD")) return texto;
  }
  return primeira ?? new TextDecoder("utf-8").decode(bytes);
}

// A declaração passa a dizer UTF-8, que é como o conteúdo sai daqui
const marcarUtf8 = texto =>
  texto.replace(/^\s*<\?xml[^>]*\?>/, decl =>
    decl.replace(/encoding=["'][\w-]+["']/i, 'encoding="UTF-8"'));

const NAVEGADOR =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export default async function handler(req, res) {
  const bruto = req.query?.url;
  const alvo = Array.isArray(bruto) ? bruto[0] : bruto;

  if (!alvo) {
    return res.status(400).json({ erro: "informe ?url=" });
  }

  let url;
  try {
    url = new URL(alvo);
  } catch {
    return res.status(400).json({ erro: "url inválida" });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return res.status(400).json({ erro: "protocolo não aceito" });
  }
  if (!permitido(url.hostname)) {
    return res.status(403).json({ erro: "domínio fora da lista de fontes" });
  }

  try {
    const resposta = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": NAVEGADOR,
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });

    if (!resposta.ok) {
      return res.status(502).json({ erro: "fonte respondeu " + resposta.status });
    }

    const tipo = resposta.headers.get("content-type") || "";
    const bytes = new Uint8Array(await resposta.arrayBuffer());
    const corpo = marcarUtf8(decodificar(bytes, tipo));

    // Cinco minutos na borda: o intervalo do painel é de dez, então ninguém
    // vê manchete velha, e as fontes recebem uma visita em vez de dezenas.
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    res.setHeader("Content-Type", /json/i.test(tipo) ? "application/json; charset=utf-8" : "application/xml; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(corpo);
  } catch (erro) {
    const tempo = erro?.name === "TimeoutError" || erro?.name === "AbortError";
    return res.status(tempo ? 504 : 502).json({ erro: tempo ? "tempo esgotado" : "falha ao buscar a fonte" });
  }
}
