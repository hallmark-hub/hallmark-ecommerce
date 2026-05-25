import { useEffect, useState } from 'react'
import { getCategories } from '../api/categories'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(res => {
      if (res.success) setCategories(res.data || [])
      setLoading(false)
    })
  }, [])

  return { categories, loading }
}
