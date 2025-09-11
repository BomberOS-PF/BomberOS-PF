// src/Component/common/Pagination.jsx
import { useEffect, useMemo, useState, useRef } from 'react'

/**
 * Componente de paginado reutilizable
 *
 * Props:
 * - fetchPage: async ({ page, limit, filters }) => { data: [], total: number }
 * - initialPage: number = 1
 * - initialPageSize: number = 10
 * - filters: objeto con filtros (si cambia, reinicia a página 1)
 * - children: render-prop: ({ items, total, page, totalPages, limit, setPage, setLimit, loading, error, reload })
 * - showControls: boolean = true
 * - labels?: { prev?, next?, of?, showing?: (shown, total) => string }
 */
const Pagination = ({
  fetchPage,
  initialPage = 1,
  initialPageSize = 10,
  filters = {},
  children,
  showControls = true,
  labels
}) => {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialPageSize)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastFiltersRef = useRef(JSON.stringify(filters))

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / (limit || 1))),
    [total, limit]
  )

  const load = async (opts = { reset: false }) => {
    try {
      setLoading(true)
      setError('')

      const currentPage = opts.reset ? 1 : page
      const res = await fetchPage({ page: currentPage, limit, filters })

      if (Array.isArray(res)) {
        setItems(res)
        setTotal(res.length || 0)
      } else if (res && typeof res === 'object') {
        setItems(res.data || [])
        setTotal(Number(res.total) || (res.data ? res.data.length : 0))
      } else {
        setItems([])
        setTotal(0)
        setError('Respuesta inesperada del servidor')
      }

      if (opts.reset) setPage(1)
    } catch (e) {
      setItems([])
      setTotal(0)
      setError(e?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  useEffect(() => {
    const now = JSON.stringify(filters)
    if (now !== lastFiltersRef.current) {
      lastFiltersRef.current = now
      load({ reset: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))
  const reload = () => load()

  const l = {
    prev: labels?.prev ?? '‹ Anterior',
    next: labels?.next ?? 'Siguiente ›',
    of: labels?.of ?? '/',
    showing: labels?.showing ?? ((shown, tot) => `Mostrando ${shown} de ${tot}`)
  }

  return (
    <>
      {typeof children === 'function' && children({
        items,
        total,
        page,
        totalPages,
        limit,
        setPage,
        setLimit,
        loading,
        error,
        reload
      })}

      {showControls && total > 0 && (
        <div className='d-flex justify-content-between align-items-center mt-3 pt-3 border-top'>
          <small className='text-muted'>
            {l.showing(items.length, total)}
          </small>
          <div className='btn-group'>
            <button
              className='btn custom-page-btn'
              onClick={goPrev}
              disabled={page <= 1 || loading}
            >
              {l.prev}
            </button>
            <span className='btn btn-detail disabled'>
              {page} {l.of} {totalPages}
            </span>
            <button
              className='btn custom-page-btn'
              onClick={goNext}
              disabled={page >= totalPages || loading}
            >
              {l.next}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Pagination
