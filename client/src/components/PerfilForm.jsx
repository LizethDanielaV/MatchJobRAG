import { useState } from 'react';

const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function PerfilForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ genero: '', edad: '', estudios: '', orientacion: '', experiencia: '' });
  const [habilidades, setHabilidades] = useState([]);
  const [habilidadInput, setHabilidadInput] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addHabilidad = (e) => {
    if (e.key === 'Enter' && habilidadInput.trim()) {
      e.preventDefault();
      const nueva = habilidadInput.trim();
      if (!habilidades.includes(nueva)) setHabilidades([...habilidades, nueva]);
      setHabilidadInput('');
    }
  };

  const removeHabilidad = (h) => setHabilidades(habilidades.filter((x) => x !== h));

  const isValid = Object.values(form).every((v) => v !== '') && habilidades.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ ...form, edad: Number(form.edad), habilidades });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
          <select name="genero" value={form.genero} onChange={handleChange} className={inputClass}>
            <option value="">Selecciona...</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Edad</label>
          <input type="number" name="edad" value={form.edad} onChange={handleChange} min="15" max="60" placeholder="21" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Estudios</label>
        <input type="text" name="estudios" value={form.estudios} onChange={handleChange} placeholder="Ej: Ingeniería de Sistemas en curso (6° semestre)" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Orientación</label>
        <select name="orientacion" value={form.orientacion} onChange={handleChange} className={inputClass}>
          <option value="">Selecciona tu área...</option>
          {['backend', 'frontend', 'fullstack', 'datos', 'QA', 'cloud', 'seguridad', 'mobile'].map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Experiencia</label>
        <textarea name="experiencia" value={form.experiencia} onChange={handleChange} rows={3} placeholder="Ej: proyectos académicos con Node.js y bases de datos relacionales" className={`${inputClass} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Habilidades <span className="text-slate-400 font-normal">(presiona Enter para añadir)</span>
        </label>
        <div className="border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 min-h-[44px] flex flex-wrap gap-2">
          {habilidades.map((h) => (
            <span key={h} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-md">
              {h}
              <button type="button" onClick={() => removeHabilidad(h)} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
            </span>
          ))}
          <input
            type="text"
            value={habilidadInput}
            onChange={(e) => setHabilidadInput(e.target.value)}
            onKeyDown={addHabilidad}
            placeholder={habilidades.length === 0 ? 'JavaScript, Node.js, SQL...' : ''}
            className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
      >
        {loading ? 'Buscando...' : 'Buscar vacantes →'}
      </button>
    </form>
  );
}

export default PerfilForm;
