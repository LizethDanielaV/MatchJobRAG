function VacanteCard({ score, titulo, empresa, ubicacion, remoto, tags, url }) {
  const porcentaje = Math.round(score * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{titulo}</h3>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{empresa}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${remoto ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {remoto ? 'Remoto' : ubicacion}
        </span>
      </div>

      {tags && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.split(',').slice(0, 4).map((t) => (
            <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.trim()}</span>
          ))}
        </div>
      )}

      <div className="mb-4 mt-auto">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">Afinidad</span>
          <span className="text-xs font-semibold text-blue-600">{porcentaje}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${porcentaje}%` }} />
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg py-2 transition-colors"
      >
        Ver vacante →
      </a>
    </div>
  );
}

export default VacanteCard;
