// app/verify-code.tsx
import { useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    ImageBackground,
    Image,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDependencies } from "../providers/DependencyProvider";
import ResponseModal from "../components/ResponseModal";

export default function VerifyCode() {
    const [code, setCode] = useState(["", "", "", "", ""]);
    const [verifying, setVerifying] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const inputs = useRef<(TextInput | null)[]>([]);
    const { flow, email } = useLocalSearchParams<{ flow: "forgot" | "register"; email?: string }>();
    const { verifyResetCodeUseCase } = useDependencies();

    const handleChange = (text: string, index: number) => {

        const clean = text.replace(/[^0-9]/g, "");
        const newCode = [...code];
        newCode[index] = clean;
        setCode(newCode);


        if (clean && index < 4) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {

        if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const showModal = (type: "success" | "error", title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    const handleConfirm = async () => {
        const fullCode = code.join("");
        if (fullCode.length < 5) return;
        if (flow === "register") {
            router.push("/dashboard" as any);
        } else {
            setVerifying(true);
            try {
                const token = await verifyResetCodeUseCase.execute(email ?? "", fullCode);
                router.push(`/resetPassword?token=${token}` as any);
            } catch (error: any) {
                showModal("error", "Código inválido", "Código inválido, verifica en tu correo.");
            } finally {
                setVerifying(false);
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            <ImageBackground
                source={require("../../../../packages/assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [
                        { scale: 1.5 },
                        { translateY: 330 },
                    ],
                }}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.container}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require("../../../../packages/assets/images/ForgotP.png")}
                                style={styles.logo}
                            />
                        </View>

                        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                        <Text style={styles.subtitle}>
                            Ingresa el código que enviamos a tu número de teléfono
                        </Text>

                        <View style={styles.card}>
                            {/* Cajitas OTP */}
                            <View style={styles.otpContainer}>
                                {code.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => { inputs.current[index] = ref; }}
                                        style={[
                                            styles.otpInput,
                                            digit ? styles.otpInputFilled : null,
                                        ]}
                                        value={digit}
                                        onChangeText={(text) => handleChange(text, index)}
                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        textAlign="center"
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            {/* Botón confirmar */}
                            <Pressable
                                onPress={handleConfirm}
                                disabled={verifying}
                                style={({ pressed }) => [
                                    styles.button,
                                    {
                                        transform: [
                                            { scale: pressed ? 0.95 : 1 },
                                            { translateY: pressed ? 2 : 0 },
                                        ],
                                        opacity: pressed || verifying ? 0.7 : 1,
                                    },
                                ]}
                            >
                                <Text style={styles.buttonText}>{verifying ? "VERIFICANDO..." : "CONFIRMAR"}</Text>
                            </Pressable>

                            {/* Reenviar código */}
                            <TouchableOpacity onPress={() => console.log("Reenviar código")}>
                                <Text style={styles.resend}>
                                    ¿No recibiste el código?{" "}
                                    <Text style={styles.resendLink}>Reenviar</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <ResponseModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={() => setModalVisible(false)} />
        </SafeAreaView>
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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    logoContainer: {
        width: 200,
        height: 200,
        marginBottom: 16,
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
        marginBottom: 25,
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    card: {
        width: "100%",
        backgroundColor: "rgb(255,255,255)",
        borderRadius: 20,
        padding: 25,
        alignItems: "center",
        gap: 20,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginVertical: 10,
    },
    otpInput: {
        width: 50,
        height: 55,
        backgroundColor: "#ddd",
        borderRadius: 14,
        fontSize: 22,
        fontWeight: "bold",
        color: "#222",
    },
    otpInputFilled: {
        backgroundColor: "#ccc",
        borderWidth: 1.5,
        borderColor: "#aaa",
    },
    button: {
        width: "100%",
        backgroundColor: "#ccc",
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    buttonText: {
        fontWeight: "bold",
        fontSize: 16,
    },
    resend: {
        fontSize: 13,
        color: "#555",
        textAlign: "center",
    },
    resendLink: {
        fontWeight: "bold",
        color: "#000",
        textDecorationLine: "underline",
    },
});