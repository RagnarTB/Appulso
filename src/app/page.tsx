import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
          <span className="text-3xl text-white font-bold">A</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
          Appulso
        </h1>
        <p className="text-slate-500 mb-8">
          Tu asistente inteligente para dibujo y calcado arquitectónico.
        </p>

        <Link
          href="/login"
          className="block w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-center"
        >
          Comenzar ahora
        </Link>
      </div>
    </main>
  );
}