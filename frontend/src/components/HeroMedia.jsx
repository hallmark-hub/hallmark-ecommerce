import { useEffect, useRef, useState } from 'react'
import { isVideoUrl } from '../utils/images'

export default function HeroMedia({ src, alt = '', className, poster }) {
  const videoRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isVideoUrl(src) || !videoRef.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    observer.observe(videoRef.current)
    return () => observer.disconnect()
  }, [src])

  if (isVideoUrl(src)) {
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
        preload="none"
        aria-label={alt}
      />
    )
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />
}
