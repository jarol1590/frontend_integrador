'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@proyectointegrador/application'
import { useDependencies } from '../../providers/DependencyProvider'
import ResponseModal from '../../components/ResponseModal'
import { ArrowLeft, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token') ?? ''
  const { resetPasswordUseCase } = useDependencies()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [modalCloseCallback, setModalCloseCallback] = useState<(() => void) | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenParam, newPassword: '', confirmPassword: '' },
  })

  const showModal = (
    type: 'success' | 'error',
    title: string,
    message: string,
    onClose?: () => void,
  ) => {
    setModalType(type)
    setModalTitle(title)
    setModalMessage(message)
    setModalVisible(true)
    if (onClose) setModalCloseCallback(() => onClose)
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true)
    try {
      await resetPasswordUseCase.execute({
        token: data.token,
        newPassword: data.newPassword,
      })
      showModal('success', 'Éxito', 'Contraseña actualizada correctamente.', () =>
        router.replace('/login'),
      )
    } catch (error: any) {
      showModal('error', 'Error', error.message ?? 'No se pudo restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Link
        href="/login"
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
          <h1 className="text-2xl font-bold text-center">Restablecer contraseña</h1>
          <p className="text-sm text-gray-600 text-center mt-2">Ingresa tu nueva contraseña</p>
        </div>

        <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <input type="hidden" name="token" value={tokenParam} />

          <div>
            <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.newPassword ? 'border-2 border-red-500' : ''}`}>
              <Lock size={20} className="text-gray-600 shrink-0" />
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <input
                    placeholder="Nueva contraseña"
                    className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    type={showPassword ? 'text' : 'password'}
                    autoCapitalize="none"
                  />
                )}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                {showPassword ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.newPassword.message}</p>}
          </div>

          <div>
            <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.confirmPassword ? 'border-2 border-red-500' : ''}`}>
              <Lock size={20} className="text-gray-600 shrink-0" />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <input
                    placeholder="Confirmar contraseña"
                    className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    type={showConfirm ? 'text' : 'password'}
                    autoCapitalize="none"
                  />
                )}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="shrink-0">
                {showConfirm ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword.message}</p>}
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="w-full bg-gray-300 py-4 rounded-2xl font-bold text-base shadow-md hover:bg-gray-400 disabled:opacity-70 transition flex items-center justify-center"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'RESTABLECER CONTRASEÑA'}
          </button>
        </div>
      </div>

      <ResponseModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setModalVisible(false)
          modalCloseCallback?.()
          setModalCloseCallback(null)
        }}
      />
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 relative">
      <Suspense fallback={<div className="text-gray-500 animate-pulse">Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
