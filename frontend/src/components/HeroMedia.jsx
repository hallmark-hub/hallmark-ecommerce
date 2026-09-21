import { isVideoUrl } from '../utils/images'

export default function HeroMedia({ src, alt = '', className, poster }) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        poster={poster}
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