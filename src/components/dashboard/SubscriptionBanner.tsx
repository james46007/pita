"use client"

import React, { useState } from "react"
import { AlertCircle, Clock, ShieldAlert, Sparkles, X, MessageCircle } from "lucide-react"
import type { SubscriptionState } from "@/lib/subscription"

interface SubscriptionBannerProps {
  subscription: SubscriptionState | null
  isSuperAdmin?: boolean
}

export function SubscriptionBanner({ subscription, isSuperAdmin }: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!subscription || dismissed) return null

  // If active, do not display a disruptive banner
  if (subscription.status === "ACTIVE") return null

  // Message and WhatsApp button config
  const supportPhone = "51999999999" // Can be configured or updated
  const supportText = encodeURIComponent(
    `Hola, deseo consultar sobre la renovación/activación de suscripción de mi complejo en la plataforma.`
  )
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${supportText}`

  if (subscription.status === "SUSPENDED" || subscription.status === "INACTIVE") {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 text-red-700 dark:text-red-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Modo Solo Lectura Activado — Suscripción Vencida
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-300/80">
                Tus datos históricos y clientes siguen seguros, pero la creación de nuevas reservas está pausada.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Regularizar Servicio
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (subscription.status === "GRACE") {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-800 dark:text-amber-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Período de Gracia: {subscription.daysLeftInGrace} día{subscription.daysLeftInGrace > 1 ? "s" : ""} restante{subscription.daysLeftInGrace > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Tu período de prueba ha finalizado. Tienes {subscription.daysLeftInGrace} días para activar tu suscripción antes del paso a modo solo lectura.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Activar Suscripción
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400"
              title="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // TRIAL status
  if (subscription.status === "TRIAL") {
    const isEndingSoon = subscription.daysLeftInTrial <= 7

    return (
      <div
        className={`border-b px-4 py-2.5 transition-colors ${
          isEndingSoon
            ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1 rounded-md shrink-0 ${
                isEndingSoon
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isEndingSoon ? <Clock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <p className="text-xs sm:text-sm font-medium">
              Prueba gratuita en curso:{" "}
              <strong className="font-bold">
                {subscription.daysLeftInTrial} día{subscription.daysLeftInTrial > 1 ? "s" : ""} restante{subscription.daysLeftInTrial > 1 ? "s" : ""}
              </strong>
              {isEndingSoon && " — Prepárate para activar tu suscripción."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEndingSoon && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
              >
                Consultar Planes
              </a>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="p-1 opacity-70 hover:opacity-100 transition-opacity"
              title="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
