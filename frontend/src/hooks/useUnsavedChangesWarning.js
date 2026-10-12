import { useEffect } from 'react'

// Warns before leaving a page with unsaved edits: on reload/close via beforeunload, and on
// in-app links by intercepting the click before React Router handles it (BrowserRouter has
// no navigation blocker). The browser back button is not covered.
export function useUnsavedChangesWarning(when, message = 'You have unsaved changes. Leave without saving?') {
  useEffect(() => {
    if (!when) return undefined

    function onBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function onClickCapture(event) {
      const link = event.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || link.origin !== window.location.origin) return
      if (link.pathname === window.location.pathname) return
      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClickCapture, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [when, message])
}
