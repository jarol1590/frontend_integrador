'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@proyectointegrador/application'
import { useDependencies } from '../../providers/DependencyProvider'
import ResponseModal from '../../components/ResponseModal'
import { ArrowLeft, Mail, Smartphone, Loader2 } from 'lucide-react'

type Method = null | 'email' | 'sms'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { forgotPasswordUseCase } = useDependencies()
  const [method, setMethod] = useState<Method>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type)
    setModalTitle(title)
    setModalMessage(message)
    setModalVisible(true)
  }

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    try {
      if (method === 'email') {
        await forgotPasswordUseCase.execute({ email: data.email })
      }
      router.push(`/verify-code?flow=forgot&email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      showModal('error', 'Error', error.message ?? 'No se pudo enviar el código.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/images/MainBackground.png)', transform: 'scale(1.5)' }}
      />
      <Link
        href="/login"
        className="absolute top-6 left-6 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition shadow-sm border border-gray-200"
      >
        <ArrowLeft size={24} className="text-black" />
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-44 h-44 overflow-hidden mb-4">
            <img src="/images/ForgotP.png" alt="Recuperar contraseña" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-center">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-gray-600 text-center mt-2 max-w-xs leading-relaxed">
            {method === null
              ? 'Selecciona cómo quieres recuperar tu contraseña'
              : method === 'email'
                ? 'Ingresa tu correo y te enviaremos un código de verificación'
                : 'Ingresa tu número y te enviaremos un mensaje de texto con el código'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          {method === null && (
            <div className="space-y-1">
              <button
                onClick={() => setMethod('email')}
                className="w-full flex items-center gap-4 py-3 px-1 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  <Mail size={22} className="text-gray-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-800">Recuperar via Email</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Se enviará un correo electrónico con el código para reestablecer la contraseña
                  </p>
                </div>
              </button>

              <div className="h-px bg-gray-200 my-2" />

              <button
                onClick={() => setMethod('sms')}
                className="w-full flex items-center gap-4 py-3 px-1 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  <Smartphone size={22} className="text-gray-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-800">Recuperar via mensaje de texto</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Se enviará un mensaje de texto con el código para reestablecer la contraseña
                  </p>
                </div>
              </button>
            </div>
          )}

          {method !== null && (
            <div>
              <div className={`flex items-center gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-4 ${errors.email ? 'border-red-500' : 'focus-within:border-gray-500'}`}>
                {method === 'email' ? (
                  <Mail size={20} className="text-gray-600 shrink-0" />
                ) : (
                  <Smartphone size={20} className="text-gray-600 shrink-0" />
                )}
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <input
                      placeholder={method === 'email' ? 'Correo electrónico' : 'Teléfono'}
                      className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-400"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      type={method === 'email' ? 'email' : 'tel'}
                      autoCapitalize="none"
                    />
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-2 ml-2">{errors.email.message}</p>
              )}

              <button
                onClick={method === 'email' ? handleSubmit(onSubmit) : () => router.push(`/verify-code?flow=forgot`)}
                disabled={loading}
                className="w-full bg-gray-300 py-4 rounded-2xl font-bold text-base shadow-md hover:bg-gray-400 disabled:opacity-70 transition flex items-center justify-center mt-5"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : method === 'email' ? 'ENVIAR EMAIL' : 'ENVIAR SMS'}
              </button>
            </div>
          )}
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
