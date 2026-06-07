import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormData,
} from "@proyectointegrador/application";
import {
    View,
    Text,
    TextInput,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDependencies } from "../providers/DependencyProvider";
import { geocodeAddress } from "../infrastructure/geocode";
import { fetchDepartments, fetchCitiesByDepartment, type DepartmentData, type CityData } from "../infrastructure/colombiaApi";
import { findOrCreateDepartamento, findOrCreateMunicipio } from "../infrastructure/ubicacionApi";

type IdType = "CC" | "Pasaporte" | "NIT";


const centrosAcopio = [
    { id: "1", nombre: "Centro Acopio Norte" },
    { id: "2", nombre: "Centro Acopio Sur" },
    { id: "3", nombre: "Centro Acopio Central" },
];

export default function Register() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const { registerUseCase } = useDependencies();

    const {
        control,
        trigger,
        watch,
        setValue,
        getValues,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            nombres: "",
            apellidos: "",
            telefono: "",
            correo: "",
            idNumber: "",
            nombreLugar: "",
            departamento: null,
            municipio: null,
            centroSeleccionado: null,
            direccion: "",
            latitud: "",
            longitud: "",
            password: "",
            confirmPassword: "",
        },
    });

    const role = watch("role");
    const idType = watch("idType");
    const departamento = watch("departamento");
    const municipio = watch("municipio");
    const centroSeleccionado = watch("centroSeleccionado");
    const latitud = watch("latitud");
    const longitud = watch("longitud");

    const [dropdownIdOpen, setDropdownIdOpen] = useState(false);
    const [deptoOpen, setDeptoOpen] = useState(false);
    const [munOpen, setMunOpen] = useState(false);
    const [centroOpen, setCentroOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Departamentos / municipios desde API pública
    const [deptos, setDeptos] = useState<DepartmentData[]>([]);
    const [cities, setCities] = useState<CityData[]>([]);
    const [loadingDeptos, setLoadingDeptos] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Cargar departamentos al montar el componente
    useEffect(() => {
        setLoadingDeptos(true);
        fetchDepartments()
            .then((data) => setDeptos(Array.isArray(data) ? data : []))
            .catch(() => {
                setDeptos([])
                Alert.alert("Error", "No se pudieron cargar los departamentos.")
            })
            .finally(() => setLoadingDeptos(false));
    }, []);

    // Cargar municipios al seleccionar departamento
    useEffect(() => {
        if (!departamento) { setCities([]); return; }
        const list = deptos ?? []
        if (!Array.isArray(list) || list.length === 0) return
        const dept = list.find((d) => d.name === departamento);
        if (!dept) return;
        setLoadingCities(true);
        fetchCitiesByDepartment(dept.id)
            .then((data) => setCities(Array.isArray(data) ? data : []))
            .catch(() => setCities([]))
            .finally(() => setLoadingCities(false));
    }, [departamento, deptos]);

    const idTypes: IdType[] = ["CC", "Pasaporte", "NIT"];

    const totalSteps = role === "trabajador" ? 3 : 5;

    const validateStep = async (): Promise<boolean> => {
        if (step === 1) return await trigger(["nombres", "apellidos", "telefono"]);
        if (step === 2) return await trigger(["correo", "idType", "idNumber", "role"]);
        if (step === 3) {
            if (role === "trabajador") {
                // workers validate centro + password on step 3
                return await trigger(["centroSeleccionado", "password", "confirmPassword"]);
            }
            return await trigger(["nombreLugar", "departamento", "municipio"]);
        }
        if (step === 4) {
            const valid = await trigger(["direccion"]);
            if (!valid) return false;
            if (!getValues("latitud") || !getValues("longitud")) {
                Alert.alert(
                    "Ubicación",
                    "Presiona 'Obtener ubicación' para buscar las coordenadas de la dirección.",
                );
                return false;
            }
            return true;
        }
        if (step === 5) return await trigger(["password", "confirmPassword"]);
        return false;
    };

    const handleNext = async () => {
        const ok = await validateStep();
        if (!ok) return;
        setStep((s) => Math.min(s + 1, totalSteps));
    };

    const handleBack = () => {
        if (step === 1) router.back();
        else setStep(step - 1);
    };

   const handleRegister = async () => {
    const valid = await trigger(["password", "confirmPassword"]);
    if (!valid) return;
    const data = getValues();
    setLoading(true);
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
        console.log('[DEBUG] handleRegister depto:', data.departamento, 'muni:', data.municipio)
        if (data.departamento && data.municipio) {
            const deptoId = await findOrCreateDepartamento(data.departamento)
            console.log('[DEBUG] deptoId resuelto:', deptoId)
            municipioId = await findOrCreateMunicipio(data.municipio, deptoId)
            console.log('[DEBUG] municipioId resuelto:', municipioId)
        }

        await registerUseCase.execute({
            email: data.correo,
            password: data.password,
            rolId,
            centroAcopioId: data.centroSeleccionado ? Number(data.centroSeleccionado) : null,
            productorNombre: `${data.nombres} ${data.apellidos}`.trim(),
            documento: data.idNumber,
            telefono: data.telefono,
            tipoDocumentoId,
            fincaNombre: data.nombreLugar || undefined,
            direccion: data.direccion || undefined,
            latitud: data.latitud ? Number(data.latitud) : undefined,
            longitud: data.longitud ? Number(data.longitud) : undefined,
            municipioId,
        })
        router.push("/verify-code?flow=register" as any);
    } catch (error: any) {
        Alert.alert("Error", error.message ?? "No se pudo completar el registro.");
    } finally {
        setLoading(false);
    }
};

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../../packages/assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [{ scale: 1.5 }, { translateY: 285 }],
                    
                }}
            />

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Indicador de pasos */}
                <View style={styles.stepsContainer}>
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.stepDot,
                                step === i + 1 && styles.stepDotActive,
                                step > i + 1 && styles.stepDotDone,
                            ]}
                        />
                    ))}
                </View>

                {/* ── PASO 1 ── */}
                {step === 1 && (
                    <View style={styles.card}>
                        <View style={[styles.inputContainer, errors.nombres && styles.inputError]}>
                            <Ionicons name="person-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="nombres"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Nombres" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" />
                                )} />
                        </View>
                        {errors.nombres && <Text style={styles.errorText}>{errors.nombres.message}</Text>}
                        <View style={[styles.inputContainer, errors.apellidos && styles.inputError]}>
                            <Ionicons name="person-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="apellidos"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Apellidos" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" />
                                )} />
                        </View>
                        {errors.apellidos && <Text style={styles.errorText}>{errors.apellidos.message}</Text>}
                        <View style={[styles.inputContainer, errors.telefono && styles.inputError]}>
                            <Ionicons name="phone-portrait-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="telefono"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Número de teléfono" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" />
                                )} />
                        </View>
                        {errors.telefono && <Text style={styles.errorText}>{errors.telefono.message}</Text>}
                        <View style={styles.nextRow}>
                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.nextButton,
                                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                <Text style={styles.nextButtonText}>Siguiente</Text>
                                <Ionicons name="arrow-forward" size={16} color="#333" />
                            </Pressable>
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.socialText}>O regístrate con:</Text>
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#555" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── PASO 2 ── */}
                {step === 2 && (
                    <View style={styles.card}>
                        <View style={[styles.inputContainer, errors.correo && styles.inputError]}>
                            <Ionicons name="mail-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="correo"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Correo electrónico" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" autoCapitalize="none" />
                                )} />
                        </View>
                        {errors.correo && <Text style={styles.errorText}>{errors.correo.message}</Text>}

                        {/* Dropdown tipo ID */}
                        <TouchableOpacity style={[styles.inputContainer, errors.idType && styles.inputError]}
                            onPress={() => setDropdownIdOpen(!dropdownIdOpen)} activeOpacity={0.8}>
                            <Ionicons name="card-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: idType ? "#222" : "#666", paddingVertical: 0 }]}>
                                {idType === "CC" ? "Cédula de ciudadanía (CC)" : idType ?? "Tipo de identificación"}
                            </Text>
                            <Ionicons name={dropdownIdOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                        </TouchableOpacity>
                        {errors.idType && <Text style={styles.errorText}>{errors.idType.message}</Text>}
                        {dropdownIdOpen && (
                            <View style={styles.dropdown}>
                                {idTypes.map((type) => (
                                    <TouchableOpacity key={type}
                                        style={[styles.dropdownItem, idType === type && styles.dropdownItemSelected]}
                                        onPress={() => { setValue("idType", type as IdType); setDropdownIdOpen(false); trigger("idType"); }}>
                                        <Text style={[styles.dropdownText, idType === type && styles.dropdownTextSelected]}>
                                            {type === "CC" ? "Cédula de ciudadanía (CC)" : type}
                                        </Text>
                                        {idType === type && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={[styles.inputContainer, errors.idNumber && styles.inputError]}>
                            <Ionicons name="id-card-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="idNumber"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Número de identificación" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="number-pad" />
                                )} />
                        </View>
                        {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber.message}</Text>}

                        <Text style={styles.roleTitle}>Tipo de registro:</Text>
                        {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}
                        {[
                            { value: "productor", label: "Productor", icon: "leaf-outline" },
                            { value: "acopio", label: "Centro de acopio", icon: "business-outline" },
                            { value: "trabajador", label: "Trabajador", icon: "construct-outline" },
                        ].map((item) => (
                            <TouchableOpacity key={item.value} style={styles.radioRow}
                                onPress={() => { setValue("role", item.value as "productor" | "acopio" | "trabajador"); trigger("role"); }}>
                                <View style={[styles.radioOuter, role === item.value && styles.radioOuterSelected]}>
                                    {role === item.value && <View style={styles.radioInner} />}
                                </View>
                                <Ionicons name={item.icon as any} size={18} color="#555" style={{ marginRight: 8 }} />
                                <Text style={styles.radioLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.nextButton,
                                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                <Text style={styles.nextButtonText}>Siguiente</Text>
                                <Ionicons name="arrow-forward" size={16} color="#333" />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ── PASO 3 — Productor / Acopio ── */}
                {step === 3 && (role === "productor" || role === "acopio") && (
                    <View style={styles.card}>
                        <Text style={styles.roleTitle}>
                            {role === "productor" ? "Información de la finca" : "Información del centro de acopio"}
                        </Text>

                        <View style={[styles.inputContainer, errors.nombreLugar && styles.inputError]}>
                            <Ionicons
                                name={role === "productor" ? "leaf-outline" : "business-outline"}
                                size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="nombreLugar"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder={role === "productor" ? "Nombre de la finca" : "Nombre del centro de acopio"}
                                        style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" />
                                )} />
                        </View>
                        {errors.nombreLugar && <Text style={styles.errorText}>{errors.nombreLugar.message}</Text>}

                        {/* Departamento */}
                        <TouchableOpacity style={styles.inputContainer}
                            onPress={() => { if (!loadingDeptos) { setDeptoOpen(!deptoOpen); setMunOpen(false); } }} activeOpacity={0.8}>
                            <Ionicons name="map-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: departamento ? "#222" : "#666", paddingVertical: 0 }]}>
                                {loadingDeptos ? "Cargando..." : (departamento ?? "Departamento")}
                            </Text>
                            {loadingDeptos ? (
                                <ActivityIndicator size="small" color="#555" />
                            ) : (
                                <Ionicons name={deptoOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                            )}
                        </TouchableOpacity>
                        {deptoOpen && Array.isArray(deptos) && (
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                {deptos.map((dep) => (
                                    <TouchableOpacity key={dep.id}
                                        style={[styles.dropdownItem, departamento === dep.name && styles.dropdownItemSelected]}
                                        onPress={() => { setValue("departamento", dep.name); setValue("municipio", null); setDeptoOpen(false); trigger(["departamento", "municipio"]); }}>
                                        <Text style={[styles.dropdownText, departamento === dep.name && styles.dropdownTextSelected]}>
                                            {dep.name}
                                        </Text>
                                        {departamento === dep.name && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        {errors.departamento && <Text style={styles.errorText}>{errors.departamento.message}</Text>}

                        {/* Municipio */}
                        <TouchableOpacity
                            style={[styles.inputContainer, (!departamento || loadingCities) && { opacity: 0.5 }]}
                            onPress={() => { if (departamento && !loadingCities) { setMunOpen(!munOpen); setDeptoOpen(false); } }}
                            activeOpacity={0.8}>
                            <Ionicons name="location-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: municipio ? "#222" : "#666", paddingVertical: 0 }]}>
                                {loadingCities ? "Cargando..." : (municipio ?? "Municipio")}
                            </Text>
                            {loadingCities ? (
                                <ActivityIndicator size="small" color="#555" />
                            ) : (
                                <Ionicons name={munOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                            )}
                        </TouchableOpacity>
                        {errors.municipio && <Text style={styles.errorText}>{errors.municipio.message}</Text>}
                        {munOpen && Array.isArray(cities) && (
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                {cities.map((city) => (
                                    <TouchableOpacity key={city.id}
                                        style={[styles.dropdownItem, municipio === city.name && styles.dropdownItemSelected]}
                                        onPress={() => { setValue("municipio", city.name); setMunOpen(false); trigger("municipio"); }}>
                                        <Text style={[styles.dropdownText, municipio === city.name && styles.dropdownTextSelected]}>
                                            {city.name}
                                        </Text>
                                        {municipio === city.name && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.nextButton,
                                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                <Text style={styles.nextButtonText}>Siguiente</Text>
                                <Ionicons name="arrow-forward" size={16} color="#333" />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ── PASO 3 — Trabajador (último paso) ── */}
                {step === 3 && role === "trabajador" && (
                    <View style={styles.card}>
                        <Text style={styles.roleTitle}>Centro de acopio y acceso</Text>

                        {/* Dropdown centros de acopio */}
                        <TouchableOpacity style={[styles.inputContainer, errors.centroSeleccionado && styles.inputError]}
                            onPress={() => setCentroOpen(!centroOpen)} activeOpacity={0.8}>
                            <Ionicons name="business-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: centroSeleccionado ? "#222" : "#666", paddingVertical: 0 }]}>
                                {centroSeleccionado
                                    ? centrosAcopio.find(c => c.id === centroSeleccionado)?.nombre
                                    : "Centro de acopio"}
                            </Text>
                            <Ionicons name={centroOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                        </TouchableOpacity>
                        {errors.centroSeleccionado && <Text style={styles.errorText}>{errors.centroSeleccionado.message}</Text>}
                        {centroOpen && (
                            <View style={styles.dropdown}>
                                {centrosAcopio.map((centro) => (
                                    <TouchableOpacity key={centro.id}
                                        style={[styles.dropdownItem, centroSeleccionado === centro.id && styles.dropdownItemSelected]}
                                        onPress={() => { setValue("centroSeleccionado", centro.id); setCentroOpen(false); trigger("centroSeleccionado"); }}>
                                        <Text style={[styles.dropdownText, centroSeleccionado === centro.id && styles.dropdownTextSelected]}>
                                            {centro.nombre}
                                        </Text>
                                        {centroSeleccionado === centro.id && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Contraseña */}
                        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Contraseña" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur}
                                        secureTextEntry={!showPassword} autoCapitalize="none" />
                                )} />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

                        {/* Confirmar contraseña */}
                        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Confirmar contraseña" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur}
                                        secureTextEntry={!showConfirm} autoCapitalize="none" />
                                )} />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleRegister} disabled={loading}
                                style={({ pressed }) => [styles.registerButton,
                                { opacity: pressed || loading ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                {loading ? (
                                    <ActivityIndicator color="#333" />
                                ) : (
                                    <Text style={styles.registerButtonText}>REGISTRARSE</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ── PASO 4 — Ubicación (productor / acopio) ── */}
                {step === 4 && (role === "productor" || role === "acopio") && (
                    <View style={styles.card}>
                        <Text style={styles.roleTitle}>Ubicación</Text>

                        <View style={[styles.inputContainer, errors.direccion && styles.inputError]}>
                            <Ionicons name="home-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="direccion"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Dirección" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="words" />
                                )} />
                        </View>
                        {errors.direccion && <Text style={styles.errorText}>{errors.direccion.message}</Text>}

                        <Pressable
                            onPress={async () => {
                                const dir = getValues("direccion");
                                const mun = getValues("municipio");
                                const dep = getValues("departamento");
                                if (!dir?.trim() || !mun || !dep) {
                                    Alert.alert("Faltan datos", "Completa departamento, municipio y dirección primero.");
                                    return;
                                }
                                setGeocoding(true);
                                try {
                                    const result = await geocodeAddress(dir, mun, dep);
                                    if (result) {
                                        setValue("latitud", String(result.lat));
                                        setValue("longitud", String(result.lng));
                                    } else {
                                        Alert.alert("No encontrado", "No se pudo determinar la ubicación. Puedes continuar e ingresarla después.");
                                    }
                                } catch {
                                    Alert.alert("Error", "No se pudo conectar con el servicio de mapas.");
                                } finally {
                                    setGeocoding(false);
                                }
                            }}
                            disabled={geocoding}
                            style={({ pressed }) => [styles.geoButton,
                            { opacity: pressed || geocoding ? 0.7 : 1 }]}
                        >
                            {geocoding ? (
                                <ActivityIndicator color="#333" />
                            ) : (
                                <>
                                    <Ionicons name="locate-outline" size={18} color="#333" />
                                    <Text style={styles.geoButtonText}>Obtener ubicación</Text>
                                </>
                            )}
                        </Pressable>

                        {latitud && longitud && (
                            <View style={styles.coordsContainer}>
                                <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
                                <Text style={styles.coordsText}>
                                    Lat: {Number(latitud).toFixed(4)}, Lng: {Number(longitud).toFixed(4)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.nextButton,
                                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                <Text style={styles.nextButtonText}>Siguiente</Text>
                                <Ionicons name="arrow-forward" size={16} color="#333" />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ── PASO 5 — Contraseña (productor / acopio, último paso) ── */}
                {step === 5 && (role === "productor" || role === "acopio") && (
                    <View style={styles.card}>
                        <Text style={styles.roleTitle}>Crea tu contraseña</Text>

                        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Contraseña" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur}
                                        secureTextEntry={!showPassword} autoCapitalize="none" />
                                )} />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

                        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Controller control={control} name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput placeholder="Confirmar contraseña" style={styles.input} placeholderTextColor="#666"
                                        value={value} onChangeText={onChange} onBlur={onBlur}
                                        secureTextEntry={!showConfirm} autoCapitalize="none" />
                                )} />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleRegister} disabled={loading}
                                style={({ pressed }) => [styles.registerButton,
                                { opacity: pressed || loading ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                {loading ? (
                                    <ActivityIndicator color="#333" />
                                ) : (
                                    <Text style={styles.registerButtonText}>REGISTRARSE</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: "rgba(255,255,255,0.7)",
        borderRadius: 20,
        padding: 8,
    },
    container: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        paddingTop: 100,
        paddingBottom: 40,
    },
    stepsContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#ccc",
    },
    stepDotActive: {
        backgroundColor: "#555",
        width: 24,
    },
    stepDotDone: {
        backgroundColor: "#888",
    },
    card: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 20,
        padding: 25,
        gap: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ddd",
        borderRadius: 20,
        paddingHorizontal: 15,
        minHeight: 55,
        paddingVertical: 5,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: "#222" },
    inputError: { borderWidth: 1.5, borderColor: "#e74c3c" },
    errorText: { color: "#e74c3c", fontSize: 12, marginTop: -8, marginBottom: 4, marginLeft: 5 },
    nextRow: { alignItems: "flex-end" },
    nextButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#ddd",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    nextButtonText: { fontWeight: "bold", fontSize: 14, color: "#333" },
    divider: { height: 1, backgroundColor: "#ddd", marginVertical: 4 },
    socialText: { textAlign: "center", fontSize: 13, color: "#666" },
    socialRow: { alignItems: "center" },
    socialButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    dropdown: {
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        overflow: "hidden",
        marginTop: -8,
    },
    dropdownScroll: {
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        maxHeight: 180,
        marginTop: -8,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    dropdownItemSelected: { backgroundColor: "#f0f0f0" },
    dropdownText: { fontSize: 14, color: "#444" },
    dropdownTextSelected: { fontWeight: "bold", color: "#222" },
    roleTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: -4 },
    radioRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#aaa",
        alignItems: "center",
        justifyContent: "center",
    },
    radioOuterSelected: { borderColor: "#555" },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#555" },
    radioLabel: { fontSize: 14, color: "#333" },
    navRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    prevButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#ddd",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    prevButtonText: { fontWeight: "bold", fontSize: 14, color: "#333" },
    registerButton: {
        backgroundColor: "#ccc",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    registerButtonText: { fontWeight: "bold", fontSize: 15, color: "#222" },
    geoButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#ddd",
        paddingVertical: 14,
        borderRadius: 20,
    },
    geoButtonText: { fontWeight: "bold", fontSize: 14, color: "#333" },
    coordsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 5,
    },
    coordsText: { fontSize: 13, color: "#555" },
});