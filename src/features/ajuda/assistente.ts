// Assistente do botão "Dúvidas?": procura a melhor resposta nos guias, nas perguntas frequentes e
// em Leis e boas práticas. Roda inteiro no navegador (sem inteligência artificial paga e sem
// enviar a pergunta para lugar nenhum), por isso responde com o conteúdo que já existe no sistema.
import { duvidas, guias } from '@/features/guia/guias'
import { dicas, secoes } from '@/features/saber/conteudo'
import type { Papel } from '@/types/database'

export type TipoItem = 'pergunta' | 'guia' | 'lei' | 'dica'

export interface ItemAjuda {
  id: string
  tipo: TipoItem
  titulo: string
  resposta: string
  passos?: string[]
  link?: { to: string; label: string }
  papeis?: Papel[]
  // Texto usado na busca (título + conteúdo).
  busca: { titulo: string[]; corpo: string[] }
}

const PALAVRAS_VAZIAS = new Set(
  (
    'a o os as um uma uns umas de do da dos das no na nos nas em por para pra pro com sem e ou que ' +
    'se eu voce vc meu minha meus minhas seu sua isso esse essa este esta como qual quais quando onde ' +
    'porque pq nao sim ja tem ter tenho fazer faco faz ser estou esta sao foi vou quero queria gostaria ' +
    'posso pode consigo preciso tudo algum alguma coisa ai la aqui mais menos muito pouco ele ela eles ' +
    'elas me te lhe nos sobre ao aos ate'
  ).split(' '),
)

// Palavras que querem dizer a mesma coisa no dia a dia da padaria.
const SINONIMOS: Record<string, string> = {
  nota: 'fiscal', nfce: 'fiscal', nfe: 'fiscal', cupom: 'fiscal',
  login: 'senha', entrar: 'senha', acesso: 'senha',
  estorno: 'devol', estornar: 'devol', cancelar: 'devol', cancel: 'devol',
  funcionario: 'equip', funcionarios: 'equip', colaborador: 'equip', empregado: 'equip',
  promo: 'promoc', desconto: 'promoc', oferta: 'promoc',
  bolo: 'encom', festa: 'encom', pedido: 'encom',
  dinheiro: 'caixa', troco: 'caixa', sangria: 'caixa',
  lucro: 'margem', margens: 'margem', cmv: 'margem', custo: 'margem',
  vencido: 'valid', vencimento: 'valid', prazo: 'valid',
  ferias: 'feria', salario: 'salar', demissao: 'demis', demitir: 'demis', rescisao: 'demis',
  impressora: 'compro', recibo: 'compro', comprovante: 'compro', whatsapp: 'compro',
  internet: 'offli', offline: 'offli', caiu: 'offli',
  celular: 'tablet', telefone: 'tablet',
  privacidade: 'lgpd', dados: 'lgpd',
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Radical simples: as 5 primeiras letras bastam para juntar "vendas", "vender" e "vendeu".
function radical(palavra: string) {
  return palavra.length > 5 ? palavra.slice(0, 5) : palavra
}

export function palavras(texto: string) {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 1 && !PALAVRAS_VAZIAS.has(p))
    .map((p) => radical(SINONIMOS[p] ?? p))
}

function montarIndice(): ItemAjuda[] {
  const itens: ItemAjuda[] = []
  for (const [i, d] of duvidas.entries()) {
    itens.push({
      id: `pergunta-${i}`,
      tipo: 'pergunta',
      titulo: d.pergunta,
      resposta: d.resposta,
      papeis: d.papeis,
      busca: { titulo: palavras(d.pergunta), corpo: palavras(d.resposta) },
    })
  }
  for (const g of guias) {
    itens.push({
      id: `guia-${g.id}`,
      tipo: 'guia',
      titulo: g.titulo,
      resposta: g.resumo,
      passos: g.passos,
      link: g.link,
      papeis: g.papeis,
      busca: { titulo: palavras(`${g.titulo} ${g.resumo}`), corpo: palavras([...g.passos, ...g.dicas].join(' ')) },
    })
  }
  for (const s of secoes) {
    for (const t of s.topicos) {
      itens.push({
        id: `lei-${t.id}`,
        tipo: 'lei',
        titulo: `${t.titulo} (${s.titulo.toLowerCase()})`,
        resposta: t.itens[0],
        passos: t.itens.slice(1, 4),
        link: { to: '/saber', label: 'Ver em Leis e boas práticas' },
        busca: { titulo: palavras(t.titulo), corpo: palavras(t.itens.join(' ')) },
      })
    }
  }
  for (const d of dicas) {
    itens.push({
      id: `dica-${d.id}`,
      tipo: 'dica',
      titulo: d.titulo,
      resposta: d.texto,
      link: { to: '/saber', label: 'Ver mais dicas' },
      busca: { titulo: palavras(d.titulo), corpo: palavras(d.texto) },
    })
  }
  return itens
}

let indice: ItemAjuda[] | null = null

export function buscarAjuda(pergunta: string, papel: Papel, limite = 2) {
  indice ??= montarIndice()
  const termos = [...new Set(palavras(pergunta))]
  if (!termos.length) return []
  const pontuados = indice
    .filter((item) => !item.papeis || item.papeis.includes(papel))
    .map((item) => {
      const titulo = new Set(item.busca.titulo)
      const corpo = new Set(item.busca.corpo)
      let pontos = 0
      let achados = 0
      for (const t of termos) {
        if (titulo.has(t)) {
          pontos += 3
          achados++
        } else if (corpo.has(t)) {
          pontos += 1
          achados++
        }
      }
      // Bônus quando todas as palavras da pergunta aparecem; perguntas frequentes vêm primeiro.
      if (achados === termos.length) pontos += 2
      if (item.tipo === 'pergunta') pontos += 0.5
      return { item, pontos, cobertura: achados / termos.length }
    })
    .filter((r) => r.pontos >= 3 && r.cobertura >= 0.5)
    .sort((a, b) => b.pontos - a.pontos)
  // Mostra a melhor e só as que chegam perto dela: respostas fracas atrapalham mais que ajudam.
  const melhor = pontuados[0]?.pontos ?? 0
  return pontuados
    .filter((r) => r.pontos >= melhor * 0.8)
    .slice(0, limite)
    .map((r) => r.item)
}

// Conversa curta: cumprimentos e agradecimentos não precisam de busca.
export function respostaRapida(pergunta: string, primeiroNome: string) {
  const t = normalizar(pergunta).trim()
  if (/^(oi|ola|opa|e ai|bom dia|boa tarde|boa noite|hey|salve)\b/.test(t) && t.split(/\s+/).length <= 3) {
    return `Olá${primeiroNome ? `, ${primeiroNome}` : ''}! Me conte a sua dúvida: por exemplo, "como abro o caixa?" ou "como faço uma promoção?".`
  }
  if (/^(obrigad|valeu|vlw|brigad|show|top|otimo|perfeito)/.test(t)) {
    return 'Por nada! Se precisar de mais alguma coisa, é só perguntar.'
  }
  return null
}

export const sugestoesIniciais: Record<'equipe' | 'gestao', string[]> = {
  equipe: ['Como abro o caixa?', 'Registrei uma venda errada', 'Como mando o comprovante?', 'Esqueci minha senha'],
  gestao: ['Como faço uma promoção?', 'Como sei o lucro de cada produto?', 'Como coloco alguém na equipe?', 'O sistema emite nota fiscal?'],
}
