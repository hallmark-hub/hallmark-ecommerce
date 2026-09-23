import { useEffect, useRef, useState } from 'react'
import { isVideoUrl } from '../utils/images'

export default function HeroMedia({ src, alt = '', className, poster }) {
  const videoRef = useRef(null)
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const update = () => setDesktop(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!isVideoUrl(src) || !desktop || !videoRef.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    observer.observe(videoRef.current)
    return () => observer.disconnect()
  }, [src, desktop])

  if (isVideoUrl(src)) {
    if (!desktop) {
      return <img src={poster || '/media/chefware/service-robot.jpg'} alt={alt} className={className} />
    }
    return (
      <video
        ref={videoRef}
        src={visible ? src : undefined}
        poster={poster || '/media/chefware/service-robot.jpg'}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    )
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />
}
