import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

// Each image dissolves in over 2.5s (see .hero-slide in index.css), then holds for ~4s
// while it keeps drifting slowly, so the hero never sits still or "flips".
const INTERVAL_MS = 6500

export default function HeroSlider({ slides, hero }) {
  const [index, setIndex] = useState(0)
  // The first image is active on mount, so its drift needs a tick to start transitioning.
  const [moving, setMoving] = useState(false)
  const touchX = useRef(null)
  const count = slides.length

  const go = useCallback(next => setIndex((next + count) % count), [count])

  useEffect(() => {
    const timer = setTimeout(() => setMoving(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (count < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => go(index + 1), INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [index, count, go])

  const onTouchEnd = e => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
    touchX.current = null
  }

  return (
    <section
      className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[680px] flex items-end overflow-hidden bg-black"
      aria-roledescription="carousel"
      aria-label="Featured offerings"
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((s, i) => (
        <div
          key={i}
          className={`hero-slide absolute inset-0 overflow-hidden ${i === index ? 'is-active z-[1]' : 'z-0'} ${i === index && moving ? 'is-moving' : ''}`}
          aria-hidden={i !== index}
        >
          <img
            src={s.image}
            alt=""
            fetchPriority={i === 0 ? 'high' : 'auto'}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`hero-slide-img w-full h-full object-cover ${s.position || 'object-top'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/65 to-black/90" />
        </div>
      ))}

      <div className="relative z-10 w-full min-w-0 max-w-container-max mx-auto px-4 sm:px-gutter pb-16 sm:pb-20 md:pb-24 flex flex-col items-center text-center">
        <span className="hero-rise max-w-full bg-gold/90 backdrop-blur-sm text-[10px] sm:text-label uppercase px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6 inline-block line-clamp-1">
          {hero.eyebrow}
        </span>
        <h1 className="hero-rise [animation-delay:150ms] max-w-3xl text-[2rem] sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.08] text-white mb-3 sm:mb-6 break-words line-clamp-3 sm:line-clamp-none">
          {hero.title}
        </h1>
        <p className="hero-rise [animation-delay:200ms] hidden sm:block text-body-lg text-white/80 mb-8 max-w-xl">
          {hero.body}
        </p>
        <div className="hero-rise [animation-delay:250ms] flex w-full max-w-sm flex-row justify-center gap-2 sm:w-auto sm:max-w-none sm:gap-4">
          <Button as={Link} to={hero.primary.to} variant="gold" size="md" iconRight={<ArrowRight />} className="min-w-0 flex-1 px-3 text-xs shadow-lg sm:flex-none sm:px-5 sm:text-body">
            {hero.primary.label}
          </Button>
          <Button
            as={Link} to={hero.secondary.to}
            variant="ghost"
            size="md"
            className="min-w-0 flex-1 px-3 text-xs !bg-white/10 backdrop-blur-sm border-2 border-white/60 !text-white hover:!bg-white hover:!text-primary hover:border-white focus-visible:!ring-white sm:flex-none sm:px-5 sm:text-body"
          >
            {hero.secondary.label}
          </Button>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white transition hover:bg-white hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white transition hover:bg-white hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </section>
  )
}
