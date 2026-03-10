"use client"

import { useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Ticket, ArrowLeft, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Step = "email" | "otp" | "success"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") ?? "/"

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    setError("")

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Auto-create on first login
      },
    })

    if (otpError) {
      setError(otpError.message)
    } else {
      setStep("otp")
    }
    setIsLoading(false)
  }

  const handleOTPInput = (index: number, value: string) => {
    // Only digits
    const digit = value.replace(/\D/, "").slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), digit].join("")
      if (fullCode.length === 6) verifyOTP(fullCode)
    }
  }

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      const digits = pasted.split("")
      setOtp(digits)
      inputRefs.current[5]?.focus()
      verifyOTP(pasted)
    }
  }

  const verifyOTP = async (code: string) => {
    setIsLoading(true)
    setError("")

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    })

    if (verifyError) {
      setError("Código incorrecto o expirado. Inténtalo de nuevo.")
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } else {
      setStep("success")
      setTimeout(() => router.push(redirectTo), 1200)
    }
    setIsLoading(false)
  }

  const handleVerifyManual = (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join("")
    if (code.length === 6) verifyOTP(code)
  }

  return (
    <div className="min-h-screen bg-[var(--primary-light)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-[var(--primary)] text-xl">EcoEventos</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[var(--primary-border)] p-6">
          {/* Step: Email */}
          {step === "email" && (
            <>
              <h2 className="text-lg font-bold text-[var(--text)] mb-1">
                Inicia sesión
              </h2>
              <p className="text-sm text-[var(--muted)] mb-5">
                Sin contraseña. Te enviamos un código de 6 dígitos.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoFocus
                    className="w-full border border-[var(--primary-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-[var(--primary)] text-white font-semibold py-3 rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <>
              <button
                onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError("") }}
                className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--text)] mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cambiar correo
              </button>

              <h2 className="text-lg font-bold text-[var(--text)] mb-1">
                Ingresa el código
              </h2>
              <p className="text-sm text-[var(--muted)] mb-5">
                Enviamos un código de 6 dígitos a{" "}
                <span className="font-medium text-[var(--text)]">{email}</span>
              </p>

              <form onSubmit={handleVerifyManual} className="space-y-4">
                {/* 6-digit OTP input */}
                <div className="flex gap-2 justify-center" onPaste={handleOTPPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPInput(i, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(i, e)}
                      className={`w-11 h-12 text-center text-lg font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all ${
                        digit
                          ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                          : "border-[var(--primary-border)] text-[var(--text)]"
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length < 6}
                  className="w-full bg-[var(--primary)] text-white font-semibold py-3 rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Verificando..." : "Verificar código"}
                </button>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="w-full text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors py-1"
                >
                  Reenviar código
                </button>
              </form>
            </>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto mb-3" />
              <h2 className="text-lg font-bold text-[var(--text)] mb-1">
                ¡Listo!
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Sesión iniciada. Redirigiendo...
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-5">
          Al continuar aceptas nuestros{" "}
          <a href="/terminos" className="text-[var(--primary)] hover:underline">
            Términos
          </a>{" "}
          y{" "}
          <a href="/privacidad" className="text-[var(--primary)] hover:underline">
            Privacidad
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
