// app/register.tsx
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IdType = "CC" | "Pasaporte" | "NIT" | null;
type Role = "productor" | "acopio" | "trabajador" | null;


const departamentos: string[] = [
    "Antioquia", "Atlántico", "Bolívar", "Boyacá", "Caldas",
    "Caquetá", "Cauca", "Cesar", "Córdoba", "Cundinamarca",
    "Chocó", "Huila", "La Guajira", "Magdalena", "Meta",
    "Nariño", "Norte de Santander", "Quindío", "Risaralda",
    "Santander", "Sucre", "Tolima", "Valle del Cauca",
];


const getMunicipios = (dep: string | null): string[] =>
    dep ? [`Municipio 1 de ${dep}`, `Municipio 2 de ${dep}`, `Municipio 3 de ${dep}`] : [];


const centrosAcopio = [
    { id: "1", nombre: "Centro Acopio Norte" },
    { id: "2", nombre: "Centro Acopio Sur" },
    { id: "3", nombre: "Centro Acopio Central" },
];

export default function Register() {
    const [step, setStep] = useState(1);

    // Paso 1
    const [nombres, setNombres] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [telefono, setTelefono] = useState("");

    // Paso 2
    const [correo, setCorreo] = useState("");
    const [idType, setIdType] = useState<IdType>(null);
    const [idNumber, setIdNumber] = useState("");
    const [role, setRole] = useState<Role>(null);
    const [dropdownIdOpen, setDropdownIdOpen] = useState(false);

    // Paso 3 - productor/acopio
    const [nombreLugar, setNombreLugar] = useState(""); // finca o centro de acopio
    const [departamento, setDepartamento] = useState<string | null>(null);
    const [municipio, setMunicipio] = useState<string | null>(null);
    const [deptoOpen, setDeptoOpen] = useState(false);
    const [munOpen, setMunOpen] = useState(false);

    // Paso 3 - trabajador
    const [centroSeleccionado, setCentroSeleccionado] = useState<string | null>(null);
    const [centroOpen, setCentroOpen] = useState(false);

    // Paso 4 - ubicación
    const [direccion, setDireccion] = useState("");
    const [latitud, setLatitud] = useState("");
    const [longitud, setLongitud] = useState("");

    // Paso 5 / último - contraseña
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const idTypes: IdType[] = ["CC", "Pasaporte", "NIT"];

    const totalSteps = role === "trabajador" ? 3 : 5;

    const handleNext = () => {
        if (step === 1) {
            if (!nombres.trim() || !apellidos.trim() || !telefono.trim()) return;
            setStep(2);
        } else if (step === 2) {
            if (!correo.trim() || !idType || !idNumber.trim() || !role) return;
            setStep(3);
        } else if (step === 3) {
            if (role === "trabajador") return; // último paso, no hay siguiente
            if (!nombreLugar.trim() || !departamento || !municipio) return;
            setStep(4);
        } else if (step === 4) {
            if (!direccion.trim() || !latitud.trim() || !longitud.trim()) return;
            setStep(5);
        }
    };

    const handleBack = () => {
        if (step === 1) router.back();
        else setStep(step - 1);
    };

    const handleRegister = () => {
        if (!password.trim() || password !== confirmPassword) return;
        console.log("Registro completo:", {
            nombres, apellidos, telefono,
            correo, idType, idNumber, role,
            nombreLugar, departamento, municipio,
            direccion, latitud, longitud,
            centroSeleccionado,
        });
        
    };

    const isLastStep =
        (role === "trabajador" && step === 3) ||
        (role !== "trabajador" && step === 5);

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../assets/images/MainBackground.png")}
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
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Nombres" style={styles.input} placeholderTextColor="#666"
                                value={nombres} onChangeText={setNombres} autoCapitalize="words" />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Apellidos" style={styles.input} placeholderTextColor="#666"
                                value={apellidos} onChangeText={setApellidos} autoCapitalize="words" />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="phone-portrait-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Número de teléfono" style={styles.input} placeholderTextColor="#666"
                                value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                        </View>
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
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Correo electrónico" style={styles.input} placeholderTextColor="#666"
                                value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
                        </View>

                        {/* Dropdown tipo ID */}
                        <TouchableOpacity style={styles.inputContainer}
                            onPress={() => setDropdownIdOpen(!dropdownIdOpen)} activeOpacity={0.8}>
                            <Ionicons name="card-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: idType ? "#222" : "#666", paddingVertical: 0 }]}>
                                {idType === "CC" ? "Cédula de ciudadanía (CC)" : idType ?? "Tipo de identificación"}
                            </Text>
                            <Ionicons name={dropdownIdOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                        </TouchableOpacity>
                        {dropdownIdOpen && (
                            <View style={styles.dropdown}>
                                {idTypes.map((type) => (
                                    <TouchableOpacity key={type}
                                        style={[styles.dropdownItem, idType === type && styles.dropdownItemSelected]}
                                        onPress={() => { setIdType(type); setDropdownIdOpen(false); }}>
                                        <Text style={[styles.dropdownText, idType === type && styles.dropdownTextSelected]}>
                                            {type === "CC" ? "Cédula de ciudadanía (CC)" : type}
                                        </Text>
                                        {idType === type && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="id-card-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Número de identificación" style={styles.input} placeholderTextColor="#666"
                                value={idNumber} onChangeText={setIdNumber} keyboardType="number-pad" />
                        </View>

                        <Text style={styles.roleTitle}>Tipo de registro:</Text>
                        {[
                            { value: "productor", label: "Productor", icon: "leaf-outline" },
                            { value: "acopio", label: "Centro de acopio", icon: "business-outline" },
                            { value: "trabajador", label: "Trabajador", icon: "construct-outline" },
                        ].map((item) => (
                            <TouchableOpacity key={item.value} style={styles.radioRow}
                                onPress={() => setRole(item.value as Role)}>
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

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name={role === "productor" ? "leaf-outline" : "business-outline"}
                                size={20} color="#555" style={styles.inputIcon} />
                            <TextInput
                                placeholder={role === "productor" ? "Nombre de la finca" : "Nombre del centro de acopio"}
                                style={styles.input} placeholderTextColor="#666"
                                value={nombreLugar} onChangeText={setNombreLugar} autoCapitalize="words" />
                        </View>

                        {/* Departamento */}
                        <TouchableOpacity style={styles.inputContainer}
                            onPress={() => { setDeptoOpen(!deptoOpen); setMunOpen(false); }} activeOpacity={0.8}>
                            <Ionicons name="map-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: departamento ? "#222" : "#666", paddingVertical: 0 }]}>
                                {departamento ?? "Departamento"}
                            </Text>
                            <Ionicons name={deptoOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                        </TouchableOpacity>
                        {deptoOpen && (
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                {departamentos.map((dep) => (
                                    <TouchableOpacity key={dep}
                                        style={[styles.dropdownItem, departamento === dep && styles.dropdownItemSelected]}
                                        onPress={() => { setDepartamento(dep); setMunicipio(null); setDeptoOpen(false); }}>
                                        <Text style={[styles.dropdownText, departamento === dep && styles.dropdownTextSelected]}>
                                            {dep}
                                        </Text>
                                        {departamento === dep && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Municipio */}
                        <TouchableOpacity
                            style={[styles.inputContainer, !departamento && { opacity: 0.5 }]}
                            onPress={() => { if (departamento) { setMunOpen(!munOpen); setDeptoOpen(false); } }}
                            activeOpacity={0.8}>
                            <Ionicons name="location-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: municipio ? "#222" : "#666", paddingVertical: 0 }]}>
                                {municipio ?? "Municipio"}
                            </Text>
                            <Ionicons name={munOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                        </TouchableOpacity>
                        {munOpen && (
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                {getMunicipios(departamento).map((mun) => (
                                    <TouchableOpacity key={mun}
                                        style={[styles.dropdownItem, municipio === mun && styles.dropdownItemSelected]}
                                        onPress={() => { setMunicipio(mun); setMunOpen(false); }}>
                                        <Text style={[styles.dropdownText, municipio === mun && styles.dropdownTextSelected]}>
                                            {mun}
                                        </Text>
                                        {municipio === mun && <Ionicons name="checkmark" size={16} color="#555" />}
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
                        <TouchableOpacity style={styles.inputContainer}
                            onPress={() => setCentroOpen(!centroOpen)} activeOpacity={0.8}>
                            <Ionicons name="business-outline" size={20} color="#555" style={styles.inputIcon} />
                            <Text style={[styles.input, { color: centroSeleccionado ? "#222" : "#666", paddingVertical: 0 }]}>
                                {centroSeleccionado
                                    ? centrosAcopio.find(c => c.id === centroSeleccionado)?.nombre
                                    : "Centro de acopio"}
                            </Text>
                            <Ionicons name={centroOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                        </TouchableOpacity>
                        {centroOpen && (
                            <View style={styles.dropdown}>
                                {centrosAcopio.map((centro) => (
                                    <TouchableOpacity key={centro.id}
                                        style={[styles.dropdownItem, centroSeleccionado === centro.id && styles.dropdownItemSelected]}
                                        onPress={() => { setCentroSeleccionado(centro.id); setCentroOpen(false); }}>
                                        <Text style={[styles.dropdownText, centroSeleccionado === centro.id && styles.dropdownTextSelected]}>
                                            {centro.nombre}
                                        </Text>
                                        {centroSeleccionado === centro.id && <Ionicons name="checkmark" size={16} color="#555" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Contraseña */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Contraseña" style={styles.input} placeholderTextColor="#666"
                                value={password} onChangeText={setPassword}
                                secureTextEntry={!showPassword} autoCapitalize="none" />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>

                        {/* Confirmar contraseña */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Confirmar contraseña" style={styles.input} placeholderTextColor="#666"
                                value={confirmPassword} onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm} autoCapitalize="none" />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleRegister}
                                style={({ pressed }) => [styles.registerButton,
                                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                <Text style={styles.registerButtonText}>REGISTRARSE</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ── PASO 4 — Ubicación (productor / acopio) ── */}
                {step === 4 && (role === "productor" || role === "acopio") && (
                    <View style={styles.card}>
                        <Text style={styles.roleTitle}>Ubicación</Text>

                        <View style={styles.inputContainer}>
                            <Ionicons name="home-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Dirección" style={styles.input} placeholderTextColor="#666"
                                value={direccion} onChangeText={setDireccion} autoCapitalize="words" />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="navigate-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Latitud" style={styles.input} placeholderTextColor="#666"
                                value={latitud} onChangeText={setLatitud} keyboardType="decimal-pad" />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="navigate-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Longitud" style={styles.input} placeholderTextColor="#666"
                                value={longitud} onChangeText={setLongitud} keyboardType="decimal-pad" />
                        </View>

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

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Contraseña" style={styles.input} placeholderTextColor="#666"
                                value={password} onChangeText={setPassword}
                                secureTextEntry={!showPassword} autoCapitalize="none" />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                            <TextInput placeholder="Confirmar contraseña" style={styles.input} placeholderTextColor="#666"
                                value={confirmPassword} onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm} autoCapitalize="none" />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.navRow}>
                            <Pressable onPress={handleBack}
                                style={({ pressed }) => [styles.prevButton, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name="arrow-back" size={16} color="#333" />
                                <Text style={styles.prevButtonText}>Anterior</Text>
                            </Pressable>
                            <Pressable onPress={handleRegister}
                                style={({ pressed }) => [styles.registerButton,
                                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                                <Text style={styles.registerButtonText}>REGISTRARSE</Text>
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
});