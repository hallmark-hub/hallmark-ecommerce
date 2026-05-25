import { useEffect, useState } from 'react'
import { getProducts, getProduct } from '../api/products'

export function useProducts(params = {}) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const key = JSON.stringify(params)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await getProducts(params)
        if (res.success) setData(res.data || {}); else setError(res.message)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return { ...data, loading, error }
}

export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await getProduct(slug)
        if (res.success) setProduct(res.data); else setError(res.message)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  return { product, loading, error }
}
