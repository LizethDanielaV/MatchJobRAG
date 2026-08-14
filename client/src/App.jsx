import { useState } from 'react';
import StepIndicator from './components/StepIndicator';
import PerfilForm from './components/PerfilForm';
import ResultadosList from './components/ResultadosList';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(datos) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/match/buscar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error('Error del servidor');
      const data = await res.json();
      setResultado(data);
      setStep(2);
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep(1);
    setResultado(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">MatchJobRAG</h1>
            <p className="text-xs text-slate-400">Matching semántico con IA</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <StepIndicator step={step} />

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Analizando tu perfil con IA…</p>
          </div>
        )}

        {!loading && step === 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-1">Cuéntanos sobre ti</h2>
            <p className="text-sm text-slate-500 mb-6">Analizaremos tu perfil para encontrar las vacantes más afines.</p>
            {error && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <PerfilForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}

        {!loading && step === 2 && resultado && (
          <ResultadosList
            perfil={resultado.perfil}
            vacantes={resultado.vacantes}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

export default App;
