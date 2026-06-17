'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  registerSchema,
  type RegisterFormData,
} from '@proyectointegrador/application'
import { useDependencies } from '../../providers/DependencyProvider'
import ResponseModal from '../../components/ResponseModal'
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Building,
  Leaf,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Locate,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { fetchDepartments, fetchCitiesByDepartment } from '../../infrastructure/colombiaApi'
import { geocodeAddress } from '../../infrastructure/geocode'
import { findOrCreateDepartamento, findOrCreateMunicipio } from '../../infrastructure/ubicacionApi'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
type IdType = 'CC' | 'Pasaporte' | 'NIT'
const idTypes: IdType[] = ['CC', 'Pasaporte', 'NIT']

export default function RegisterPage() {
  const router = useRouter()
  const { registerUseCase } = useDependencies()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [centrosAcopio, setCentrosAcopio] = useState<{ id: string; nombre: string }[]>([])
  const [loadingCentros, setLoadingCentros] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error'>('success')
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [dropdownIdOpen, setDropdownIdOpen] = useState(false)
  const [deptoOpen, setDeptoOpen] = useState(false)
  const [munOpen, setMunOpen] = useState(false)
  const [centroOpen, setCentroOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [deptos, setDeptos] = useState<{ id: number; name: string }[]>([])
  const [cities, setCities] = useState<{ id: number; name: string }[]>([])
  const [loadingDeptos, setLoadingDeptos] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const {
    control,
    trigger,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      idType: 'CC',
      idNumber: '',
      role: 'productor' as 'productor' | 'acopio' | 'trabajador',
      nombreLugar: '',
      departamento: null,
      municipio: null,
      centroSeleccionado: null,
      direccion: '',
      latitud: '',
      longitud: '',
      password: '',
      confirmPassword: '',
    },
  })

  const role = watch('role')
  const idType = watch('idType')
  const departamento = watch('departamento')
  const municipio = watch('municipio')
  const centroSeleccionado = watch('centroSeleccionado')
  const latitud = watch('latitud')
  const longitud = watch('longitud')

  useEffect(() => {
    setLoadingDeptos(true)
    fetchDepartments()
      .then((data) => setDeptos(Array.isArray(data) ? data : []))
      .catch(() => {
        setDeptos([])
        showModal('error', 'Error', 'No se pudieron cargar los departamentos.')
      })
      .finally(() => setLoadingDeptos(false))

    setLoadingCentros(true)
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/centros-acopio`)
        const body = await res.json()
        const lista = Array.isArray(body) ? body : body?.response ?? body?.data ?? []
        setCentrosAcopio(
          Array.isArray(lista)
            ? lista.map((c: any) => ({ id: String(c.centroAcopioId ?? c.id), nombre: c.nombre }))
            : [],
        )
      } catch {
        setCentrosAcopio([])
      } finally {
        setLoadingCentros(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!departamento) {
      setCities([])
      return
    }
    const list = deptos ?? []
    if (!Array.isArray(list) || list.length === 0) return
    const dept = list.find((d) => d.name === departamento)
    if (!dept) return
    setLoadingCities(true)
    fetchCitiesByDepartment(dept.id)
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [departamento, deptos])

  const showModal = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type)
    setModalTitle(title)
    setModalMessage(message)
    setModalVisible(true)
  }

  const totalSteps = role === 'trabajador' ? 3 : 5

  const validateStep = async (): Promise<boolean> => {
    setPasswordError('')
    const data = getValues()

    let fields: (keyof RegisterFormData)[]
    if (step === 1) fields = ['nombres', 'apellidos', 'telefono']
    else if (step === 2) fields = ['correo', 'idType', 'idNumber', 'role']
    else if (step === 3 && role === 'trabajador') fields = ['centroSeleccionado', 'password', 'confirmPassword']
    else if (step === 3) fields = ['nombreLugar', 'departamento', 'municipio']
    else if (step === 4) fields = ['direccion']
    else if (step === 5) fields = ['password', 'confirmPassword']
    else return false

    const partial: Record<string, unknown> = {}
    for (const f of fields) partial[f] = data[f]

    const picked = registerSchema.pick(
      Object.fromEntries(fields.map((f) => [f, true])) as any,
    )
    const result = picked.safeParse(partial)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof RegisterFormData
        setError(path, { message: issue.message })
      }
      return false
    }

    if (fields.includes('confirmPassword' as any)) {
      if (data.password !== data.confirmPassword) {
        setPasswordError('Las contraseñas no coinciden')
        setError('confirmPassword', { message: 'Las contraseñas no coinciden' })
        return false
      }
    }

    if (step === 4 && (!data.latitud || !data.longitud)) {
      showModal('error', 'Ubicación', "Presiona 'Obtener ubicación' para buscar las coordenadas de la dirección.")
      return false
    }

    return true
  }

  const handleNext = async () => {
    const ok = await validateStep()
    if (!ok) return
    setStep((s) => Math.min(s + 1, totalSteps))
  }

  const handleBack = () => {
    if (step === 1) router.back()
    else setStep(step - 1)
  }

  const handleRegister = async () => {
    const data = getValues()
    if (data.password !== data.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      setError('confirmPassword', { message: 'Las contraseñas no coinciden' })
      return
    }
    setPasswordError('')
    setLoading(true)
    try {
      const roleMap: Record<string, number> = {
        productor: 3,
        acopio: 2,
        trabajador: 4,
      }
      const docMap: Record<string, number> = {
        CC: 1,
        NIT: 3,
        Pasaporte: 4,
      }

      const rolId = roleMap[data.role ?? 'productor']
      const tipoDocumentoId = docMap[data.idType]

      let municipioId = 0
      if (data.departamento && data.municipio) {
        const deptoId = await findOrCreateDepartamento(data.departamento)
        municipioId = await findOrCreateMunicipio(data.municipio, deptoId)
      }

      const isProducer = rolId === 3
      const isAcopio = rolId === 2
      const isTrabajador = rolId === 4

      const dto = {
        email: data.correo,
        password: data.password,
        estado: 'activo' as const,
        rolId,
        centroAcopioId: data.centroSeleccionado ? Number(data.centroSeleccionado) : null,
        productorNombre: isProducer ? `${data.nombres} ${data.apellidos}`.trim() : '',
        documento: isProducer ? data.idNumber : '',
        telefono: isProducer ? data.telefono : '',
        tipoDocumentoId: isProducer ? tipoDocumentoId : 0,
        fincaNombre: isProducer && data.nombreLugar ? data.nombreLugar : undefined,
        direccion: isProducer && data.direccion ? data.direccion : undefined,
        latitud: isProducer && data.latitud ? Number(data.latitud) : undefined,
        longitud: isProducer && data.longitud ? Number(data.longitud) : undefined,
        municipioId: isProducer ? municipioId : 0,
        centroAcopio: isAcopio
          ? {
              nombre: data.nombreLugar || `${data.nombres} ${data.apellidos}`.trim(),
              direccion: data.direccion || null,
              latitud: data.latitud ? Number(data.latitud) : null,
              longitud: data.longitud ? Number(data.longitud) : null,
              municipioId,
            }
          : null,
        trabajador: isTrabajador
          ? {
              nombre: `${data.nombres} ${data.apellidos}`.trim(),
              documento: data.idNumber,
              telefono: data.telefono || null,
              tipoDocumentoId,
            }
          : null,
      }

      await registerUseCase.execute(dto as any)
      showModal('success', 'Registro exitoso', 'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.')
    } catch (error: any) {
      showModal('error', 'Error', error.message ?? 'No se pudo completar el registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 relative">
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 z-10 bg-white/70 rounded-full p-2 hover:bg-white/90 transition"
      >
        <ArrowLeft size={24} className="text-black" />
      </button>

      <div className="max-w-md mx-auto pt-20 pb-10">
        <div className="flex justify-center gap-2 mb-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                step === i + 1
                  ? 'w-6 bg-gray-600'
                  : step > i + 1
                    ? 'w-2.5 bg-gray-500'
                    : 'w-2.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.nombres ? 'border-2 border-red-500' : ''}`}>
                <User size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="nombres" render={({ field }) => (
                  <input {...field} placeholder="Nombres" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" autoCapitalize="words" />
                )} />
              </div>
              {errors.nombres && <p className="text-red-500 text-xs mt-1 ml-2">{errors.nombres.message}</p>}
            </div>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.apellidos ? 'border-2 border-red-500' : ''}`}>
                <User size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="apellidos" render={({ field }) => (
                  <input {...field} placeholder="Apellidos" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" autoCapitalize="words" />
                )} />
              </div>
              {errors.apellidos && <p className="text-red-500 text-xs mt-1 ml-2">{errors.apellidos.message}</p>}
            </div>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.telefono ? 'border-2 border-red-500' : ''}`}>
                <Phone size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="telefono" render={({ field }) => (
                  <input {...field} placeholder="Número de teléfono" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" type="tel" />
                )} />
              </div>
              {errors.telefono && <p className="text-red-500 text-xs mt-1 ml-2">{errors.telefono.message}</p>}
            </div>

            <div className="flex justify-end">
              <button onClick={handleNext} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 shadow transition">
                Siguiente <ArrowRight size={16} />
              </button>
            </div>

            <div className="h-px bg-gray-200" />
            <p className="text-center text-xs text-gray-500">O regístrate con:</p>
            <div className="flex justify-center">
              <button className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-300 transition">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-600"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.correo ? 'border-2 border-red-500' : ''}`}>
                <Mail size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="correo" render={({ field }) => (
                  <input {...field} placeholder="Correo electrónico" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" type="email" autoCapitalize="none" />
                )} />
              </div>
              {errors.correo && <p className="text-red-500 text-xs mt-1 ml-2">{errors.correo.message}</p>}
            </div>

            <div>
              <button
                type="button"
                onClick={() => { setDropdownIdOpen(!dropdownIdOpen); setDeptoOpen(false); setMunOpen(false); setCentroOpen(false) }}
                className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 w-full text-left ${errors.idType ? 'border-2 border-red-500' : ''}`}
              >
                <CreditCard size={20} className="text-gray-600 shrink-0" />
                <span className={`flex-1 text-base ${idType ? 'text-gray-900' : 'text-gray-500'}`}>
                  {idType === 'CC' ? 'Cédula de ciudadanía (CC)' : idType ?? 'Tipo de identificación'}
                </span>
                {dropdownIdOpen ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
              </button>
              {errors.idType && <p className="text-red-500 text-xs mt-1 ml-2">{errors.idType.message}</p>}
              {dropdownIdOpen && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-1 shadow-sm">
                  {idTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setValue('idType', type as IdType); setDropdownIdOpen(false); trigger('idType') }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 text-sm text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${idType === type ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'}`}
                    >
                      {type === 'CC' ? 'Cédula de ciudadanía (CC)' : type}
                      {idType === type && <Check size={16} className="text-gray-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.idNumber ? 'border-2 border-red-500' : ''}`}>
                <CreditCard size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="idNumber" render={({ field }) => (
                  <input {...field} placeholder="Número de identificación" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" inputMode="numeric" />
                )} />
              </div>
              {errors.idNumber && <p className="text-red-500 text-xs mt-1 ml-2">{errors.idNumber.message}</p>}
            </div>

            <p className="text-sm font-bold text-gray-700">Tipo de registro:</p>
            {errors.role && <p className="text-red-500 text-xs -mt-2 ml-2">{errors.role.message}</p>}

            {([
              { value: 'productor', label: 'Productor', icon: Leaf },
              { value: 'acopio', label: 'Centro de acopio', icon: Building },
              { value: 'trabajador', label: 'Trabajador', icon: User },
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => { setValue('role', item.value as 'productor' | 'acopio' | 'trabajador'); trigger('role') }}
                className="flex items-center gap-2.5 py-1.5 w-full text-left"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === item.value ? 'border-gray-600' : 'border-gray-400'}`}>
                  {role === item.value && <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />}
                </div>
                <item.icon size={18} className="text-gray-600" />
                <span className="text-sm text-gray-700">{item.label}</span>
              </button>
            ))}

            <div className="flex justify-between mt-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 transition">
                <ArrowLeft size={16} /> Anterior
              </button>
              <button onClick={handleNext} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 shadow transition">
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Productor / Acopio */}
        {step === 3 && (role === 'productor' || role === 'acopio') && (
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <p className="text-sm font-bold text-gray-700">
              {role === 'productor' ? 'Información de la finca' : 'Centro de acopio'}
            </p>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.nombreLugar ? 'border-2 border-red-500' : ''}`}>
                {role === 'acopio' ? <Building size={20} className="text-gray-600 shrink-0" /> : <Leaf size={20} className="text-gray-600 shrink-0" />}
                <Controller control={control} name="nombreLugar" render={({ field }) => (
                  <input {...field} placeholder={role === 'acopio' ? 'Nombre del centro de acopio' : 'Nombre de la finca'} className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" autoCapitalize="words" />
                )} />
              </div>
              {errors.nombreLugar && <p className="text-red-500 text-xs mt-1 ml-2">{errors.nombreLugar.message}</p>}
            </div>

            <div>
              <button
                type="button"
                onClick={() => { if (!loadingDeptos) { setDeptoOpen(!deptoOpen); setMunOpen(false); setCentroOpen(false); setDropdownIdOpen(false) } }}
                className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 w-full text-left`}
              >
                <MapPin size={20} className="text-gray-600 shrink-0" />
                <span className={`flex-1 text-base ${departamento ? 'text-gray-900' : 'text-gray-500'}`}>
                  {loadingDeptos ? 'Cargando...' : (departamento ?? 'Departamento')}
                </span>
                {loadingDeptos ? (
                  <Loader2 size={18} className="animate-spin text-gray-600" />
                ) : deptoOpen ? (
                  <ChevronUp size={18} className="text-gray-600" />
                ) : (
                  <ChevronDown size={18} className="text-gray-600" />
                )}
              </button>
              {errors.departamento && <p className="text-red-500 text-xs mt-1 ml-2">{errors.departamento.message}</p>}
              {deptoOpen && Array.isArray(deptos) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-1 shadow-sm max-h-44 overflow-y-auto">
                  {deptos.map((dep) => (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => { setValue('departamento', dep.name); setValue('municipio', null); setDeptoOpen(false); trigger(['departamento', 'municipio']) }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 text-sm text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${departamento === dep.name ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'}`}
                    >
                      {dep.name}
                      {departamento === dep.name && <Check size={16} className="text-gray-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => { if (departamento && !loadingCities) { setMunOpen(!munOpen); setDeptoOpen(false) } }}
                className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 w-full text-left ${(!departamento || loadingCities) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <MapPin size={20} className="text-gray-600 shrink-0" />
                <span className={`flex-1 text-base ${municipio ? 'text-gray-900' : 'text-gray-500'}`}>
                  {loadingCities ? 'Cargando...' : (municipio ?? 'Municipio')}
                </span>
                {loadingCities ? (
                  <Loader2 size={18} className="animate-spin text-gray-600" />
                ) : munOpen ? (
                  <ChevronUp size={18} className="text-gray-600" />
                ) : (
                  <ChevronDown size={18} className="text-gray-600" />
                )}
              </button>
              {errors.municipio && <p className="text-red-500 text-xs mt-1 ml-2">{errors.municipio.message}</p>}
              {munOpen && Array.isArray(cities) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-1 shadow-sm max-h-44 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => { setValue('municipio', city.name); setMunOpen(false); trigger('municipio') }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 text-sm text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${municipio === city.name ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'}`}
                    >
                      {city.name}
                      {municipio === city.name && <Check size={16} className="text-gray-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between mt-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 transition">
                <ArrowLeft size={16} /> Anterior
              </button>
              <button onClick={handleNext} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 shadow transition">
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Trabajador (final) */}
        {step === 3 && role === 'trabajador' && (
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <p className="text-sm font-bold text-gray-700">Centro de acopio y acceso</p>

            <div>
              <button
                type="button"
                onClick={() => { setCentroOpen(!centroOpen); setDropdownIdOpen(false); setDeptoOpen(false); setMunOpen(false) }}
                className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 w-full text-left ${errors.centroSeleccionado ? 'border-2 border-red-500' : ''}`}
              >
                <Building size={20} className="text-gray-600 shrink-0" />
                <span className={`flex-1 text-base ${centroSeleccionado ? 'text-gray-900' : 'text-gray-500'}`}>
                  {loadingCentros
                    ? 'Cargando...'
                    : centroSeleccionado
                      ? centrosAcopio.find((c) => c.id === centroSeleccionado)?.nombre
                      : 'Centro de acopio'}
                </span>
                {centroOpen ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
              </button>
              {errors.centroSeleccionado && <p className="text-red-500 text-xs mt-1 ml-2">{errors.centroSeleccionado.message}</p>}
              {centroOpen && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-1 shadow-sm max-h-44 overflow-y-auto">
                  {centrosAcopio.map((centro) => (
                    <button
                      key={centro.id}
                      type="button"
                      onClick={() => { setValue('centroSeleccionado', centro.id); setCentroOpen(false); trigger('centroSeleccionado') }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 text-sm text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${centroSeleccionado === centro.id ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'}`}
                    >
                      {centro.nombre}
                      {centroSeleccionado === centro.id && <Check size={16} className="text-gray-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.password ? 'border-2 border-red-500' : ''}`}>
                <Lock size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="password" render={({ field }) => (
                  <input {...field} placeholder="Contraseña" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" type={showPassword ? 'text' : 'password'} autoCapitalize="none" />
                )} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                  {showPassword ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password.message}</p>}
            </div>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.confirmPassword || passwordError ? 'border-2 border-red-500' : ''}`}>
                <Lock size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="confirmPassword" render={({ field }) => (
                  <input {...field} placeholder="Confirmar contraseña" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" type={showConfirm ? 'text' : 'password'} autoCapitalize="none" />
                )} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="shrink-0">
                  {showConfirm ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword.message}</p>}
              {passwordError && !errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{passwordError}</p>}
            </div>

            <div className="flex justify-between mt-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 transition">
                <ArrowLeft size={16} /> Anterior
              </button>
              <button onClick={handleRegister} disabled={loading} className="bg-gray-300 hover:bg-gray-400 py-3 px-6 rounded-2xl font-bold text-sm text-gray-800 shadow disabled:opacity-70 transition flex items-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'REGISTRARSE'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Ubicación (productor / acopio) */}
        {step === 4 && (role === 'productor' || role === 'acopio') && (
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <p className="text-sm font-bold text-gray-700">Ubicación</p>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.direccion ? 'border-2 border-red-500' : ''}`}>
                <MapPin size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="direccion" render={({ field }) => (
                  <input {...field} placeholder="Dirección" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" autoCapitalize="words" />
                )} />
              </div>
              {errors.direccion && <p className="text-red-500 text-xs mt-1 ml-2">{errors.direccion.message}</p>}
            </div>

            <button
              type="button"
              onClick={async () => {
                const dir = getValues('direccion')
                const mun = getValues('municipio')
                const dep = getValues('departamento')
                if (!dir?.trim() || !mun || !dep) {
                  showModal('error', 'Faltan datos', 'Completa departamento, municipio y dirección primero.')
                  return
                }
                setGeocoding(true)
                try {
                  const result = await geocodeAddress(dir, mun, dep)
                  if (result) {
                    setValue('latitud', String(result.lat))
                    setValue('longitud', String(result.lng))
                  } else {
                    showModal('error', 'No encontrado', 'No se pudo determinar la ubicación. Puedes continuar e ingresarla después.')
                  }
                } catch {
                  showModal('error', 'Error', 'No se pudo conectar con el servicio de mapas.')
                } finally {
                  setGeocoding(false)
                }
              }}
              disabled={geocoding}
              className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 py-3.5 rounded-2xl font-bold text-sm text-gray-800 w-full disabled:opacity-70 transition"
            >
              {geocoding ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Locate size={18} />
                  Obtener ubicación
                </>
              )}
            </button>

            {latitud && longitud && (
              <div className="flex items-center gap-1.5 px-1">
                <Check size={18} className="text-green-500" />
                <span className="text-sm text-gray-600">
                  Lat: {Number(latitud).toFixed(4)}, Lng: {Number(longitud).toFixed(4)}
                </span>
              </div>
            )}

            <div className="flex justify-between mt-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 transition">
                <ArrowLeft size={16} /> Anterior
              </button>
              <button onClick={handleNext} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 shadow transition">
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Password (productor / acopio, final) */}
        {step === 5 && (role === 'productor' || role === 'acopio') && (
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <p className="text-sm font-bold text-gray-700">Crea tu contraseña</p>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.password ? 'border-2 border-red-500' : ''}`}>
                <Lock size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="password" render={({ field }) => (
                  <input {...field} placeholder="Contraseña" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" type={showPassword ? 'text' : 'password'} autoCapitalize="none" />
                )} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                  {showPassword ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password.message}</p>}
            </div>

            <div>
              <div className={`flex items-center gap-3 bg-gray-200 rounded-2xl px-4 py-4 ${errors.confirmPassword || passwordError ? 'border-2 border-red-500' : ''}`}>
                <Lock size={20} className="text-gray-600 shrink-0" />
                <Controller control={control} name="confirmPassword" render={({ field }) => (
                  <input {...field} placeholder="Confirmar contraseña" className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-500" type={showConfirm ? 'text' : 'password'} autoCapitalize="none" />
                )} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="shrink-0">
                  {showConfirm ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword.message}</p>}
              {passwordError && !errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{passwordError}</p>}
            </div>

            <div className="flex justify-between mt-2">
              <button onClick={handleBack} className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 py-2.5 px-5 rounded-2xl font-bold text-sm text-gray-800 transition">
                <ArrowLeft size={16} /> Anterior
              </button>
              <button onClick={handleRegister} disabled={loading} className="bg-gray-300 hover:bg-gray-400 py-3 px-6 rounded-2xl font-bold text-sm text-gray-800 shadow disabled:opacity-70 transition flex items-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'REGISTRARSE'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ResponseModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setModalVisible(false)
          if (modalType === 'success') router.push('/login')
        }}
      />
    </div>
  )
}
