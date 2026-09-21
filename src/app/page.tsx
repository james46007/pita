import Link from "next/link"
import {
  Trophy,
  Calendar,
  MessageCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Smartphone,
  ChevronRight,
} from "lucide-react"

export const metadata = {
  title: "Pita | Plataforma de Gestión y Reservas de Canchas de Pádel y Fútbol",
  description:
    "Software integral para complejos deportivos: reservas online, confirmaciones por WhatsApp, control de pagos y reportes de ingresos en tiempo real.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-900/30">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Pita<span className="text-emerald-400">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition">
              Características
            </a>
            <a href="#for-clubs" className="hover:text-white transition">
              Para Complejos
            </a>
            <a href="#for-players" className="hover:text-white transition">
              Para Jugadores
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login-cliente"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition"
            >
              Soy Jugador
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 transition"
            >
              Acceso Clubes
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-36">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            La plataforma moderna para clubes deportivos
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Tu complejo deportivo en{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              piloto automático.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Elimina el desorden de WhatsApp, evita el doble agendamiento y maximiza los ingresos de tus canchas de pádel y fútbol con una agenda ágil y profesional.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 transition transform hover:-translate-y-0.5"
            >
              Iniciar Prueba de tu Club
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login-cliente"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-sm transition"
            >
              Reservar como Jugador
            </Link>
          </div>

          {/* Social Proof / Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8 border-t border-zinc-900 text-left">
            <div>
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-xs text-zinc-500 mt-0.5">Anti Over-booking</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">&lt; 15s</p>
              <p className="text-xs text-zinc-500 mt-0.5">Reserva Rápida Manual</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">1-Clic</p>
              <p className="text-xs text-zinc-500 mt-0.5">Confirmación WhatsApp</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">24/7</p>
              <p className="text-xs text-zinc-500 mt-0.5">Disponibilidad en Vivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-zinc-900/40 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Características Esenciales
            </h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Diseñado para la velocidad de tu mostrador
            </p>
            <p className="mt-4 text-sm text-zinc-400">
              Cada herramienta está pensada para ahorrarle tiempo al recepcionista y brindarle seguridad a los jugadores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-lg hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Reserva Rápida y Agenda Híbrida
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Registra llamadas y clientes presenciales en 10 segundos con el botón de reserva manual. El slot se bloquea al instante evitando cruces de horarios.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-lg hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Confirmación por WhatsApp en 1 Clic
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sin configuraciones costosas de APIs. Haz clic en el botón de WhatsApp y abre un mensaje prediseñado con cancha, fecha, hora y monto listo para enviar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-lg hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Métricas e Ingresos en Tiempo Real
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conoce tus horas pico, porcentaje de ocupación, ticket promedio y facturación bruta. Exporta auditorías en formato CSV cuando lo necesites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Target Section: Clubs & Players */}
      <section id="for-clubs" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Clubs */}
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Para Propietarios y Administradores
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 mb-4">
                  Recupera la tranquilidad en la administración de tu club.
                </h3>
                <ul className="space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Bandeja de comprobantes de pago para validar transferencias sin confusiones.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Control de roles de personal (Admin y Staff) con permisos diferenciados.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Enlace web propio para compartir en la bio de tu Instagram y estados de WhatsApp.
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800/80">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  Entrar al Panel de Control de tu Complejo <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* For Players */}
            <div id="for-players" className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Para Jugadores de Pádel y Fútbol
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 mb-4">
                  Reserva tu cancha en segundos, sin esperar respuesta.
                </h3>
                <ul className="space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    Consulta disponibilidad de turnos en tiempo real las 24 horas del día.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    Sube tu comprobante de pago directo desde el navegador de tu celular.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    Historial de todas tus reservas confirmadas en un solo lugar.
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800/80">
                <Link
                  href="/login-cliente"
                  className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition"
                >
                  Iniciar Sesión como Jugador <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
              P
            </div>
            <span className="font-bold text-zinc-300">Pita Platform</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition">
              Club Login
            </Link>
            <Link href="/login-cliente" className="hover:text-zinc-300 transition">
              Player Portal
            </Link>
            <Link href="/registro" className="hover:text-zinc-300 transition">
              Crear Cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
