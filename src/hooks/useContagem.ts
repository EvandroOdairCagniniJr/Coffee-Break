import { useEffect, useRef, useState } from 'react'

const prefereMenosMovimento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Número que conta até o valor (ex.: 0 → 128) quando aparece ou muda. Para números de destaque
// vistos de vez em quando, não para dados que a pessoa está digitando.
export function useContagem(alvo: number, duracao = 700) {
  const [reduzido] = useState(prefereMenosMovimento)
  const [valor, setValor] = useState(reduzido ? alvo : 0)
  const anterior = useRef(0)
  useEffect(() => {
    if (reduzido || !Number.isFinite(alvo)) return
    const de = anterior.current
    const inicio = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao)
      // ease-out forte: chega rápido e assenta devagar.
      const e = 1 - Math.pow(1 - t, 4)
      setValor(de + (alvo - de) * e)
      if (t < 1) quadro = requestAnimationFrame(passo)
      else anterior.current = alvo
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, duracao, reduzido])
  return reduzido || !Number.isFinite(alvo) ? alvo : valor
}
