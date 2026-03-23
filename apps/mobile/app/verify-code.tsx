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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

export default function VerifyCode() {
    const [code, setCode] = useState(["", "", "", "", ""]);
    const inputs = useRef<(TextInput | null)[]>([]);
    const { flow } = useLocalSearchParams<{ flow: "forgot" | "register" }>();

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

    const handleConfirm = () => {
        const fullCode = code.join("");
        if (fullCode.length < 5) return;
        if (flow === "register") {
            router.push("/dashboard" as any);
        } else {
            router.push("/new-password" as any); // pendiente
            // por ahora para probar:
             router.push("/dashboard" as any);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [
                        { scale: 1.5 },
                        { translateY: 285 },
                    ],
                }}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.container}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../assets/images/ForgotP.png")}
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
                        style={({ pressed }) => [
                            styles.button,
                            {
                                transform: [
                                    { scale: pressed ? 0.95 : 1 },
                                    { translateY: pressed ? 2 : 0 },
                                ],
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                    >
                        <Text style={styles.buttonText}>CONFIRMAR</Text>
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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    logoContainer: {
        width: 200,
        height: 200,
        marginBottom: 80,
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
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
        backgroundColor: "rgba(255,255,255,0.9)",
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