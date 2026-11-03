import { BadgeCheck, CalendarClock, Fingerprint, ScrollText } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import fonteUrl from '@/assets/fonts/great-vibes.woff?url'
import { LogoPao } from '@/components/LogoPao'
import { Button } from '@/components/ui/button'
import type { AssinaturaContrato } from '@/features/legal/CerimoniaContrato'

// Cerimônia de assinatura: o nome é desenhado letra por letra a partir do contorno real da
// fonte, e a ponta da caneta segue o traço quadro a quadro (requestAnimationFrame).

type Fase = 'carregando' | 'escrevendo' | 'selando' | 'pronto'
type Ponto = { x: number; y: number }

const TINTA = '#1e3a8a'
const TAMANHO = 100 // tamanho da fonte em unidades do SVG
const MARGEM = 14
const FAISCAS = 18

const lerp = (a: Ponto, b: Ponto, t: number): Ponto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const suave = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)
const saidaCubica = (t: number) => 1 - (1 - t) ** 3
const entradaCubica = (t: number) => t ** 3
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function prefereMenosMovimento() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function AssinaturaAnimada({
  assinatura,
  onConcluir,
}: {
  assinatura: AssinaturaContrato
  onConcluir: () => void
}) {
  const nome = assinatura.nome_assinado
  const primeiroNome = nome.split(' ')[0]
  const quando = new Date(assinatura.assinado_em)
  const reduzido = useMemo(prefereMenosMovimento, [])

  const [fase, setFase] = useState<Fase>('carregando')
  const [glifos, setGlifos] = useState<string[] | null>(null)
  const [caixa, setCaixa] = useState({ x: 0, y: -TAMANHO, w: 600, h: TAMANHO * 1.4 })
  const [semFonte, setSemFonte] = useState(false)

  const pathsRef = useRef<(SVGPathElement | null)[]>([])
  const canetaRef = useRef<SVGGElement>(null)
  const faiscasRef = useRef<SVGGElement>(null)

  // 1) Carrega a fonte e transforma o nome em contornos (um path por letra).
  useEffect(() => {
    let vivo = true
    Promise.all([
      import('opentype.js'),
      fetch(fonteUrl).then((r) => {
        if (!r.ok) throw new Error('fonte')
        return r.arrayBuffer()
      }),
    ])
      .then(([opentype, buffer]) => {
        if (!vivo) return
        const fonte = opentype.parse(buffer)
        const lista: string[] = []
        let x1 = Infinity
        let y1 = Infinity
        let x2 = -Infinity
        let y2 = -Infinity
        for (const p of fonte.getPaths(nome, 0, 0, TAMANHO)) {
          const d = p.toPathData(2)
          const bb = p.getBoundingBox()
          if (!d || !Number.isFinite(bb.x1) || bb.x2 - bb.x1 <= 0) continue
          lista.push(d)
          x1 = Math.min(x1, bb.x1)
          y1 = Math.min(y1, bb.y1)
          x2 = Math.max(x2, bb.x2)
          y2 = Math.max(y2, bb.y2)
        }
        if (!lista.length) throw new Error('sem glifos')
        setGlifos(lista)
        setCaixa({ x: x1 - MARGEM, y: y1 - MARGEM, w: x2 - x1 + MARGEM * 2, h: y2 - y1 + MARGEM * 2 })
        setFase(reduzido ? 'pronto' : 'escrevendo')
      })
      .catch(() => {
        if (!vivo) return
        // Sem a fonte em contornos: mostra o nome escrito e segue a cerimônia.
        setSemFonte(true)
        setFase(reduzido ? 'pronto' : 'escrevendo')
      })
    return () => {
      vivo = false
    }
  }, [nome, reduzido])

  // Sem contornos, a escrita é só um fade; passa para o selo em seguida.
  useEffect(() => {
    if (!semFonte || fase !== 'escrevendo') return
    const id = setTimeout(() => setFase('selando'), 1400)
    return () => clearTimeout(id)
  }, [semFonte, fase])

  // 2) Escrita: traço de cada letra + caneta seguindo a ponta.
  useLayoutEffect(() => {
    if (fase !== 'escrevendo' || !glifos) return
    const els = pathsRef.current.slice(0, glifos.length).filter((e): e is SVGPathElement => Boolean(e))
    const caneta = canetaRef.current
    const faiscasG = faiscasRef.current
    if (!els.length || !caneta || !faiscasG) return

    const L = els.map((e) => e.getTotalLength())
    els.forEach((e, i) => {
      e.style.strokeDasharray = `${L[i]} ${L[i]}`
      e.style.strokeDashoffset = `${L[i]}`
      e.style.fillOpacity = '0'
    })
    const inicioDe = els.map((e) => e.getPointAtLength(0))
    const fimDe = els.map((e, i) => e.getPointAtLength(L[i]))
    const total = L.reduce((a, b) => a + b, 0)

    // Linha do tempo (ms): chegada da caneta, traços com pequenos "pulos" entre letras, saída.
    const CHEGADA = 600
    const PULO = 90
    const SAIDA = 700
    const escrita = limitar(1500 + nome.length * 120, 2000, 4200)
    type Trecho = { tipo: 'traco'; i: number; t0: number; t1: number } | { tipo: 'pulo'; a: Ponto; b: Ponto; t0: number; t1: number }
    const trechos: Trecho[] = []
    let t = CHEGADA
    els.forEach((_, i) => {
      if (i > 0) {
        trechos.push({ tipo: 'pulo', a: fimDe[i - 1], b: inicioDe[i], t0: t, t1: t + PULO })
        t += PULO
      }
      const dur = Math.max(80, (escrita * L[i]) / total)
      trechos.push({ tipo: 'traco', i, t0: t, t1: t + dur })
      t += dur
    })
    const fimEscrita = t
    const entrada = { x: inicioDe[0].x + 220, y: inicioDe[0].y - 200 }
    const ultimoPonto = fimDe[fimDe.length - 1]
    const saida = { x: ultimoPonto.x + 240, y: ultimoPonto.y - 220 }

    // Faíscas douradas que saem da ponta da caneta.
    const circulos = Array.from(faiscasG.children) as SVGCircleElement[]
    const particulas = circulos.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, vida: 0 }))
    let proxima = 0
    let ultimaFaisca = 0

    let terminadas = 0
    const finalizar = (ate: number) => {
      while (terminadas < ate) {
        els[terminadas].style.strokeDashoffset = '0'
        els[terminadas].style.fillOpacity = '1'
        terminadas++
      }
    }

    let angulo = -48
    let anterior = entrada
    let indice = 0
    let raf = 0
    let antes = performance.now()
    const comeco = antes

    const quadro = (agora: number) => {
      const dt = Math.min(48, agora - antes)
      antes = agora
      const tempo = agora - comeco
      let pos: Ponto
      let erguida = 0
      let opacidade = 1
      let escrevendo = false

      if (tempo < CHEGADA) {
        const e = saidaCubica(tempo / CHEGADA)
        pos = lerp(entrada, inicioDe[0], e)
        erguida = (1 - e) * 12
        opacidade = Math.min(1, tempo / 200)
      } else if (tempo < fimEscrita) {
        while (indice < trechos.length - 1 && tempo > trechos[indice].t1) indice++
        const tr = trechos[indice]
        const p = limitar((tempo - tr.t0) / (tr.t1 - tr.t0), 0, 1)
        if (tr.tipo === 'traco') {
          finalizar(tr.i)
          const pp = 0.4 * p + 0.6 * suave(p)
          const el = els[tr.i]
          el.style.strokeDashoffset = `${L[tr.i] * (1 - pp)}`
          if (pp > 0.65) el.style.fillOpacity = `${(pp - 0.65) / 0.35}`
          pos = el.getPointAtLength(L[tr.i] * pp)
          escrevendo = true
        } else {
          pos = lerp(tr.a, tr.b, suave(p))
          erguida = Math.sin(Math.PI * p) * 9
        }
      } else {
        finalizar(els.length)
        const e = entradaCubica(limitar((tempo - fimEscrita) / SAIDA, 0, 1))
        pos = lerp(ultimoPonto, saida, e)
        erguida = e * 14
        opacidade = 1 - e
      }

      // Inclinação acompanha a direção do movimento, com suavização.
      const vx = (pos.x - anterior.x) / Math.max(dt, 1)
      const alvo = -48 + limitar(vx * 9, -12, 12)
      angulo += (alvo - angulo) * 0.12
      anterior = pos
      caneta.setAttribute(
        'transform',
        `translate(${pos.x.toFixed(2)} ${(pos.y - erguida).toFixed(2)}) rotate(${angulo.toFixed(2)}) scale(1.2)`,
      )
      caneta.style.opacity = `${opacidade}`

      if (escrevendo && agora - ultimaFaisca > 40) {
        ultimaFaisca = agora
        const pt = particulas[proxima]
        proxima = (proxima + 1) % particulas.length
        pt.x = pos.x
        pt.y = pos.y
        pt.vx = (Math.random() - 0.5) * 0.06
        pt.vy = -0.02 - Math.random() * 0.05
        pt.vida = 1
      }
      particulas.forEach((pt, i) => {
        const c = circulos[i]
        if (pt.vida <= 0) {
          c.setAttribute('opacity', '0')
          return
        }
        pt.vida -= dt / 700
        pt.x += pt.vx * dt
        pt.y += pt.vy * dt
        c.setAttribute('cx', pt.x.toFixed(2))
        c.setAttribute('cy', pt.y.toFixed(2))
        c.setAttribute('r', (0.6 + pt.vida * 1.8).toFixed(2))
        c.setAttribute('opacity', Math.max(0, pt.vida).toFixed(2))
      })

      if (tempo < fimEscrita + SAIDA + 200) raf = requestAnimationFrame(quadro)
      else setFase('selando')
    }
    raf = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(raf)
  }, [fase, glifos, nome])

  // 3) Selo e confete; depois os detalhes e o botão.
  useEffect(() => {
    if (fase !== 'selando') return
    const id = setTimeout(() => setFase('pronto'), 900)
    return () => clearTimeout(id)
  }, [fase])

  const selado = fase === 'selando' || fase === 'pronto'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#120a06]">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="assinatura-aurora absolute -top-1/4 -left-1/4 size-[70vmax] rounded-full bg-amber-500/25 blur-3xl" />
        <div className="assinatura-aurora absolute -right-1/4 -bottom-1/3 size-[65vmax] rounded-full bg-orange-700/25 blur-3xl [animation-delay:-6s]" />
        <div className="assinatura-aurora absolute top-1/3 left-1/3 size-[40vmax] rounded-full bg-yellow-200/10 blur-3xl [animation-delay:-11s]" />
      </div>

      <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
        <div className="assinatura-cartao relative w-full max-w-2xl rounded-[28px] bg-gradient-to-br from-amber-200 via-amber-500/70 to-amber-900/60 p-px shadow-[0_40px_120px_-20px_rgba(0,0,0,.8)]">
          {selado && (
            <div aria-hidden className="pointer-events-none absolute -top-8 -right-2 z-10 sm:-top-9 sm:-right-9">
              {Array.from({ length: 26 }, (_, i) => {
                const ang = (i / 26) * Math.PI * 2
                const dist = 60 + (i % 4) * 22
                return (
                  <span
                    key={i}
                    className="assinatura-confete"
                    style={
                      {
                        '--dx': `${Math.cos(ang) * dist}px`,
                        '--dy': `${Math.sin(ang) * dist}px`,
                        '--giro': `${(i * 47) % 360}deg`,
                        background: ['#f5c451', '#fff3c4', '#d97706', '#10b981'][i % 4],
                      } as CSSProperties
                    }
                  />
                )
              })}
              <div className="assinatura-selo relative flex size-20 flex-col items-center justify-center rounded-full bg-[conic-gradient(from_200deg,#fff3c4,#e7b545,#9a6a12,#e7b545,#fff3c4)] text-[#4a2f06] shadow-[0_10px_30px_-6px_rgba(154,106,18,.7)] ring-4 ring-[#fffaf1] sm:size-24">
                <div className="absolute inset-1.5 rounded-full border border-dashed border-[#7a520e]/50" />
                <BadgeCheck className="size-7 sm:size-8" strokeWidth={2.2} />
                <span className="text-[9px] font-bold tracking-[0.18em] sm:text-[10px]">ASSINADO</span>
              </div>
            </div>
          )}
          <div className="rounded-[27px] bg-[#fffaf1] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,.9),transparent_60%)] px-5 pt-6 pb-7 text-[#2d1e13] sm:px-10 sm:pt-8">
            <header className="flex items-center gap-3">
              <LogoPao className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg leading-tight font-semibold sm:text-xl">Contrato de licença de uso</p>
                <p className="text-xs text-[#2d1e13]/60">Coffee Break · versão {assinatura.versao}</p>
              </div>
              <span
                role="status"
                className={
                  selado
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800'
                }
              >
                {selado ? (
                  <>
                    <BadgeCheck className="size-3.5" /> Assinado
                  </>
                ) : (
                  <>
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-600" /> Assinando…
                  </>
                )}
              </span>
            </header>

            <p className="mt-6 text-sm leading-relaxed text-[#2d1e13]/75">
              Declaro que li o contrato, os Termos de Uso e a Política de Privacidade, e assino de forma livre e
              consciente.
            </p>

            <div className="relative mt-6">
              <div className="relative min-h-24">
                {glifos ? (
                  <svg
                    viewBox={`${caixa.x} ${caixa.y} ${caixa.w} ${caixa.h}`}
                    className="block h-auto max-h-40 w-full overflow-visible"
                    role="img"
                    aria-label={`Assinatura de ${nome}`}
                  >
                    <defs>
                      <linearGradient id="caneta-ouro" gradientUnits="userSpaceOnUse" x1="0" y1="-6" x2="0" y2="6">
                        <stop offset="0" stopColor="#fff4cf" />
                        <stop offset=".5" stopColor="#e7b545" />
                        <stop offset="1" stopColor="#8a5a0c" />
                      </linearGradient>
                      <linearGradient id="caneta-laca" gradientUnits="userSpaceOnUse" x1="0" y1="-6" x2="0" y2="6">
                        <stop offset="0" stopColor="#5b4636" />
                        <stop offset=".22" stopColor="#2a1c13" />
                        <stop offset=".7" stopColor="#120b07" />
                        <stop offset="1" stopColor="#3a2a1e" />
                      </linearGradient>
                      <radialGradient id="caneta-brilho">
                        <stop offset="0" stopColor="#fff2b8" stopOpacity=".95" />
                        <stop offset="1" stopColor="#f5b83d" stopOpacity="0" />
                      </radialGradient>
                      <filter id="caneta-sombra" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="5" dy="9" stdDeviation="4" floodColor="#2d1e13" floodOpacity=".28" />
                      </filter>
                    </defs>

                    {glifos.map((d, i) => (
                      <path
                        key={i}
                        ref={(el) => {
                          pathsRef.current[i] = el
                        }}
                        d={d}
                        fill={TINTA}
                        fillOpacity={fase === 'pronto' || fase === 'selando' ? 1 : 0}
                        stroke={TINTA}
                        strokeWidth={1.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="assinatura-glifo"
                      />
                    ))}

                    <g ref={faiscasRef}>
                      {Array.from({ length: FAISCAS }, (_, i) => (
                        <circle key={i} r="1" fill={i % 3 ? '#f5c451' : '#fff3c4'} opacity="0" />
                      ))}
                    </g>

                    {/* Caneta tinteiro: ponta na origem, corpo ao longo do eixo x. */}
                    {fase === 'escrevendo' && (
                      <g ref={canetaRef} style={{ opacity: 0 }} filter="url(#caneta-sombra)">
                        <circle r="9" fill="url(#caneta-brilho)" />
                        <path d="M0 0 L15 -4.2 Q18 -4.8 19 -4.6 L19 4.6 Q18 4.8 15 4.2 Z" fill="url(#caneta-ouro)" />
                        <path d="M1.5 0 L13 0" stroke="#5a3a08" strokeWidth=".6" />
                        <circle cx="13.6" cy="0" r=".9" fill="#5a3a08" />
                        <rect x="19" y="-5" width="13" height="10" rx="1.6" fill="#17100b" />
                        <rect x="32" y="-5.8" width="3.2" height="11.6" rx=".6" fill="url(#caneta-ouro)" />
                        <rect x="35" y="-6" width="58" height="12" rx="5.5" fill="url(#caneta-laca)" />
                        <rect x="38" y="-4.6" width="50" height="1.6" rx=".8" fill="#fff" opacity=".18" />
                        <rect x="62" y="-8.4" width="28" height="2.4" rx="1.2" fill="url(#caneta-ouro)" />
                        <rect x="88" y="-6" width="8" height="12" rx="5" fill="url(#caneta-ouro)" />
                      </g>
                    )}
                  </svg>
                ) : semFonte ? (
                  <p
                    className="assinatura-fallback py-2 text-center text-5xl text-[#1e3a8a] sm:text-6xl"
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                  >
                    {nome}
                  </p>
                ) : (
                  <div className="flex h-24 items-center justify-center">
                    <span className="size-2 animate-ping rounded-full bg-amber-500" />
                  </div>
                )}
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2d1e13]/45 to-transparent" />
              <p className="mt-2 text-center text-[11px] font-medium tracking-[0.2em] text-[#2d1e13]/55 uppercase">
                Assinatura do contratante
              </p>

            </div>

            {fase === 'pronto' && (
              <div className="assinatura-detalhes mt-8 space-y-5 text-center">
                <div>
                  <p className="font-heading text-2xl font-semibold sm:text-3xl">Bem-vindo ao time, {primeiroNome}!</p>
                  <p className="mt-1 text-sm text-[#2d1e13]/65">Contrato assinado. A sua padaria já pode usar o Coffee Break.</p>
                </div>
                <dl className="grid gap-2 text-left sm:grid-cols-3">
                  <Detalhe icone={CalendarClock} rotulo="Data e hora" valor={quando.toLocaleString('pt-BR')} />
                  <Detalhe icone={ScrollText} rotulo="Versão" valor={assinatura.versao} />
                  <Detalhe
                    icone={Fingerprint}
                    rotulo="Código de integridade"
                    valor={`${assinatura.hash_contrato.slice(0, 12)}…`}
                    mono
                  />
                </dl>
                <Button
                  type="button"
                  size="lg"
                  onClick={onConcluir}
                  autoFocus
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 text-white shadow-lg shadow-amber-900/20 hover:from-amber-700 hover:to-orange-700 sm:w-auto"
                >
                  Começar a usar o Coffee Break
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detalhe({
  icone: Icone,
  rotulo,
  valor,
  mono,
}: {
  icone: typeof CalendarClock
  rotulo: string
  valor: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#2d1e13]/10 bg-white/70 px-3 py-2">
      <Icone className="size-4 shrink-0 text-amber-700" />
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold tracking-wide text-[#2d1e13]/50 uppercase">{rotulo}</dt>
        <dd className={mono ? 'truncate font-mono text-xs' : 'truncate text-xs font-medium'}>{valor}</dd>
      </div>
    </div>
  )
}
