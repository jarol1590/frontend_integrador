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
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    resetPasswordSchema,
    type ResetPasswordFormData,
} from "@proyectointegrador/application";
import { useDependencies } from "../providers/DependencyProvider";
import ResponseModal from "../components/ResponseModal";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const { resetPasswordUseCase } = useDependencies();
    const { token: codeParam } = useLocalSearchParams<{ token: string }>();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { token: codeParam ?? "", newPassword: "", confirmPassword: "" },
    });

    const showModal = (type: "success" | "error", title: string, message: string, onClose?: () => void) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
        if (onClose) {
            setModalCloseCallback(() => onClose);
        }
    };

    const [modalCloseCallback, setModalCloseCallback] = useState<(() => void) | null>(null);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setLoading(true);
        try {
            await resetPasswordUseCase.execute({
                token: data.token,
                newPassword: data.newPassword,
            });
            showModal("success", "Éxito", "Contraseña actualizada correctamente.", () => router.replace("/login"));
        } catch (error: any) {
            showModal("error", "Error", error.message ?? "No se pudo restablecer la contraseña.");
        } finally {
            setLoading(false);
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
                        { translateY: 330},
                    ],
                }}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../../../packages/assets/images/ForgotP.png")}
                        style={styles.logo}
                    />
                </View>

                <Text style={styles.title}>Restablecer contraseña</Text>
                <Text style={styles.subtitle}>
                    Ingresa tu nueva contraseña
                </Text>

                <View style={styles.card}>

                    <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#555"
                            style={{ marginRight: 10 }}
                        />
                        <Controller
                            control={control}
                            name="newPassword"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    placeholder="Nueva contraseña"
                                    style={styles.input}
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                />
                            )}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#555"
                            />
                        </Pressable>
                    </View>
                    {errors.newPassword && (
                        <Text style={styles.errorText}>{errors.newPassword.message}</Text>
                    )}

                    <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#555"
                            style={{ marginRight: 10 }}
                        />
                        <Controller
                            control={control}
                            name="confirmPassword"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    placeholder="Confirmar contraseña"
                                    style={styles.input}
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                />
                            )}
                        />
                    </View>
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                    )}

                    <Pressable
                        onPress={handleSubmit(onSubmit)}
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
                            <Text style={styles.buttonText}>RESTABLECER CONTRASEÑA</Text>
                        )}
                    </Pressable>
                </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <ResponseModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={() => { setModalVisible(false); modalCloseCallback?.(); setModalCloseCallback(null); }} />
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
        backgroundColor: "rgb(255,255,255)",
        borderRadius: 20,
        padding: 25,
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
