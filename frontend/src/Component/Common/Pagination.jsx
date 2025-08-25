import React, { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Paginación inteligente:
 * - Mantiene page/limit/total/items y estados de loading/error.
 * - Llama a fetchPage({ page, limit }) y espera { items, total }.
 * - Resetea a página 1 cuando cambie algo en deps.
 * - Renderiza tus items vía render prop: children(items, { loading, error })
 * - Estilos de botones: usa .custom-page-btn (tu CSS)
 */
const Pagination = ({
  fetchPage,                 // async ({ page, limit }) => { items, total }
  deps = [],                 // dependencias para re-fetch (ej: [filtros])
  defaultPage = 1,
  defaultLimit = 10,
  limitOptions = [5, 10, 20],
  showSummary = true,
  className = '',
  children,                  // (items, { loading, error }) => JSX
}) => {
  const [page, setPage] = useState(defaultPage)
  const [limit, setLimit] = useState(defaultLimit)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(1, limit))),
    [total, limit]
  )

  const btnClass = (extra = '') => `custom-page-btn ${extra}`.trim()

  const load = useCallback(async (p = page, l = limit) => {
    try {
      setLoading(true)
      setError('')
      const res = await fetchPage({ page: p, limit: l })
      const nextItems = Array.isArray(res?.items) ? res.items : []
      const nextTotal = Number.isFinite(res?.total) ? res.total : nextItems.length
      setItems(nextItems)
      setTotal(nextTotal)
    } catch (e) {
      setItems([])
      setTotal(0)
      setError(e?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [fetchPage, page, limit])

  // Cargar cuando cambian deps: reset a página 1
  useEffect(() => {
    setPage(1)
    load(1, limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps) // intención: re-fetch al cambiar filtros, etc.

  // Cargar inicial
  useEffect(() => {
    load(defaultPage, defaultLimit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const go = async (p) => {
    if (loading) return
    if (p < 1 || p > totalPages) return
    setPage(p)
    await load(p, limit)
  }

  const changeLimit = async (l) => {
    const nl = Number(l)
    setLimit(nl)
    setPage(1)
    await load(1, nl)
  }

  // Ventana de páginas centrada
  const maxPages = 5
  const half = Math.floor(maxPages / 2)
  let start = Math.max(1, page - half)
  let end = Math.min(totalPages, start + maxPages - 1)
  if (end - start + 1 < maxPages) start = Math.max(1, end - maxPages + 1)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(total, page * limit)

  return (
    <div className={className}>
      {/* Contenido render-prop */}
      {typeof children === 'function' && children(items, { loading, error })}

      {/* Barra inferior: total / tamaño de página / controles */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <div className="text-white-50">
          {showSummary && (loading ? 'Cargando…' : `Mostrando ${startItem}-${endItem} de ${total}`)}
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm w-auto"
            value={limit}
            onChange={(e) => changeLimit(e.target.value)}
            disabled={loading}
          >
            {limitOptions.map((opt) => <option key={opt} value={opt}>{opt} / pág.</option>)}
          </select>

          <div className="d-flex align-items-center flex-wrap gap-1" role="navigation" aria-label="Paginación">
            <button
              type="button"
              className={btnClass(page === 1 || loading ? 'disabled' : '')}
              aria-label="Primera página"
              onClick={() => go(1)}
            >
              «
            </button>

            <button
              type="button"
              className={btnClass(page === 1 || loading ? 'disabled' : '')}
              aria-label="Página anterior"
              onClick={() => go(page - 1)}
            >
              ‹
            </button>

            {start > 1 && (
              <>
                <button type="button" className={btnClass()} onClick={() => go(1)}>1</button>
                {start > 2 && <span className={btnClass('disabled')} aria-hidden="true">…</span>}
              </>
            )}

            {pages.map((p) => (
              <button
                key={p}
                type="button"
                className={btnClass(p === page ? 'active' : '')}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => go(p)}
              >
                {p}
              </button>
            ))}

            {end < totalPages && (
              <>
                {end < totalPages - 1 && <span className={btnClass('disabled')} aria-hidden="true">…</span>}
                <button type="button" className={btnClass()} onClick={() => go(totalPages)}>{totalPages}</button>
              </>
            )}

            <button
              type="button"
              className={btnClass(page === totalPages || loading ? 'disabled' : '')}
              aria-label="Página siguiente"
              onClick={() => go(page + 1)}
            >
              ›
            </button>

            <button
              type="button"
              className={btnClass(page === totalPages || loading ? 'disabled' : '')}
              aria-label="Última página"
              onClick={() => go(totalPages)}
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Errores */}
      {error && <div className="alert alert-danger mt-2">{error}</div>}
    </div>
  )
}

export default Pagination
