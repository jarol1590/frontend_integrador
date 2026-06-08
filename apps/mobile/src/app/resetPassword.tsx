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
    Alert,
    ActivityIndicator,
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

export default function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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

    const onSubmit = async (data: ResetPasswordFormData) => {
        setLoading(true);
        try {
            await resetPasswordUseCase.execute({
                token: data.token,
                newPassword: data.newPassword,
            });
            Alert.alert("Éxito", "Contraseña actualizada correctamente.", [
                { text: "OK", onPress: () => router.replace("/login") },
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message ?? "No se pudo restablecer la contraseña.");
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
