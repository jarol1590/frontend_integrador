"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdEmail, MdSms } from "react-icons/md";
type Method = null | "email" | "sms";

export default function ForgotPasswordPage() {
    const [method, setMethod] = useState<Method>(null);
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            
            console.log(`Enviar código via ${method} a:`, value);
        }, 1000);
    };

    return (
        <main className="min-h-screen flex flex-col md:flex-row">

            {/* ── LADO IZQUIERDO ── */}
            <section className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden bg-white">

                {/* Fondo manchas */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "url('/MainBackground.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "white",
                        transform: "scale(1.5) translateY(10%)",
                    }}
                />

                {/* Círculo con vaca */}
                <div className="relative z-10 w-72 h-72 rounded-full bg-white/60 flex items-center justify-center shadow-lg overflow-hidden">
                    <Image
                        src="/ForgotP.png"
                        alt="Forgot password cow"
                        width={280}
                        height={280}
                        className="object-contain"
                    />
                </div>
            </section>

            {/* ── LADO DERECHO ── */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white min-h-screen">

                {/* Botón volver */}
                <div className="w-full max-w-sm mb-6">
                    <button
                        onClick={() => method ? setMethod(null) : router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-black transition text-sm"
                    >
                        ← Volver
                    </button>
                </div>

                <div className="w-full max-w-sm">
                    <h2 className="text-3xl font-black text-black mb-3 text-center">
                        ¿Olvidaste tu contraseña?
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-8">
                        {method === null
                            ? "Como quisieras recuperar tu cuenta:"
                            : method === "email"
                                ? "Ingresa tu correo y te enviaremos un código de verificación"
                                : "Ingresa tu número y te enviaremos un mensaje de texto con el código"
                        }
                    </p>

                    {/* Selección de método */}
                    {method === null && (
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => { setMethod("email"); setValue(""); }}
                                className="flex items-center gap-4 w-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-2xl px-4 py-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                                    <MdEmail size={20} className="text-gray-600" />
                                </div>

                                <div className="text-left">
                                    <p className="font-bold text-sm text-gray-800">Recuperar via Email</p>
                                    <p className="text-xs text-gray-500">
                                        Se enviará un correo electrónico con el código para reestablecer la contraseña
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setMethod("sms"); setValue(""); }}
                                className="flex items-center gap-4 w-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-2xl px-4 py-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                                    <MdSms size={20} className="text-gray-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-gray-800">Recuperar via mensaje de texto</p>
                                    <p className="text-xs text-gray-500">
                                        Se enviará un mensaje de texto con el código para reestablecer la contraseña
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Input según método */}
                    {method !== null && (
                        <form onSubmit={handleSend} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-500">
                                    {method === "email" ? "Correo electrónico" : "Teléfono"}
                                </label>
                                <input
                                    type={method === "email" ? "email" : "tel"}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={method === "email" ? "Email" : "Número de teléfono"}
                                    className="w-full bg-gray-200 rounded-2xl px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-gray-400 transition"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                                    w-full bg-gray-300 font-bold py-4 rounded-2xl shadow-md tracking-wide
                                    transition-all duration-150
                                    ${isLoading
                                        ? "opacity-70 cursor-not-allowed scale-95"
                                        : "hover:bg-gray-400 active:scale-95 active:translate-y-0.5"
                                    }
                                `}
                            >
                                {isLoading ? "Enviando..." : "ENVIAR"}
                            </button>
                        </form>
                    )}

                    {/* Botón ENVIAR visible cuando no hay método seleccionado — deshabilitado */}
                    {method === null && (
                        <button
                            disabled
                            className="w-full mt-6 bg-gray-200 text-gray-400 font-bold py-4 rounded-2xl shadow-md tracking-wide cursor-not-allowed"
                        >
                            ENVIAR
                        </button>
                    )}
                </div>
            </section>
        </main>
    );
}