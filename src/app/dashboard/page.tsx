"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Proyecto = {
    id: number;
    imagen_url: string;
    escala: number;
    tamano_cuadricula: number;
    creado_en: string;
};

export default function Dashboard() {
    const router = useRouter();
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarProyectos();
    }, []);

    const cargarProyectos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("proyectos")
                .select("*")
                .eq("user_id", user.id)
                .order("creado_en", { ascending: false });

            if (error) throw error;
            if (data) setProyectos(data);

        } catch (error) {
            console.error("Error cargando proyectos:", error);
        } finally {
            setCargando(false);
        }
    };

    // ==========================================
    // NUEVO: FUNCIÓN PARA BORRAR PROYECTO
    // ==========================================
    const borrarProyecto = async (id: number, imagenUrl: string) => {
        const confirmar = window.confirm("¿Estás seguro de que deseas borrar este plano permanentemente?");
        if (!confirmar) return;

        try {
            // 1. Borramos la fila de la base de datos
            const { error: dbError } = await supabase
                .from("proyectos")
                .delete()
                .eq("id", id);

            if (dbError) throw dbError;

            // 2. Extraemos el nombre del archivo de la URL para borrarlo del Storage (Cajón)
            const urlParts = imagenUrl.split("/");
            const nombreArchivo = urlParts[urlParts.length - 1];

            await supabase.storage.from("planos").remove([nombreArchivo]);

            // 3. Actualizamos la pantalla borrando esa tarjeta
            setProyectos(proyectos.filter((p) => p.id !== id));

        } catch (error) {
            console.error("Error al borrar:", error);
            alert("No se pudo borrar el proyecto.");
        }
    };

    const cerrarSesion = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">A</span>
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-800">Mis Proyectos</h1>
                </div>

                <div className="flex gap-4">
                    <Link href="/workspace" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                        + Nuevo Plano
                    </Link>
                    <button onClick={cerrarSesion} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 py-10">
                {cargando ? (
                    <div className="text-center text-slate-500 mt-20 animate-pulse">
                        <p className="text-xl">Cargando tus planos...</p>
                    </div>
                ) : proyectos.length === 0 ? (
                    <div className="text-center mt-20 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                        <span className="text-6xl mb-4 block">📭</span>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Aún no tienes planos</h2>
                        <p className="text-slate-500 mb-6">Sube tu primer plano a la Mesa de Trabajo para empezar a calcar.</p>
                        <Link href="/workspace" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                            Ir a la Mesa de Trabajo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {proyectos.map((proyecto) => (
                            <div key={proyecto.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">

                                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={proyecto.imagen_url} alt="Plano guardado" className="max-h-full max-w-full object-contain" />
                                </div>

                                <div className="p-5 border-t border-slate-100 flex flex-col flex-grow">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                                            Escala: {(proyecto.escala * 100).toFixed(0)}%
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(proyecto.creado_en).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Cuadrícula: {proyecto.tamano_cuadricula}px
                                    </p>

                                    {/* NUEVO: BOTONES DE ACCIÓN */}
                                    <div className="mt-auto flex gap-2 pt-2 border-t border-slate-50">
                                        <Link
                                            href={`/workspace?id=${proyecto.id}`}
                                            className="flex-1 text-center bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                            Abrir
                                        </Link>
                                        <button
                                            onClick={() => borrarProyecto(proyecto.id, proyecto.imagen_url)}
                                            className="flex-1 text-center bg-red-50 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            Borrar
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}