import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardCheck, 
  User, 
  Timer, 
  AlertCircle, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  XCircle,
  Play,
  RotateCcw,
  Activity,
  ArrowRight,
  Download,
  Share2,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Filler, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const App = () => {
  const [view, setView] = useState('setup'); 
  const [activeTest, setActiveTest] = useState(0);
  const [showProtocol, setShowProtocol] = useState(null);

  // --- Patient State ---
  const [patient, setPatient] = useState({
    nombre: '', apellido: '', edad: '', peso: '', altura: '', cintura: ''
  });

  // --- Evaluation State ---
  const [results, setResults] = useState({});

  // --- Test Definition ---
  const TEST_LIST = [
    { 
      id: 'tobillo', name: 'Dorsiflexión de Tobillo', category: 'Movilidad', type: 'bilateral', unit: 'cm',
      proto: '• Talón apoyado en suelo.\n• Llevar rodilla a pared.\n• Medir distancia máxima dedo-pared.'
    },
    { 
      id: 'shoulder_mob', name: 'Shoulder Mobility', category: 'Movilidad', type: 'bilateral_qualitative',
      proto: '• Una mano por arriba, otra por abajo.\n• Intentar tocar dedos en espalda.\n• Evaluar simetría y distancia.'
    },
    { 
      id: 'overhead_test', name: 'Overhead Test (Hombro)', category: 'Movilidad', type: 'qualitative_checklist',
      checks: ['Compensa arco lumbar', 'Brazos no alinean orejas', 'Flexión incompleta', 'Asimetría'],
      proto: '• Elevación bilateral de brazos sobre la cabeza.\n• Observar compensaciones lumbares o falta de rango.'
    },
    { 
      id: 'overhead_squat', name: 'Overhead Squat', category: 'Estabilidad', type: 'qualitative_checklist',
      checks: ['Talones se levantan', 'Valgo de rodilla', 'Inclinación de tronco', 'Brazos caen hacia adelante', 'Profundidad limitada', 'Asimetría lateral'],
      proto: '• Sentadilla profunda con brazos arriba.\n• Evaluar estabilidad global y profundidad.'
    },
    { 
      id: 'sls', name: 'Single Leg Stance', category: 'Estabilidad', type: 'bilateral_timer', unit: 'seg',
      proto: '• Equilibrio en un pie, manos en cintura.\n• Detener si pierde postura o toca el suelo.'
    },
    { 
      id: 'sit_stand', name: 'Sit to Stand', category: 'Resistencia', type: 'timer_reps', unit: 'reps', defaultTime: 30,
      proto: '• Máximas repeticiones en 30 segundos.\n• De sentado a parado completo.'
    },
    { 
      id: 'step_test', name: 'Step Test', category: 'Resistencia', type: 'timer_auto', unit: 'pasos', defaultTime: 120,
      proto: '• Marcha en el lugar elevando rodillas.\n• Mantener ritmo durante 2 minutos.'
    },
    { 
      id: 'pushup', name: 'Push-up Adaptado', category: 'Fuerza', type: 'reps_with_height', unit: 'reps',
      proto: '• Ejecución técnica en barra o suelo.\n• Registrar repeticiones y altura de apoyo.'
    },
    { 
      id: 'handgrip', name: 'Handgrip', category: 'Fuerza', type: 'bilateral', unit: 'kg',
      proto: '• Dinamometría manual.\n• Presión máxima sostenida 3 segundos.'
    }
  ];

  const CATEGORIES_INFO = {
    Movilidad: "Rango de movimiento disponible",
    Estabilidad: "Control y calidad del movimiento",
    Resistencia: "Capacidad de sostener esfuerzo",
    Fuerza: "Capacidad de generar tensión"
  };

  // --- Handlers ---
  const updateResult = (id, field, value) => {
    setResults(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const NumericInput = ({ value, onChange, label }) => {

  const [displayVal, setDisplayVal] = useState("");

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayVal(value.toString());
    } else {
      setDisplayVal("");
    }
  }, [value]);

  const handleTextChange = (e) => {
    const newVal = e.target.value;
    setDisplayVal(newVal);

    if (newVal === "") {
      onChange("");
    } else {
      const num = parseFloat(newVal);
      if (!isNaN(num)) onChange(num);
    }
  };

  const step = (amount) => {
    const current = parseFloat(displayVal) || 0;
    const next = Math.max(0, current + amount);
    setDisplayVal(next.toString());
    onChange(next);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{label}</span>}
      <div className="flex items-center bg-zinc-900 rounded-2xl p-1 border border-zinc-800 w-full max-w-[140px]">
        <button
          type="button"
          onClick={() => step(-1)}
          className="w-10 h-10 flex items-center justify-center text-xl font-bold text-[#FDCF01] active:bg-zinc-800 rounded-xl"
        >
          -
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={displayVal}
          onChange={handleTextChange}
          placeholder="0"
          className="w-full bg-transparent text-center font-bold text-xl outline-none text-white appearance-none min-w-0"
        />
        <button
          type="button"
          onClick={() => step(1)}
          className="w-10 h-10 flex items-center justify-center text-xl font-bold text-[#FDCF01] active:bg-zinc-800 rounded-xl"
        >
          +
        </button>
      </div>
    </div>
  );
};


  // --- Evaluation Logic ---
  const report = useMemo(() => {
    const labels = TEST_LIST.map(t => t.name.slice(0, 12));
    const data = TEST_LIST.map(t => {
      const r = results[t.id];
      if (!r || r.invalid) return 0;
      if (r.dolor === 'SI' || r.quality === 'red') return 30;
      if (r.quality === 'yellow') return 60;
      if (r.quality === 'green') return 100;
      return 50;
    });

    const categories = { Movilidad: 100, Estabilidad: 100, Resistencia: 100, Fuerza: 100 };
    let worstTest = null;

    TEST_LIST.forEach(t => {
      const r = results[t.id];
      if (!r) return;
      let score = 100;
      if (r.dolor === 'SI' || r.quality === 'red') score = 30;
      else if (r.quality === 'yellow') score = 60;

      if (score < categories[t.category]) categories[t.category] = score;
      if (score <= 30) worstTest = t.name;
    });

    return { labels, data, categories, worstTest };
  }, [results]);

  // --- Main Views ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              NÚCLE<span className="text-[#FDCF01]">O</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-1">Recupera tu centro</p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Nombre" onChange={e => setPatient({...patient, nombre: e.target.value})} />
              <input className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Apellido" onChange={e => setPatient({...patient, apellido: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Edad" onChange={e => setPatient({...patient, edad: e.target.value})} />
              <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Peso kg" onChange={e => setPatient({...patient, peso: e.target.value})} />
              <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Altura cm" onChange={e => setPatient({...patient, altura: e.target.value})} />
            </div>
            <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] italic text-white" placeholder="Cintura cm (opcional)" onChange={e => setPatient({...patient, cintura: e.target.value})} />
            <button 
              disabled={!patient.nombre || !patient.apellido}
              onClick={() => setView('eval')}
              className="w-full bg-[#FDCF01] text-black disabled:opacity-20 p-5 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all mt-4 uppercase tracking-widest"
            >
              Iniciar Evaluación
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'eval') {
    const t = TEST_LIST[activeTest];
    const r = results[t.id] || {};

    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col">
        <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#000000]/50 backdrop-blur sticky top-0 z-50">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-[#FDCF01] uppercase leading-none tracking-widest">{t.category}</span>
            <span className="font-bold text-xs text-zinc-400 truncate max-w-[140px]">{patient.nombre} {patient.apellido}</span>
          </div>
          <button onClick={() => setShowProtocol(t)} className="p-2 bg-zinc-900 rounded-full border border-zinc-800 text-[#FDCF01]">
            <Info size={18} />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6 max-w-xl mx-auto w-full overflow-y-auto">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-black leading-tight uppercase tracking-tighter text-left text-white">{t.name}</h2>
            {r.invalid && <span className="bg-red-500/20 text-red-500 text-[8px] px-2 py-1 rounded font-bold uppercase tracking-widest shrink-0 mt-2">Excluido</span>}
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 space-y-6">
            {t.type === 'bilateral_qualitative' && (
              <div className="space-y-6">
                {['izq', 'der'].map(side => (
                  <div key={side} className="space-y-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{side === 'izq' ? 'Lado Izquierdo' : 'Lado Derecho'}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Completo', 'Limitado', 'Asimétrico'].map(opt => {
                        const score = opt === 'Completo' ? 'green' : opt === 'Limitado' ? 'yellow' : 'red';
                        return (
                          <button key={opt} onClick={() => updateResult(t.id, side, score)} className={`p-3 rounded-xl text-[9px] font-bold border transition-all ${r[side] === score ? 'bg-[#FDCF01] border-[#FDCF01] text-black' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {t.type === 'bilateral' && (
              <div className="flex justify-between items-center gap-4">
                <NumericInput label="Izquierdo" value={r.izq} onChange={(v) => updateResult(t.id, 'izq', v)} />
                <div className="w-px h-10 bg-zinc-800 shrink-0"></div>
                <NumericInput label="Derecho" value={r.der} onChange={(v) => updateResult(t.id, 'der', v)} />
              </div>
            )}

            {t.type === 'qualitative_checklist' && (
              <div className="grid grid-cols-2 gap-2">
                {t.checks.map(c => (
                  <button key={c} onClick={() => {
                      const list = r.checklist || [];
                      updateResult(t.id, 'checklist', list.includes(c) ? list.filter(i => i !== c) : [...list, c]);
                    }} className={`p-2 rounded-xl text-[9px] font-bold border text-left flex items-center gap-2 ${r.checklist?.includes(c) ? 'bg-[#FDCF01]/10 border-[#FDCF01] text-[#FDCF01]' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>
                    <div className={`w-3 h-3 rounded-sm border shrink-0 ${r.checklist?.includes(c) ? 'bg-[#FDCF01] border-[#FDCF01]' : 'border-zinc-600'}`}></div>
                    <span className="truncate">{c}</span>
                  </button>
                ))}
              </div>
            )}

            {t.type === 'bilateral_timer' && (
              <div className="flex justify-between gap-4">
                <NumericInput label="Izquierdo (s)" value={r.izq} onChange={(v) => updateResult(t.id, 'izq', v)} />
                <NumericInput label="Derecho (s)" value={r.der} onChange={(v) => updateResult(t.id, 'der', v)} />
              </div>
            )}

            {(t.type === 'timer_reps' || t.type === 'timer_auto') && (
              <div className="flex justify-center">
                <NumericInput label={t.unit} value={r.val} onChange={(v) => updateResult(t.id, 'val', v)} />
              </div>
            )}

            {t.type === 'reps_with_height' && (
              <div className="flex flex-col gap-6 items-center">
                <NumericInput label="Repeticiones" value={r.val} onChange={(v) => updateResult(t.id, 'val', v)} />
                <NumericInput label="Altura apoyo (cm)" value={r.height} onChange={(v) => updateResult(t.id, 'height', v)} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 text-left block">Calidad Global</span>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => updateResult(t.id, 'quality', 'green')} className={`p-4 rounded-2xl flex flex-col items-center border-2 transition-all ${r.quality === 'green' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-transparent opacity-30 text-zinc-500'}`}>
                <CheckCircle2 />
                <span className="text-[10px] font-black uppercase mt-1 text-center">Correcto</span>
              </button>
              <button onClick={() => updateResult(t.id, 'quality', 'yellow')} className={`p-4 rounded-2xl flex flex-col items-center border-2 transition-all ${r.quality === 'yellow' ? 'bg-[#FDCF01]/10 border-[#FDCF01] text-[#FDCF01]' : 'bg-zinc-900 border-transparent opacity-30 text-zinc-500'}`}>
                <AlertCircle />
                <span className="text-[10px] font-black uppercase mt-1 text-center">Compensado</span>
              </button>
              <button onClick={() => updateResult(t.id, 'quality', 'red')} className={`p-4 rounded-2xl flex flex-col items-center border-2 transition-all ${r.quality === 'red' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-900 border-transparent opacity-30 text-zinc-500'}`}>
                <XCircle />
                <span className="text-[10px] font-black uppercase mt-1 text-center">Deficiente</span>
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={() => updateResult(t.id, 'dolor', r.dolor === 'SI' ? 'NO' : 'SI')} className={`flex-1 p-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 border-2 transition-all ${r.dolor === 'SI' ? 'bg-red-600 text-white border-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
              <Activity size={16} /> {r.dolor === 'SI' ? 'CON DOLOR' : 'SIN DOLOR'}
            </button>
            <button onClick={() => updateResult(t.id, 'invalid', !r.invalid)} className={`flex-1 p-4 rounded-2xl font-bold text-xs uppercase border-2 transition-all ${r.invalid ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
              {r.invalid ? 'INCLUIR' : 'EXCLUIR'}
            </button>
          </div>
        </main>

        <nav className="p-4 border-t border-zinc-800 flex gap-3 bg-[#000000]/90 backdrop-blur sticky bottom-0">
          <button disabled={activeTest === 0} onClick={() => setActiveTest(prev => prev - 1)} className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center disabled:opacity-20 text-white">
            <ChevronLeft />
          </button>
          <button onClick={() => {
              if (activeTest < TEST_LIST.length - 1) setActiveTest(prev => prev + 1);
              else setView('report');
            }} className={`flex-1 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${activeTest === TEST_LIST.length - 1 ? 'bg-[#FDCF01] text-black' : 'bg-[#FDCF01] text-black'} shadow-lg active:scale-95 transition-all uppercase tracking-widest`}>
            {activeTest === TEST_LIST.length - 1 ? 'FINALIZAR' : 'SIGUIENTE'} <ArrowRight size={18} />
          </button>
        </nav>

        {showProtocol && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowProtocol(null)}>
            <div className="bg-zinc-900 w-full max-w-xs rounded-[2rem] p-6 border border-zinc-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-[#FDCF01] uppercase tracking-tighter mb-4">{showProtocol.name}</h3>
              <p className="text-zinc-300 whitespace-pre-line leading-relaxed text-sm italic mb-6">{showProtocol.proto}</p>
              <button onClick={() => setShowProtocol(null)} className="w-full bg-zinc-800 p-4 rounded-xl font-black text-xs uppercase text-white">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'report') {
    const radarConfig = {
      labels: report.labels,
      datasets: [{
        label: 'Perfil Clínico',
        data: report.data,
        backgroundColor: 'rgba(253, 207, 1, 0.2)',
        borderColor: '#FDCF01',
        borderWidth: 2,
        pointBackgroundColor: '#FDCF01',
        pointRadius: 3
      }]
    };

    return (
      <div className="min-h-screen bg-[#000000] text-white p-6 space-y-8 pb-32 print:p-0 print:bg-white print:text-black">
        <header className="text-center print:text-left flex flex-col items-center print:items-start">
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none print:text-black">Reporte Evaluación</h1>
          <p className="text-[#FDCF01] font-black mt-1 uppercase tracking-widest text-[10px]">
            {patient.nombre} {patient.apellido} {patient.edad && `(${patient.edad} años)`}
          </p>
        </header>

        <div className="bg-zinc-900/40 p-6 rounded-[2.5rem] border border-zinc-800 aspect-square flex items-center justify-center print:border-none print:bg-white print:p-0">
          <Radar data={radarConfig} options={{ 
            scales: { r: { 
              min: 0, max: 100, 
              ticks: { display: false },
              grid: { color: 'rgba(255,255,255,0.05)' },
              pointLabels: { color: '#D5D5D5', font: { size: 8, weight: 'bold' } }
            } }, 
            plugins: { legend: { display: false } } 
          }} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {Object.entries(report.categories).map(([cat, score]) => (
            <div key={cat} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex justify-between items-center print:border-zinc-200 print:bg-white">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{cat}</span>
                    <span className={`w-2 h-2 rounded-full ${score >= 100 ? 'bg-emerald-500' : score >= 60 ? 'bg-[#FDCF01]' : 'bg-red-500'}`}></span>
                </div>
                <p className="font-bold text-sm mt-0.5 text-zinc-200">{CATEGORIES_INFO[cat]}</p>
              </div>
              <div className="text-2xl font-black text-[#FDCF01] opacity-40 print:opacity-100">{score}%</div>
            </div>
          ))}
        </div>

        <div className="bg-[#FDCF01]/10 border border-[#FDCF01]/20 p-6 rounded-3xl space-y-2 print:border-zinc-300 print:bg-zinc-50">
          <div className="flex items-center gap-2 text-[#FDCF01] font-black uppercase text-[10px] tracking-widest">
            <AlertTriangle size={16} /> Prioridad Clínica
          </div>
          <p className="text-lg font-bold leading-tight italic text-left text-zinc-100">
            👉 {report.worstTest ? `Foco inmediato en reentrenamiento de ${report.worstTest} por déficit de calidad/dolor.` : "Mantener esquema de progresión actual. Sin hallazgos críticos."}
          </p>
        </div>

        <footer className="fixed bottom-0 inset-x-0 p-4 bg-[#000000]/90 backdrop-blur border-t border-zinc-800 flex gap-4 print:hidden">
          <button onClick={() => window.print()} className="flex-1 bg-white text-black p-5 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-xs shadow-xl">
            <Download size={18} /> Exportar Reporte
          </button>
          <button onClick={() => location.reload()} className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-400">
            <RotateCcw size={18} />
          </button>
        </footer>
      </div>
    );
  }
};

export default App;