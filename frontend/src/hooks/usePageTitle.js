import { useEffect } from 'react'
import useSiteContentStore from '../store/siteContentStore'

// Sets the browser tab title for a page; with no title, falls back to the site-wide SEO title.
export function usePageTitle(title) {
  const content = useSiteContentStore(state => state.content)

  useEffect(() => {
    if (!content) return
    document.title = title ? `${title} | ${content.company_name}` : content.seo_title
  }, [title, content])
}
