import VacanteCard from './VacanteCard';

function ResultadosList({ perfil, vacantes, onBack }) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Perfil analizado por IA</p>
        <div className="flex flex-wrap gap-4 text-sm mb-2">
          <span><span className="text-slate-500">Área: </span><strong className="text-slate-800">{perfil.area}</strong></span>
          <span><span className="text-slate-500">Nivel: </span><strong className="text-slate-800">{perfil.nivel}</strong></span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {perfil.habilidades.map((h) => (
            <span key={h} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{h}</span>
          ))}
        </div>
      </div>

      {vacantes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-1">Sin resultados</p>
          <p className="text-sm">No se encontraron vacantes con alta coincidencia. Intenta ajustar tu perfil.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {vacantes.length} vacante{vacantes.length !== 1 ? 's' : ''} encontrada{vacantes.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vacantes.map((v, i) => (
              <VacanteCard key={`${v.titulo}-${i}`} {...v} />
            ))}
          </div>
        </>
      )}

      <button
        onClick={onBack}
        className="mt-8 text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
      >
        ← Modificar perfil
      </button>
    </div>
  );
}

export default ResultadosList;
