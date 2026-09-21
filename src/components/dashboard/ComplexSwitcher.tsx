"use client"

import React, { useState } from "react"
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ComplexOption {
  id: string
  name: string
}

interface ComplexSwitcherProps {
  currentComplexId: string
  complexes: ComplexOption[]
}

export function ComplexSwitcher({ currentComplexId, complexes }: ComplexSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!complexes || complexes.length <= 1) {
    return null
  }

  const activeComplex = complexes.find((c) => c.id === currentComplexId) || complexes[0]

  const handleSelect = async (complexId: string) => {
    if (complexId === currentComplexId) {
      setIsOpen(false)
      return
    }

    setLoadingId(complexId)
    try {
      const res = await fetch("/api/dashboard/switch-complejo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complexId }),
      })

      if (res.ok) {
        // Full page reload ensures Server Components re-read the new cookie
        window.location.reload()
      } else {
        alert("Error al cambiar de complejo")
        setLoadingId(null)
      }
    } catch {
      alert("Error de conexión al cambiar de sede")
      setLoadingId(null)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-full justify-between gap-2 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs font-semibold shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
        title="Cambiar de complejo deportivo"
      >
        <div className="flex items-center gap-2 truncate text-left">
          <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <span className="truncate">{activeComplex?.name || "Seleccionar Sede"}</span>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in-50 zoom-in-95">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Tus Sedes y Complejos
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {complexes.map((c) => {
                const isSelected = c.id === currentComplexId
                const isCurrentLoading = loadingId === c.id

                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isCurrentLoading}
                    onClick={() => handleSelect(c.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{c.name}</span>
                    </div>

                    {isCurrentLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" />
                    ) : isSelected ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
