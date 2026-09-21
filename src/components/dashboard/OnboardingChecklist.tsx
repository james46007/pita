"use client"

import React, { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ArrowRight, Sparkles, ChevronDown, ChevronUp, Layers, Clock, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface OnboardingStep {
  id: number
  title: string
  description: string
  href: string
  completed: boolean
}

export interface OnboardingData {
  isComplete: boolean
  currentStep: number
  percent: number
  counts: {
    courts: number
    schedules: number
    slots: number
  }
  steps: OnboardingStep[]
}

interface OnboardingChecklistProps {
  data: OnboardingData | null
  onRefresh?: () => void
}

export function OnboardingChecklist({ data, onRefresh }: OnboardingChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!data || dismissed) return null

  // If complete, we show a brief celebration card that can be dismissed
  if (data.isComplete) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                ¡Tu complejo está listo para recibir reservas!
                <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">100% Configurado</Badge>
              </h4>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Has creado canchas, configurado horarios y publicado turnos. Los jugadores ya pueden reservar online.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300 self-end sm:self-auto"
          >
            Ocultar guía
          </Button>
        </div>
      </div>
    )
  }

  const stepIcons = [
    <Layers key="1" className="h-4 w-4" />,
    <Clock key="2" className="h-4 w-4" />,
    <CalendarDays key="3" className="h-4 w-4" />,
  ]

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-zinc-50 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                {data.currentStep}
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Guía de Activación de tu Complejo
              </h3>
              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-[11px] font-medium">
                Paso {data.currentStep} de 3
              </Badge>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Completa estos 3 pasos indispensables para comenzar a operar y recibir reservas de tus clientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label={isCollapsed ? "Expandir guía" : "Colapsar guía"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5 font-medium">
            <span>Progreso de configuración</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{data.percent}% completado</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(data.percent, 8)}%` }}
            />
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <CardContent className="p-4 sm:p-5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.steps.map((step, index) => {
              const isCurrent = step.id === data.currentStep
              const isDone = step.completed

              return (
                <div
                  key={step.id}
                  className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                    isDone
                      ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/15"
                      : isCurrent
                      ? "border-emerald-500 bg-white dark:bg-zinc-800 shadow-md ring-1 ring-emerald-500/20"
                      : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 opacity-75"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg text-xs ${
                            isDone
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : isCurrent
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {stepIcons[index]}
                        </span>
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Paso {step.id}
                        </span>
                      </div>

                      {isDone ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border-none text-[10px] flex items-center gap-1 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Hecho
                        </Badge>
                      ) : isCurrent ? (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-none text-[10px] font-semibold animate-pulse">
                          Siguiente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-400 border-zinc-300 dark:border-zinc-700 text-[10px]">
                          Pendiente
                        </Badge>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold mb-1 ${
                        isDone
                          ? "text-zinc-700 dark:text-zinc-300 line-through opacity-80"
                          : isCurrent
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Link href={step.href} className="block w-full">
                      <Button
                        size="sm"
                        variant={isCurrent ? "default" : "outline"}
                        className={`w-full text-xs font-medium h-8 ${
                          isCurrent
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            : isDone
                            ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {isDone ? (
                          "Gestionar"
                        ) : (
                          <>
                            Configurar ahora
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
