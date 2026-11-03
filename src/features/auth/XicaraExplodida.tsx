import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Vista explodida da xícara: cada camada é uma parte do Coffee Break. Ela se monta quando a
// tela abre e se desmonta (mostrando o nome de cada parte) ao passar o mouse ou tocar no botão.
// Tela de entrada = superfície rara, de apresentação: aqui cabe animação mais longa e expressiva.

interface Camada {
  id: string
  rotulo: string
  detalhe: string
  // Deslocamento vertical quando aberta (unidades do SVG) e altura onde fica o rótulo.
  abre: number
  y: number
}

const CAMADAS: Camada[] = [
  { id: 'vapor', rotulo: 'Análise', detalhe: 'o que mais vende e quando', abre: -150, y: 70 },
  { id: 'arte', rotulo: 'Produção', detalhe: 'quanto fazer de cada pão', abre: -100, y: 150 },
  { id: 'cafe', rotulo: 'Vendas e PDV', detalhe: 'o balcão em segundos', abre: -62, y: 200 },
  { id: 'xicara', rotulo: 'Caixa', detalhe: 'abre, sangra e fecha certinho', abre: -10, y: 262 },
  { id: 'croissant', rotulo: 'Estoque', detalhe: 'avisa antes de faltar', abre: 30, y: 318 },
  { id: 'pires', rotulo: 'Financeiro', detalhe: 'contas, margens e metas', abre: 70, y: 360 },
]

export function XicaraExplodida({ compacta = false }: { compacta?: boolean }) {
  const [montada, setMontada] = useState(false)
  const [aberta, setAberta] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)
  // IDs únicos por xícara: com duas na página (celular e computador), cada uma usa os próprios gradientes.
  const u = useId().replace(/:/g, '')

  // Entra desmontada e se monta: o primeiro momento da tela.
  useEffect(() => {
    const id = requestAnimationFrame(() => setTimeout(() => setMontada(true), 120))
    return () => cancelAnimationFrame(id)
  }, [])

  // Inclinação 3D leve seguindo o mouse (só com mouse de verdade, não no toque).
  const inclinar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !caixa.current) return
    const r = caixa.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    caixa.current.style.setProperty('--incl-x', `${(-y * 10).toFixed(2)}deg`)
    caixa.current.style.setProperty('--incl-y', `${(x * 14).toFixed(2)}deg`)
  }
  const endireitar = () => {
    caixa.current?.style.setProperty('--incl-x', '0deg')
    caixa.current?.style.setProperty('--incl-y', '0deg')
  }

  const explodida = !montada || aberta

  return (
    <div className="xic-cena relative">
      <div
        ref={caixa}
        className={cn('xic-palco relative mx-auto', compacta ? 'w-56' : 'w-full max-w-[460px]')}
        data-aberta={aberta || undefined}
        data-montada={montada || undefined}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setAberta(true)}
        onPointerMove={inclinar}
        onPointerLeave={(e) => {
          endireitar()
          if (e.pointerType === 'mouse') setAberta(false)
        }}
      >
        <svg viewBox="0 0 520 440" className="block h-auto w-full overflow-visible" role="img" aria-label="Xícara do Coffee Break: cada camada é uma parte do sistema">
          <defs>
            <linearGradient id={`xic-pires-${u}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f7e7cf" />
              <stop offset="1" stopColor="#c9a172" />
            </linearGradient>
            <linearGradient id={`xic-louca-${u}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#fff8ee" />
              <stop offset=".55" stopColor="#f3e2c8" />
              <stop offset="1" stopColor="#d9b98d" />
            </linearGradient>
            <radialGradient id={`xic-cafe-${u}`} cx=".45" cy=".4" r=".7">
              <stop offset="0" stopColor="#8a5428" />
              <stop offset="1" stopColor="#3d2010" />
            </radialGradient>
            <linearGradient id={`xic-croissant-${u}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f6c063" />
              <stop offset="1" stopColor="#b86a1e" />
            </linearGradient>
            <filter id={`xic-sombra-${u}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#140904" floodOpacity=".45" />
            </filter>
          </defs>

          {/* sombra no "chão" */}
          <ellipse cx="200" cy="420" rx="150" ry="14" fill="#000" opacity=".25" className="xic-chao" />

          <g filter={`url(#xic-sombra-${u})`}>
            <Peca id="pires" abre={70} indice={5} explodida={explodida}>
              <ellipse cx="200" cy="356" rx="160" ry="38" fill={`url(#xic-pires-${u})`} />
              <ellipse cx="200" cy="350" rx="112" ry="22" fill="#e9d2b0" />
              <ellipse cx="200" cy="350" rx="112" ry="22" fill="none" stroke="#b88a57" strokeOpacity=".5" />
            </Peca>

            <Peca id="croissant" abre={30} indice={4} explodida={explodida} lado={-40}>
              <path
                d="M58 338 C70 300 120 288 150 306 C130 300 104 312 96 334 C92 344 76 350 58 338 Z"
                fill={`url(#xic-croissant-${u})`}
              />
              <path d="M84 318 L96 336 M104 306 L112 328 M124 301 L128 322" stroke="#8a4a12" strokeWidth="3" strokeLinecap="round" opacity=".55" />
            </Peca>

            <Peca id="xicara" abre={-10} indice={3} explodida={explodida}>
              <path d="M290 238 C340 236 346 300 290 304" fill="none" stroke="#e6cfae" strokeWidth="16" strokeLinecap="round" />
              <path d="M110 214 C110 300 140 340 200 340 C260 340 290 300 290 214 Z" fill={`url(#xic-louca-${u})`} />
              <path d="M126 240 C132 290 150 318 180 328" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="6" strokeLinecap="round" />
              <ellipse cx="200" cy="214" rx="90" ry="20" fill="#f9eddb" />
            </Peca>

            <Peca id="cafe" abre={-62} indice={2} explodida={explodida}>
              <ellipse cx="200" cy="216" rx="80" ry="16" fill={`url(#xic-cafe-${u})`} />
            </Peca>

            <Peca id="arte" abre={-100} indice={1} explodida={explodida}>
              <path
                d="M200 226 C186 214 174 210 172 202 C170 194 180 188 188 194 C194 198 198 204 200 208 C202 204 206 198 212 194 C220 188 230 194 228 202 C226 210 214 214 200 226 Z"
                fill="#f6e3c4"
              />
            </Peca>

            <Peca id="vapor" abre={-150} indice={0} explodida={explodida}>
              <g className="xic-vapor" fill="none" stroke="#fff6e8" strokeWidth="6" strokeLinecap="round" opacity=".75">
                <path d="M172 180 C160 160 184 146 172 124" />
                <path d="M200 176 C188 150 214 136 200 108" />
                <path d="M228 180 C216 160 240 146 228 124" />
              </g>
            </Peca>
          </g>

          {/* Rótulos: aparecem quando a xícara se abre */}
          {!compacta &&
            CAMADAS.map((c, i) => (
              <g key={c.id} className="xic-rotulo" style={{ transitionDelay: aberta ? `${120 + i * 45}ms` : '0ms' }}>
                <line x1="300" x2="344" y1={c.y + c.abre * 0.15} y2={c.y + c.abre * 0.15} stroke="#fbbf24" strokeOpacity=".6" strokeDasharray="3 4" />
                <circle cx="300" cy={c.y + c.abre * 0.15} r="3.5" fill="#fbbf24" />
                <text x="352" y={c.y + c.abre * 0.15 - 2} fill="#fff6e8" fontSize="17" fontWeight="700">
                  {c.rotulo}
                </text>
                <text x="352" y={c.y + c.abre * 0.15 + 16} fill="#fff6e8" fillOpacity=".6" fontSize="12.5">
                  {c.detalhe}
                </text>
              </g>
            ))}
        </svg>
      </div>

      {!compacta && (
        <button
          type="button"
          aria-pressed={aberta}
          onClick={() => setAberta((v) => !v)}
          className="xic-botao mx-auto mt-8 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-[#fff6e8] backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
          </span>
          {aberta ? 'Montar a xícara' : 'Ver o Coffee Break por dentro'}
        </button>
      )}
    </div>
  )
}

function Peca({
  id,
  abre,
  indice,
  explodida,
  lado = 0,
  children,
}: {
  id: string
  abre: number
  indice: number
  explodida: boolean
  lado?: number
  children: ReactNode
}) {
  return (
    <g
      data-peca={id}
      className="xic-peca"
      style={{
        transform: explodida ? `translate(${lado}px, ${abre}px)` : 'translate(0px, 0px)',
        transitionDelay: `${indice * 55}ms`,
      }}
    >
      {children}
    </g>
  )
}
