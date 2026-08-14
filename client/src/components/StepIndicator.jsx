function StepIndicator({ step }) {
  const active = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-blue-600 text-white';
  const inactive = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-200 text-slate-500';

  return (
    <div className="flex items-center justify-center mb-8">
      <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
        <div className={step === 1 ? active : inactive}>1</div>
        <span className="text-sm font-medium">Tu perfil</span>
      </div>
      <div className="w-16 h-px bg-slate-200 mx-4" />
      <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
        <div className={step === 2 ? active : inactive}>2</div>
        <span className="text-sm font-medium">Vacantes</span>
      </div>
    </div>
  );
}

export default StepIndicator;
