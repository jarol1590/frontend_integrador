"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);

        }, 1000);
    };

    const handleForgotPassword = () => {
        router.push("/forgot-password");
    };
    return (
        <main className="min-h-screen flex flex-col md:flex-row">

            {/* ── LADO IZQUIERDO ── */}
            <section className="hidden md:flex md:w-1/2 relative items-end justify-start overflow-hidden bg-white">

                {/* Fondo manchas */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "url('/MainBackground.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "white",
                        transform: "scale(1.5) translateY(10%)"
                    }}
                />

                {/* Contenido */}
                <div className="relative z-10 flex flex-col justify-between w-full h-full p-10">
                    <h1 className="text-5xl font-black text-black tracking-tight mt-16 ml-16">
                        BIENVENIDO!
                    </h1>

                    {/* HiCOw */}
                    <div className="flex items-end justify-start -ml-35">
                        <Image
                            src="/HiCow.png"
                            alt="Cow icon"
                            width={420}
                            height={420}
                            className="object-contain"
                        />
                    </div>
                </div>
            </section>

            {/* ── LADO DERECHO — formulario ── */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white min-h-screen">

                {/* En móvil se muestra el título arriba del form */}
                <h1 className="text-3xl font-black text-black mb-2 md:hidden">
                    BIENVENIDO!
                </h1>

                <div className="w-full max-w-sm">
                    <h2 className="text-xl font-semibold text-gray-700 mb-8 text-center">
                        Inicio de Sesión
                    </h2>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {/* Email */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-500">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full bg-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 transition"
                            />
                        </div>

                        {/* Contraseña */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-500">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="****"
                                    className="w-full bg-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs"
                                >
                                    {showPassword ? "Ocultar" : "Ver"}
                                </button>
                            </div>
                        </div>

                        {/* Olvidé mi contraseña */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-gray-500 hover:underline"
                            >
                                Olvidé mi contraseña
                            </button>
                        </div>

                        {/* Botón INGRESAR con animación */}
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
                            {isLoading ? "Ingresando..." : "INGRESAR"}
                        </button>

                        {/* Registro */}
                        <p className="text-center text-sm text-gray-500">
                            ¿Aún no tienes cuenta?{" "}
                            <Link
                                href="/register"
                                className="font-bold text-black hover:underline"
                            >
                                Regístrate
                            </Link>
                        </p>
                    </form>
                </div>
            </section>
        </main>
    );
}