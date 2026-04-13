"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase" // Nuestro puente a la base de datos

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

    // Función para INICIAR SESIÓN
    const manejarLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setMensaje({ texto: "", tipo: "" });

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMensaje({ texto: "Error: Credenciales incorrectas.", tipo: "error" });
        } else {
            setMensaje({ texto: "¡Ingreso exitoso! Redirigiendo...", tipo: "exito" });
            router.push("/workspace"); // Si todo sale bien, lo enviamos a la Mesa de Trabajo
        }
        setCargando(false);
    };

    // Función para REGISTRARSE
    const manejarRegistro = async (e: React.FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setMensaje({ texto: "", tipo: "" });

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setMensaje({ texto: `Error: ${error.message}`, tipo: "error" });
        } else {
            setMensaje({ texto: "¡Cuenta creada! Ya puedes iniciar sesión.", tipo: "exito" });
        }
        setCargando(false);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">

                {/* Encabezado */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <span className="text-2xl text-white font-bold">A</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Bienvenido a Appulso</h1>
                    <p className="text-slate-500 text-sm mt-1">Ingresa para guardar tus planos</p>
                </div>

                {/* Formulario */}
                <form className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                            placeholder="estudiante@arquitectura.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Mensajes de error o éxito */}
                    {mensaje.texto && (
                        <div className={`p-3 rounded-lg text-sm text-center font-medium ${mensaje.tipo === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="pt-2 flex flex-col gap-3">
                        <button
                            onClick={manejarLogin}
                            disabled={cargando}
                            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {cargando ? "Cargando..." : "Iniciar Sesión"}
                        </button>

                        <button
                            onClick={manejarRegistro}
                            disabled={cargando}
                            className="w-full bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
                        >
                            Crear nueva cuenta
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-blue-600 hover:underline">
                        ← Volver al inicio
                    </Link>
                </div>

            </div>
        </div>
    );
}