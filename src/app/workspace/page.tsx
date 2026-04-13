"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase"; // Ajusta esta ruta a '../lib/supabase' si te da error local

type PanelType = "ar" | "calibracion" | "perspectiva" | "cuadricula" | null;

// Le quitamos el "export default" y la llamamos WorkspaceContent
function WorkspaceContent() {
    const [imagenUrl, setImagenUrl] = useState<string | null>(null);
    const [archivoOriginal, setArchivoOriginal] = useState<File | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [filtroActivo, setFiltroActivo] = useState(false);
    const [modoRoca, setModoRoca] = useState(false);

    const [panelActivo, setPanelActivo] = useState<PanelType>(null);

    const [escala, setEscala] = useState(1);
    const [rotacionX, setRotacionX] = useState(0);
    const [rotacionY, setRotacionY] = useState(0);
    const [modoCuadricula, setModoCuadricula] = useState(false);
    const [tamanoCuadricula, setTamanoCuadricula] = useState(100);

    const [posicion, setPosicion] = useState({ x: 0, y: 0 });
    const [arrastrando, setArrastrando] = useState(false);
    const [inicioArrastre, setInicioArrastre] = useState({ x: 0, y: 0 });

    const videoRef = useRef<HTMLVideoElement>(null);
    const [modoAR, setModoAR] = useState(false);
    const [opacidad, setOpacidad] = useState(0.5);

    const [escuchando, setEscuchando] = useState(false);
    const recognitionRef = useRef<any>(null);

    const isTouchDevice = () =>
        typeof window !== "undefined" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;

    const abrirPanel = (panel: PanelType) => {
        if (!imagenUrl || modoRoca) return;
        setPanelActivo(panel);
    };

    const togglePanelTouch = (panel: PanelType) => {
        if (!isTouchDevice()) return;
        setPanelActivo((prev) => (prev === panel ? null : panel));
    };

    const searchParams = useSearchParams();
    const projectId = searchParams.get("id");

    useEffect(() => {
        if (projectId) {
            cargarProyectoDesdeBD(projectId);
        }
    }, [projectId]);

    const cargarProyectoDesdeBD = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from("proyectos")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            if (data) {
                setImagenUrl(data.imagen_url);
                setEscala(data.escala);
                setTamanoCuadricula(data.tamano_cuadricula);
                setRotacionX(data.rotacion_x);
                setRotacionY(data.rotacion_y);
                setModoCuadricula(data.modo_cuadricula);
                setFiltroActivo(data.filtro_activo);

                const fakeFile = new File([""], "nube.jpg", { type: "image/jpeg" });
                setArchivoOriginal(fakeFile);
            }
        } catch (error) {
            console.error("Error al cargar el proyecto:", error);
        }
    };

    const manejarSubida = (evento: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = evento.target.files?.[0];
        if (!archivo) return;
        setArchivoOriginal(archivo);
        const urlTemporal = URL.createObjectURL(archivo);
        setImagenUrl(urlTemporal);
        setFiltroActivo(false);
        setEscala(1);
        setRotacionX(0);
        setRotacionY(0);
        setPosicion({ x: 0, y: 0 });
        setOpacidad(0.5);
        setPanelActivo(null);
    };

    const guardarProyecto = async () => {
        if (!imagenUrl) return alert("Sube o abre un plano primero.");
        setGuardando(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión");

            let urlFinal = imagenUrl;

            if (archivoOriginal && archivoOriginal.name !== "nube.jpg") {
                const extension = archivoOriginal.name.split('.').pop() || "jpg";
                const nombreArchivo = `${user.id}-${Date.now()}.${extension}`;
                const { error: uploadError } = await supabase.storage
                    .from('planos')
                    .upload(nombreArchivo, archivoOriginal);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('planos')
                    .getPublicUrl(nombreArchivo);

                urlFinal = publicUrl;
            }

            if (projectId) {
                const { error: dbError } = await supabase
                    .from('proyectos')
                    .update({
                        escala: escala,
                        tamano_cuadricula: tamanoCuadricula,
                        imagen_url: urlFinal,
                        rotacion_x: rotacionX,
                        rotacion_y: rotacionY,
                        modo_cuadricula: modoCuadricula,
                        filtro_activo: filtroActivo
                    })
                    .eq('id', projectId);

                if (dbError) throw dbError;
                alert("¡Cambios actualizados correctamente!");
            } else {
                if (!archivoOriginal || archivoOriginal.name === "nube.jpg") {
                    throw new Error("No hay imagen válida para subir.");
                }
                const { error: dbError } = await supabase
                    .from('proyectos')
                    .insert({
                        user_id: user.id,
                        imagen_url: urlFinal,
                        escala: escala,
                        tamano_cuadricula: tamanoCuadricula,
                        rotacion_x: rotacionX,
                        rotacion_y: rotacionY,
                        modo_cuadricula: modoCuadricula,
                        filtro_activo: filtroActivo
                    });

                if (dbError) throw dbError;
                alert("¡Proyecto nuevo guardado en la nube!");
            }
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setGuardando(false);
        }
    };

    const activarModoRoca = async () => {
        if (!imagenUrl) return alert("Primero sube un plano.");
        try {
            await document.documentElement.requestFullscreen();
            setModoRoca(true);
            setPanelActivo(null);
        } catch (error) {
            console.log(error);
        }
    };

    const desactivarModoRoca = async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
        } catch (error) {
            console.log(error);
        }
        setModoRoca(false);
    };

    useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement) setModoRoca(false);
        };
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const alternarAR = async () => {
        if (!modoAR) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                if (videoRef.current) videoRef.current.srcObject = stream;
                setModoAR(true);
                setPanelActivo("ar");
            } catch {
                alert("No se pudo acceder a la cámara.");
            }
        } else {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((t) => t.stop());
                videoRef.current.srcObject = null;
            }
            setModoAR(false);
            if (panelActivo === "ar") setPanelActivo(null);
        }
    };

    const alternarVoz = () => {
        if (escuchando) {
            recognitionRef.current?.stop();
            setEscuchando(false);
            return;
        }

        const w = window as any;
        const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Tu navegador no soporta comandos de voz. Intenta usar Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const ultimo = event.results.length - 1;
            const comando = event.results[ultimo][0].transcript.toLowerCase().trim();

            if (comando.includes("derecha")) {
                setPosicion((p) => ({ ...p, x: p.x - tamanoCuadricula }));
            } else if (comando.includes("izquierda")) {
                setPosicion((p) => ({ ...p, x: p.x + tamanoCuadricula }));
            } else if (comando.includes("arriba")) {
                setPosicion((p) => ({ ...p, y: p.y + tamanoCuadricula }));
            } else if (comando.includes("abajo")) {
                setPosicion((p) => ({ ...p, y: p.y - tamanoCuadricula }));
            } else if (comando.includes("centrar") || comando.includes("centro")) {
                setPosicion({ x: 0, y: 0 });
            }
        };

        recognition.onerror = (event: any) => {
            console.log("Error de voz: ", event.error);
            setEscuchando(false);
        };

        recognition.onend = () => setEscuchando(false);

        recognition.start();
        recognitionRef.current = recognition;
        setEscuchando(true);
    };

    useEffect(() => {
        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((t) => t.stop());
            }
            recognitionRef.current?.stop();
        };
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        if (modoRoca) return;
        setArrastrando(true);
        setInicioArrastre({ x: e.clientX - posicion.x, y: e.clientY - posicion.y });
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!arrastrando || modoRoca) return;
        setPosicion({ x: e.clientX - inicioArrastre.x, y: e.clientY - inicioArrastre.y });
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (modoRoca) return;
        const touch = e.touches[0];
        setArrastrando(true);
        setInicioArrastre({ x: touch.clientX - posicion.x, y: touch.clientY - posicion.y });
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!arrastrando || modoRoca) return;
        const touch = e.touches[0];
        setPosicion({ x: touch.clientX - inicioArrastre.x, y: touch.clientY - inicioArrastre.y });
    };

    const panelBase = "absolute left-20 bg-slate-800 p-6 rounded-2xl border border-slate-600 shadow-2xl z-30 w-80";

    return (
        <div className="flex h-screen bg-slate-900 text-white relative overflow-hidden">
            {escuchando && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
                    🎙️ Escuchando comandos...
                </div>
            )}

            {modoRoca && (
                <div className="absolute inset-0 z-50 flex items-start justify-end p-8">
                    <button onDoubleClick={desactivarModoRoca} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700">
                        🔒 Desbloquear
                    </button>
                </div>
            )}

            <aside className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 gap-6 shadow-xl z-50 relative overflow-y-auto">
                <Link href="/dashboard" className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors" title="Mis Proyectos">📂</Link>
                <div className="w-8 h-px bg-slate-700" />
                <button onClick={activarModoRoca} className="p-3 rounded-xl bg-slate-700 hover:bg-blue-600">🪨</button>
                <button onClick={alternarVoz} className={`p-3 rounded-xl ${escuchando ? 'bg-red-600 animate-pulse' : 'bg-slate-700 hover:bg-red-600'}`}>🎤</button>
                <button onClick={alternarAR} onMouseEnter={() => abrirPanel("ar")} onClickCapture={() => togglePanelTouch("ar")} className={`p-3 rounded-xl ${modoAR ? 'bg-purple-600' : 'bg-slate-700 hover:bg-purple-600'}`}>📷</button>
                <button onMouseEnter={() => abrirPanel("calibracion")} onClick={() => togglePanelTouch("calibracion")} className="p-3 rounded-xl bg-slate-700 hover:bg-blue-600">📏</button>
                <button onMouseEnter={() => abrirPanel("perspectiva")} onClick={() => togglePanelTouch("perspectiva")} className="p-3 rounded-xl bg-slate-700 hover:bg-blue-600">📐</button>
                <button onMouseEnter={() => abrirPanel("cuadricula")} onClick={() => { setModoCuadricula(!modoCuadricula); togglePanelTouch("cuadricula"); }} className={`p-3 rounded-xl ${modoCuadricula ? 'bg-blue-600' : 'bg-slate-700 hover:bg-blue-600'}`}>🔲</button>
                <button onClick={() => setFiltroActivo(!filtroActivo)} className={`p-3 rounded-xl ${filtroActivo ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>🖋️</button>
                <button
                    onClick={guardarProyecto}
                    disabled={guardando}
                    className={`p-3 rounded-xl transition-colors ${guardando ? 'bg-green-600 animate-pulse' : 'bg-slate-700 hover:bg-green-600'}`}
                    title="Guardar Proyecto"
                >
                    {guardando ? '⏳' : '💾'}
                </button>
            </aside>

            {/* PANELES CON BOTONES DE RESETEO */}
            {panelActivo === "ar" && modoAR && (
                <div className={`${panelBase} top-32`} onMouseLeave={() => !isTouchDevice() && setPanelActivo(null)}>
                    <h3 className="font-bold mb-2 text-purple-400">Holograma AR</h3>
                    <input type="range" min="0.1" max="1" step="0.05" value={opacidad} onChange={(e) => setOpacidad(parseFloat(e.target.value))} className="w-full" />
                    <button onClick={() => setOpacidad(0.5)} className="w-full mt-4 text-xs bg-slate-700 py-1 rounded hover:bg-slate-600">Restablecer Opacidad</button>
                </div>
            )}

            {panelActivo === "calibracion" && imagenUrl && (
                <div className={`${panelBase} top-48`} onMouseLeave={() => !isTouchDevice() && setPanelActivo(null)}>
                    <h3 className="font-bold mb-2">Calibrador</h3>
                    <input type="range" min="0.1" max="3" step="0.01" value={escala} onChange={(e) => setEscala(parseFloat(e.target.value))} className="w-full" />
                    <button onClick={() => { setEscala(1); setPosicion({ x: 0, y: 0 }); }} className="w-full mt-4 text-xs bg-slate-700 py-1 rounded hover:bg-slate-600">Restablecer Escala</button>
                </div>
            )}

            {panelActivo === "perspectiva" && imagenUrl && (
                <div className={`${panelBase} top-64`} onMouseLeave={() => !isTouchDevice() && setPanelActivo(null)}>
                    <h3 className="font-bold mb-2">Perspectiva</h3>
                    <input type="range" min="-60" max="60" value={rotacionX} onChange={(e) => setRotacionX(parseFloat(e.target.value))} className="w-full mb-3" />
                    <input type="range" min="-60" max="60" value={rotacionY} onChange={(e) => setRotacionY(parseFloat(e.target.value))} className="w-full" />
                    <button onClick={() => { setRotacionX(0); setRotacionY(0); }} className="w-full mt-4 text-xs bg-slate-700 py-1 rounded hover:bg-slate-600">Restablecer Inclinación</button>
                </div>
            )}

            {panelActivo === "cuadricula" && imagenUrl && (
                <div className={`${panelBase} top-80`} onMouseLeave={() => !isTouchDevice() && setPanelActivo(null)}>
                    <h3 className="font-bold mb-2">Cuadrícula</h3>
                    <input type="range" min="50" max="300" step="10" value={tamanoCuadricula} onChange={(e) => setTamanoCuadricula(parseFloat(e.target.value))} className="w-full" />
                    <button onClick={() => setTamanoCuadricula(100)} className="w-full mt-4 text-xs bg-slate-700 py-1 rounded hover:bg-slate-600">Restablecer Tamaño</button>
                </div>
            )}

            <main className="flex-1 flex items-center justify-center relative bg-slate-950 overflow-hidden">
                {!imagenUrl ? (
                    <label className="cursor-pointer text-center border-2 border-dashed border-slate-700 w-full max-w-2xl h-96 flex flex-col items-center justify-center rounded-2xl">
                        <span className="text-5xl mb-4">📁</span>
                        <p>Sube tu plano</p>
                        <input type="file" accept="image/*" className="hidden" onChange={manejarSubida} />
                    </label>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full object-cover ${modoAR ? "block" : "hidden"}`} />

                        {modoCuadricula && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-80">
                                <div className="w-6 h-px bg-red-500 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2"></div>
                                <div className="w-px h-6 bg-red-500 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"></div>
                            </div>
                        )}

                        <div
                            className={`relative w-full h-full flex items-center justify-center z-10 ${modoAR ? "bg-transparent" : "bg-black/40"}`}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={() => setArrastrando(false)}
                            onMouseLeave={() => setArrastrando(false)}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={() => setArrastrando(false)}
                        >
                            <div
                                style={{
                                    transform: `translate(${posicion.x}px, ${posicion.y}px) scale(${escala}) perspective(1000px) rotateX(${rotacionX}deg) rotateY(${rotacionY}deg)`,
                                    transformOrigin: "center center",
                                    opacity: modoAR ? opacidad : 1,
                                }}
                                className={`relative transition-all ${arrastrando ? "duration-0" : "duration-500"}`}
                            >
                                <img
                                    src={imagenUrl}
                                    alt="Referencia"
                                    draggable="false"
                                    className={`max-h-[85vh] max-w-[85vw] object-contain shadow-2xl ${filtroActivo ? "grayscale contrast-200 brightness-125" : ""}`}
                                />

                                {modoCuadricula && (
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-60"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
                                            backgroundSize: `${tamanoCuadricula}px ${tamanoCuadricula}px`,
                                            backgroundPosition: "center center"
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

// ESTA ES LA MAGIA DE SUSPENSE QUE EXPORTA TU APP A VERCEL
export default function Workspace() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-slate-900 text-white flex-col gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-semibold animate-pulse">Cargando Mesa de Trabajo...</p>
            </div>
        }>
            <WorkspaceContent />
        </Suspense>
    );
}