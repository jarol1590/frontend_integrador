'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@proyectointegrador/application'
import { useDependencies } from '../../providers/DependencyProvider'
import ResponseModal from '../../components/ResponseModal'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { loginUseCase } = useDependencies()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type)
    setModalTitle(title)
    setModalMessage(message)
    setModalVisible(true)
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const response = await loginUseCase.execute(data)
      if (response.usuario.rolNombre === 'Administrador') {
        router.push('/admin')
      } else if (
        response.usuario.rolNombre === 'Centro de Acopio' ||
        response.usuario.rolNombre === 'Trabajador Centro de acopio'
      ) {
        router.push('/dashboard-centro')
      } else {
        router.push('/dashboard')
      }
      showModal('success', 'Bienvenido', response.usuario.email)
    } catch (error: any) {
      showModal('error', 'Error', error.message ?? 'No se pudo iniciar sesión.')
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
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full border-2 border-black overflow-hidden bg-white shadow-xl mb-4">
            <img src="/images/WelcomeCow.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BIENVENIDO!</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <div
                className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-4 ${
                  errors.email ? 'border-red-500' : 'border-gray-300 focus-within:border-gray-500'
                }`}
              >
                <Mail size={20} className="text-gray-600 shrink-0" />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <input
                      placeholder="Email"
                      className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-400"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="email"
                      autoCapitalize="none"
                    />
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div
                className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-4 ${
                  errors.password ? 'border-red-500' : 'border-gray-300 focus-within:border-gray-500'
                }`}
              >
                <Lock size={20} className="text-gray-600 shrink-0" />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <input
                      placeholder="Contraseña"
                      className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-400"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="shrink-0"
                >
                  {showPassword ? (
                    <EyeOff size={22} className="text-gray-600" />
                  ) : (
                    <Eye size={22} className="text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.password.message}</p>
              )}
            </div>

            <Link
              href="/forgot-password"
              className="block text-sm text-gray-600 underline ml-1"
            >
              Olvide mi contraseña
            </Link>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="w-full bg-gray-300 py-5 rounded-2xl font-bold text-base shadow-md hover:bg-gray-400 disabled:opacity-70 transition flex items-center justify-center"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'INGRESAR'}
            </button>

            <p className="text-center text-gray-600">
              Aun no tienes cuenta?{' '}
              <Link href="/register" className="font-bold text-black hover:underline">
                Registrate
              </Link>
            </p>
          </div>
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
