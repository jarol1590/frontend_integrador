'use client'
import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDependencies } from '../../providers/DependencyProvider'
import ResponseModal from '../../components/ResponseModal'
import { ArrowLeft, Loader2 } from 'lucide-react'

function VerifyCodeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flow = searchParams.get('flow') as 'forgot' | 'register' | null
  const email = searchParams.get('email') ?? ''
  const { verifyResetCodeUseCase } = useDependencies()

  const [code, setCode] = useState(['', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '')
    const newCode = [...code]
    newCode[index] = clean
    setCode(newCode)

    if (clean && index < 4) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type)
    setModalTitle(title)
    setModalMessage(message)
    setModalVisible(true)
  }

  const handleConfirm = async () => {
    const fullCode = code.join('')
    if (fullCode.length < 5) return

    if (flow === 'register') {
      router.push('/dashboard')
    } else {
      setVerifying(true)
      try {
        const token = await verifyResetCodeUseCase.execute(email, fullCode)
        router.push(`/reset-password?token=${token}`)
      } catch {
        showModal('error', 'Código inválido', 'Código inválido, verifica en tu correo.')
      } finally {
        setVerifying(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 relative">
      <Link
        href="/forgot-password"
        className="absolute top-6 left-6 z-10 bg-white/70 rounded-full p-2 hover:bg-white/90 transition"
      >
        <ArrowLeft size={24} className="text-black" />
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-40 h-40 mb-12">
            <svg viewBox="0 0 100 100" className="w-full h-full text-gray-400">
              <rect x="30" y="20" width="40" height="50" rx="5" fill="currentColor" />
              <rect x="35" y="25" width="30" height="8" rx="2" fill="#e5e7eb" />
              <rect x="35" y="37" width="30" height="8" rx="2" fill="#e5e7eb" />
              <rect x="35" y="49" width="20" height="8" rx="2" fill="#e5e7eb" />
              <circle cx="50" cy="78" r="12" fill="currentColor" opacity="0.3" />
              <path d="M44 78 L48 82 L56 74" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-gray-600 text-center mt-2 max-w-xs">
            Ingresa el código que enviamos a tu correo electrónico
          </p>
        </div>

        <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center gap-5">
          <div className="flex justify-center gap-3 my-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el
                }}
                className={`w-12 h-14 bg-gray-200 rounded-xl text-2xl font-bold text-gray-900 text-center outline-none ${
                  digit ? 'bg-gray-300 border-2 border-gray-400' : ''
                }`}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                type="text"
                inputMode="numeric"
                maxLength={1}
              />
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={verifying || code.join('').length < 5}
            className="w-full bg-gray-300 py-4 rounded-2xl font-bold text-base shadow-md hover:bg-gray-400 disabled:opacity-50 transition flex items-center justify-center"
          >
            {verifying ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                VERIFICANDO...
              </>
            ) : (
              'CONFIRMAR'
            )}
          </button>

          <button
            onClick={() => console.log('Reenviar código')}
            className="text-sm text-gray-600"
          >
            ¿No recibiste el código?{' '}
            <span className="font-bold text-black underline">Reenviar</span>
          </button>
        </div>
      </div>

      <ResponseModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </div>
  )
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-gray-500 animate-pulse">Cargando...</div>}>
      <VerifyCodeForm />
    </Suspense>
  )
}
