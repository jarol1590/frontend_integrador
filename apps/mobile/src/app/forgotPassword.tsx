import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ImageBackground,
    Image,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
} from "react-native";
import ResponseModal from "../components/ResponseModal";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from "@proyectointegrador/application";
import { useDependencies } from "../providers/DependencyProvider";

type Method = null | "email" | "sms";

export default function ForgotPassword() {
    const [method, setMethod] = useState<Method>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const { forgotPasswordUseCase } = useDependencies();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const showModal = (type: "success" | "error", title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setLoading(true);
        try {
            if (method === "email") {
                await forgotPasswordUseCase.execute({ email: data.email });
            }
            router.push(`/verify-code?flow=forgot&email=${encodeURIComponent(data.email)}` as any);
        } catch (error: any) {
            showModal("error", "Error", error.message ?? "No se pudo enviar el código.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMethod = (selected: Method) => {
        setMethod(selected);
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../../packages/assets/images/MainBackground.png")}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                imageStyle={{
                    transform: [
                        { scale: 1.5 },
                        { translateY: 285 },
                    ],
                }}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => method ? handleSelectMethod(null) : router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../../../packages/assets/images/ForgotP.png")}
                        style={styles.logo}
                    />
                </View>

                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.subtitle}>
                    {method === null
                        ? "Selecciona cómo quieres recuperar tu contraseña"
                        : method === "email"
                            ? "Ingresa tu correo y te enviaremos un código de verificación"
                            : "Ingresa tu número y te enviaremos un mensaje de texto con el código"}
                </Text>

                <View style={styles.card}>

                    {method === null && (
                        <>
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => handleSelectMethod("email")}
                            >
                                <View style={styles.optionIcon}>
                                    <Ionicons name="mail-outline" size={22} color="#555" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>Recuperar via Email</Text>
                                    <Text style={styles.optionDesc}>
                                        Se enviará un correo electrónico con el código para reestablecer la contraseña
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={() => handleSelectMethod("sms")}
                            >
                                <View style={styles.optionIcon}>
                                    <Ionicons name="chatbubble-outline" size={22} color="#555" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>Recuperar via mensaje de texto</Text>
                                    <Text style={styles.optionDesc}>
                                        Se enviará un mensaje de texto con el código para reestablecer la contraseña
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}


                    {method !== null && (
                        <>
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <Ionicons
                                    name={method === "email" ? "mail-outline" : "phone-portrait-outline"}
                                    size={20}
                                    color="#555"
                                    style={{ marginRight: 10 }}
                                />
                                {method === "email" ? (
                                    <Controller
                                        control={control}
                                        name="email"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput
                                                placeholder="Correo electrónico"
                                                style={styles.input}
                                                placeholderTextColor="#666"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                            />
                                        )}
                                    />
                                ) : (
                                    <TextInput
                                        placeholder="Teléfono"
                                        style={styles.input}
                                        placeholderTextColor="#666"
                                        keyboardType="phone-pad"
                                        autoCapitalize="none"
                                    />
                                )}
                            </View>
                            {errors.email && (
                                <Text style={styles.errorText}>{errors.email.message}</Text>
                            )}

                            <Pressable
                                onPress={method === "email" ? handleSubmit(onSubmit) : () => router.push(`/verify-code?flow=forgot` as any)}
                                disabled={loading}
                                style={({ pressed }) => [
                                    styles.button,
                                    {
                                        transform: [
                                            { scale: pressed ? 0.95 : 1 },
                                            { translateY: pressed ? 2 : 0 },
                                        ],
                                        opacity: pressed || loading ? 0.9 : 1,
                                    },
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#333" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {method === "email" ? "ENVIAR EMAIL" : "ENVIAR SMS"}
                                    </Text>
                                )}
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
            <ResponseModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={() => setModalVisible(false)} />
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
    },

    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 3,
        color: "#222",
    },
    optionDesc: {
        fontSize: 12,
        color: "#666",
        lineHeight: 17,
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 10,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ddd",
        borderRadius: 20,
        paddingHorizontal: 15,
        minHeight: 60,
        paddingVertical: 5,
        marginBottom: 20,
    },
    inputError: { borderWidth: 1.5, borderColor: "#e74c3c" },
    errorText: { color: "#e74c3c", fontSize: 12, marginTop: -16, marginBottom: 12, marginLeft: 5 },
    input: {
        flex: 1,
        fontSize: 16,
    },
    button: {
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
});
