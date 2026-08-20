import { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * Audio descriptions via the browser's speech synthesis — no audio
 * files to ship, and it reads whatever text we hand it, so narration
 * stays in sync with the compendium automatically.
 * ------------------------------------------------------------------ */

const CHUNK_LIMIT = 220

/** Chrome truncates long utterances, so text is split on sentence ends. */
function chunkText(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?—])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > CHUNK_LIMIT && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = `${current} ${sentence}`
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // Prefer an Indian English voice — the vocabulary here is largely Sanskrit.
  return (
    voices.find((v) => v.lang === 'en-IN') ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0]
  )
}

export interface Narrator {
  supported: boolean
  speaking: boolean
  /** Reads the text aloud, cancelling anything already in progress. */
  speak: (text: string) => void
  stop: () => void
  /** Speaks if idle, stops if this same text is already playing. */
  toggle: (text: string) => void
}

export function useNarrator(): Narrator {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const currentText = useRef<string | null>(null)
  const voices = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!supported) return
    const load = () => {
      voices.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    currentText.current = null
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return
      window.speechSynthesis.cancel()
      currentText.current = text
      const voice = pickVoice(voices.current)
      const chunks = chunkText(text)

      chunks.forEach((chunk, i) => {
        const utterance = new SpeechSynthesisUtterance(chunk)
        if (voice) utterance.voice = voice
        utterance.rate = 0.96
        utterance.pitch = 1
        utterance.lang = voice?.lang ?? 'en-IN'
        if (i === chunks.length - 1) {
          utterance.onend = () => {
            currentText.current = null
            setSpeaking(false)
          }
          utterance.onerror = utterance.onend
        }
        window.speechSynthesis.speak(utterance)
      })
      setSpeaking(true)
    },
    [supported],
  )

  const toggle = useCallback(
    (text: string) => {
      if (speaking && currentText.current === text) stop()
      else speak(text)
    },
    [speaking, speak, stop],
  )

  return { supported, speaking, speak, stop, toggle }
}
