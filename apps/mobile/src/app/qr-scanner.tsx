import { useState, useEffect, useRef } from "react"
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ResponseModal from "../components/ResponseModal"
import { getLote, getFinca, createTransporte, updateLote, LoteDto, FincaDto } from "../infrastructure/ordenosApi"

const screenHeight = Dimensions.get("window").height

export default function QRScanner() {
    const [permission, requestPermission] = useCameraPermissions()
    const [scanned, setScanned] = useState(false)
    const [qrData, setQrData] = useState<any>(null)
    const [showSheet, setShowSheet] = useState(false)
    const [closing, setClosing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [lote, setLote] = useState<LoteDto | null>(null)
    const [finca, setFinca] = useState<FincaDto | null>(null)
    const [showTransporteForm, setShowTransporteForm] = useState(false)
    const [placa, setPlaca] = useState("")
    const [temperatura, setTemperatura] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [responseModal, setResponseModal] = useState({ visible: false, type: "success" as "success" | "error", title: "", message: "" })
    const translateY = useRef(new Animated.Value(screenHeight)).current

    useEffect(() => {
        if (showSheet) {
            setClosing(false)
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start()
        }
    }, [showSheet, translateY])

    const handleClose = () => {
        setClosing(true)
        Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowSheet(false)
            setScanned(false)
            setQrData(null)
            setLote(null)
            setFinca(null)
            setShowTransporteForm(false)
            setPlaca("")
            setTemperatura("")
            setClosing(false)
            translateY.setValue(screenHeight)
        })
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return
        setScanned(true)

        let parsed: any
        try {
            parsed = JSON.parse(data)
        } catch {
            parsed = { raw: data }
        }
        setQrData(parsed)

        const loteId = parsed.idLote ?? parsed.lote_id ?? parsed.lote ?? parsed.id
        const fincaId = parsed.idFinca ?? parsed.finca_origen ?? parsed.finca

        if (loteId) {
            setLoading(true)
            setShowSheet(true)
            try {
                const [loteData, fincaData] = await Promise.all([
                    getLote(loteId),
                    fincaId ? getFinca(fincaId).catch(() => null) : Promise.resolve(null),
                ])
                setLote(loteData)
                setFinca(fincaData)
            } catch {
                setResponseModal({ visible: true, type: "error", title: "Error", message: "No se encontró el lote" })
            } finally {
                setLoading(false)
            }
        } else {
            setShowSheet(true)
        }
    }

    const esAbierto = lote && lote.centroAcopioId === null && lote.transporteId === null

    const handleRegistrarTransporte = async () => {
        if (!lote || !placa) return
        setSubmitting(true)
        try {
            const userJson = await AsyncStorage.getItem("usuario")
            const user = userJson ? JSON.parse(userJson) : null
            const centroAcopioId = user?.centroAcopioId
            if (!centroAcopioId) {
                setResponseModal({ visible: true, type: "error", title: "Error", message: "No tienes un centro de acopio asignado" })
                setSubmitting(false)
                return
            }
            const transporte = await createTransporte(placa, temperatura ? parseInt(temperatura) : null)
            await updateLote(lote.loteId, {
                ordenoId: lote.ordenoId,
                centroAcopioId,
                volumenCapturadoLitros: lote.volumenCapturadoLitros,
                transporteId: transporte.transporteId,
            })
            setResponseModal({ visible: true, type: "success", title: "Éxito", message: "Transporte registrado correctamente" })
            setShowTransporteForm(false)
            setPlaca("")
            setTemperatura("")
            setLote({ ...lote, centroAcopioId, transporteId: transporte.transporteId })
        } catch (e: any) {
            const msg = e?.response?.data?.errors ?? e?.message ?? "Error al registrar transporte"
            setResponseModal({ visible: true, type: "error", title: "Error", message: msg })
        } finally {
            setSubmitting(false)
        }
    }

    if (!permission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.permissionText}>Solicitando permiso de cámara...</Text>
            </View>
        )
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <Ionicons name="camera-outline" size={60} color="#555" />
                <Text style={styles.permissionText}>Se necesita acceso a la cámara para escanear QR</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Dar permiso</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.cameraContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            <View style={styles.overlay}>
                <View style={styles.topOverlay} />
                <View style={styles.middleRow}>
                    <View style={styles.sideOverlay} />
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <View style={styles.sideOverlay} />
                </View>
                <View style={styles.bottomOverlay}>
                    <Text style={styles.scanText}>
                        {scanned ? "✓ QR detectado" : "Apunta al código QR"}
                    </Text>
                    {scanned && (
                        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                            <Text style={styles.rescanBtnText}>Escanear otro</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {(showSheet || closing) && (
                <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
                    <TouchableOpacity style={styles.closeX} onPress={handleClose}>
                        <Ionicons name="close" size={26} color="#666" />
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator size="large" color="#6eaaff" style={{ marginTop: 20 }} />
                    ) : showTransporteForm ? (
                        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%", gap: 12 }}>
                            <Text style={styles.sheetTitle}>Registrar transporte</Text>
                            <Text style={styles.qrLabel}>{lote?.codigo ?? `Lote #${lote?.loteId}`}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Placa del vehículo"
                                placeholderTextColor="#aaa"
                                value={placa}
                                onChangeText={setPlaca}
                                autoCapitalize="characters"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Temperatura inicial (°C) — opcional"
                                placeholderTextColor="#aaa"
                                keyboardType="numeric"
                                value={temperatura}
                                onChangeText={setTemperatura}
                            />
                            <TouchableOpacity
                                style={[styles.submitBtn, (!placa || submitting) && { opacity: 0.5 }]}
                                onPress={handleRegistrarTransporte}
                                disabled={!placa || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Guardar transporte</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowTransporteForm(false)}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    ) : lote ? (
                        <>
                            <Image
                                source={require("../../../../packages/assets/images/VasitoDancing.gif")}
                                style={styles.video}
                                resizeMode="contain"
                            />
                            <Text style={styles.sheetTitle}>
                                {esAbierto ? "Lote disponible" : "Lote en tránsito"}
                            </Text>
                            <View style={styles.qrInfo}>
                                <Text style={styles.qrLabel}>Lote: <Text style={styles.qrValue}>{lote.codigo ?? `#${lote.loteId}`}</Text></Text>
                                {finca && (
                                    <Text style={styles.qrLabel}>Finca: <Text style={styles.qrValue}>{finca.nombre}</Text></Text>
                                )}
                                <Text style={styles.qrLabel}>Volumen: <Text style={styles.qrValue}>{lote.volumenCapturadoLitros} L</Text></Text>
                                {lote.centroAcopioId && (
                                    <Text style={styles.qrLabel}>Centro de acopio: <Text style={styles.qrValue}>#{lote.centroAcopioId}</Text></Text>
                                )}
                                {lote.transporteId && (
                                    <Text style={styles.qrLabel}>Transporte: <Text style={styles.qrValue}>#{lote.transporteId}</Text></Text>
                                )}
                            </View>
                            {esAbierto && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => setShowTransporteForm(true)}>
                                    <Ionicons name="car-outline" size={20} color="#fff" />
                                    <Text style={styles.actionBtnText}>Registrar transporte</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : qrData ? (
                        <>
                            <Image
                                source={require("../../../../packages/assets/images/VasitoDancing.gif")}
                                style={styles.video}
                                resizeMode="contain"
                            />
                            <Text style={styles.sheetTitle}>Código QR</Text>
                            <View style={styles.qrInfo}>
                                <Text style={styles.qrLabel}>Datos: <Text style={styles.qrValue}>{JSON.stringify(qrData)}</Text></Text>
                            </View>
                        </>
                    ) : null}
                </Animated.View>
            )}

            <ResponseModal
                visible={responseModal.visible}
                type={responseModal.type}
                title={responseModal.title}
                message={responseModal.message}
                onClose={() => setResponseModal(prev => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

const FRAME_SIZE = 250
const CORNER_SIZE = 24
const CORNER_THICKNESS = 4

const styles = StyleSheet.create({
    cameraContainer: { flex: 1, backgroundColor: "#000" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 20, backgroundColor: "#fff" },
    permissionText: { textAlign: "center", fontSize: 16, color: "#444", lineHeight: 24 },
    permissionBtn: { backgroundColor: "#6eaaff", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 20 },
    permissionBtnText: { fontWeight: "bold", color: "#fff", fontSize: 16 },
    backBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: "#ccc" },
    backBtnText: { color: "#555", fontSize: 15 },
    backButton: { position: "absolute", top: 50, left: 20, zIndex: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 10 },
    overlay: { flex: 1 },
    topOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
    middleRow: { flexDirection: "row", height: FRAME_SIZE },
    sideOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
    scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE, backgroundColor: "transparent" },
    bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", gap: 16 },
    scanText: { color: "#fff", fontSize: 16, fontWeight: "500" },
    rescanBtn: { backgroundColor: "#6eaaff", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 20 },
    rescanBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
    corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, borderColor: "#6eaaff" },
    topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
    topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
    bottomSheet: { position: "absolute", bottom: 0, width: "100%", height: "55%", backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 20, paddingHorizontal: 24, paddingBottom: 30, alignItems: "center", elevation: 20 },
    closeX: { position: "absolute", top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
    sheetTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#222" },
    qrInfo: { width: "100%", gap: 8, paddingHorizontal: 8 },
    qrLabel: { fontSize: 14, color: "#555" },
    qrValue: { fontSize: 14, color: "#222", fontWeight: "600" },
    video: { width: 120, height: 120, marginBottom: 6, borderRadius: 16 },
    input: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, fontSize: 16, color: "#222", backgroundColor: "#f9f9f9" },
    submitBtn: { width: "100%", backgroundColor: "#27ae60", paddingVertical: 14, borderRadius: 20, alignItems: "center", marginTop: 4 },
    submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    cancelText: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 8 },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2980b9", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, marginTop: 8 },
    actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
})
