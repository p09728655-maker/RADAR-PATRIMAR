/* Mural interno da aba Patrimar.

   Guarda os recados escritos pela equipe e as notícias fixadas do painel,
   para que todo mundo que abre o app veja a mesma coisa. O painel é
   estático, então o texto precisa morar em algum lugar: aqui é o Redis da
   Vercel (Vercel KV / Upstash), lido pela API REST com fetch — sem
   dependência nova.

   Ligar exige três variáveis de ambiente na Vercel:
     KV_REST_API_URL    e  KV_REST_API_TOKEN    (criadas junto com o banco)
     SENHA_MURAL                                (a senha de quem publica)

   Os nomes UPSTASH_REDIS_REST_URL / _TOKEN também servem, porque a Vercel
   entrega ora um par, ora o outro, conforme o caminho da criação do banco.

   Ler é aberto: quem tem o app vê o mural. Escrever e apagar pedem a senha,
   conferida aqui no servidor — o navegador nunca decide isso sozinho. */

const CHAVE = "mural";
const MAXIMO = 50;                 // recados antigos caem fora da lista
const LIMITES = { titulo: 140, texto: 1200, link: 600, autor: 60 };

const base = () =>
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";

const token = () =>
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const configurado = () => Boolean(base() && token() && process.env.SENHA_MURAL);

async function lerMural() {
  const r = await fetch(`${base()}/get/${CHAVE}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store"
  });
  if (!r.ok) throw new Error("banco respondeu " + r.status);
  const dados = await r.json();
  if (!dados?.result) return [];
  try {
    const lista = JSON.parse(dados.result);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

async function gravarMural(lista) {
  const r = await fetch(`${base()}/set/${CHAVE}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}` },
    body: JSON.stringify(lista)
  });
  if (!r.ok) throw new Error("banco recusou a gravação: " + r.status);
}

// Comparação de tamanho fixo, para a resposta não denunciar o quanto acertou
function senhaConfere(enviada) {
  const certa = String(process.env.SENHA_MURAL ?? "");
  const dada = String(enviada ?? "");
  if (dada.length !== certa.length) return false;
  let diferenca = 0;
  for (let i = 0; i < certa.length; i++) diferenca |= certa.charCodeAt(i) ^ dada.charCodeAt(i);
  return diferenca === 0;
}

const limpar = (valor, limite) =>
  String(valor ?? "").replace(/\s+/g, " ").trim().slice(0, limite);

// Só http(s): link de recado é aberto por quem lê, não vale javascript:
function linkAceito(bruto) {
  const valor = limpar(bruto, LIMITES.link);
  if (!valor) return "";
  try {
    const u = new URL(valor);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!configurado()) {
    return res.status(503).json({
      erro: "mural não configurado",
      comoResolver:
        "Na Vercel: crie um banco Redis em Storage e depois cadastre SENHA_MURAL em Settings → Environment Variables."
    });
  }

  try {
    if (req.method === "GET") {
      const lista = await lerMural();
      res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
      return res.status(200).json({ avisos: lista });
    }

    if (req.method === "POST") {
      if (!senhaConfere(req.headers["x-senha"])) {
        return res.status(401).json({ erro: "senha incorreta" });
      }

      const corpo = req.body || {};
      const titulo = limpar(corpo.titulo, LIMITES.titulo);
      const texto = String(corpo.texto ?? "").replace(/[ \t]+/g, " ").trim().slice(0, LIMITES.texto);

      if (!titulo && !texto) {
        return res.status(400).json({ erro: "escreva ao menos um título ou um texto" });
      }

      const aviso = {
        id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        tipo: corpo.tipo === "noticia" ? "noticia" : "recado",
        titulo,
        texto,
        link: linkAceito(corpo.link),
        autor: limpar(corpo.autor, LIMITES.autor),
        quando: Date.now()
      };

      const lista = await lerMural();
      lista.unshift(aviso);
      await gravarMural(lista.slice(0, MAXIMO));
      return res.status(201).json({ aviso });
    }

    if (req.method === "DELETE") {
      if (!senhaConfere(req.headers["x-senha"])) {
        return res.status(401).json({ erro: "senha incorreta" });
      }
      const id = String(req.query?.id ?? "");
      if (!id) return res.status(400).json({ erro: "informe ?id=" });

      const lista = await lerMural();
      const restante = lista.filter(a => a.id !== id);
      if (restante.length === lista.length) {
        return res.status(404).json({ erro: "esse aviso não está mais no mural" });
      }
      await gravarMural(restante);
      return res.status(200).json({ removido: id });
    }

    return res.status(405).json({ erro: "método não aceito" });
  } catch (erro) {
    return res.status(502).json({ erro: erro?.message || "falha ao falar com o banco" });
  }
}
