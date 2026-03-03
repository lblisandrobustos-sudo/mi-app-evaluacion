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
import { 
  getNormativeReference, 
  classifyByNormative, 
  classifyChairStand,
  calculateAsymmetry,
  calculateDorsiflexionAsymmetry,
  classifyShoulderMobility,
  classifyOverheadSquat,
  classifyGaitSpeed   
} from "./utils/calculations";
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
  id: 'tobillo', 
  name: 'Dorsiflexión de Tobillo (WBLT)', 
  category: 'Movilidad', 
  type: 'bilateral', 
  unit: '°',
  proto: '• Talón apoyado en suelo.\n• Rodilla avanza hacia adelante sin despegar talón.\n• Colocar inclinómetro en tibia.\n• Registrar ángulo máximo en grados.'
},
    {
  id: 'shoulder_mob',
  name: 'Shoulder Mobility (FMS)',
  category: 'Movilidad',
  type: 'bilateral_fms',
  proto: '• Bipedestación.\n• Una mano por encima y otra por debajo.\n• Medir distancia entre nudillos.\n• Puntuar 0–3 según criterio FMS.'
},
    { 
      id: 'overhead_test', name: 'Overhead Test (Hombro)', category: 'Movilidad', type: 'qualitative_checklist',
      checks: ['Compensa arco lumbar', 'Brazos no alinean orejas', 'Flexión incompleta', 'Asimetría'],
      proto: '• Elevación bilateral de brazos sobre la cabeza.\n• Observar compensaciones lumbares o falta de rango.'
    },
    { 
      id: 'overhead_squat', name: 'Overhead Squat', category: 'Estabilidad', type: 'qualitative_checklist',
      checks: ['Talones se levantan', 'Valgo de rodilla', 'Inclinación de tronco', 'Brazos caen hacia adelante', 'Profundidad limitada', 'Asimetría lateral'],
      proto: '✅ POSICIÓN INICIAL\n• Pies al ancho de hombros\n• Dedos apuntando al frente\n• Bastón sobre la cabeza\n• Hombros en flexión completa\n• Codos extendidos\n• Bastón alineado con los pies\n\n✅ EJECUCIÓN\n• Descender en sentadilla\n• Muslos al menos paralelos al suelo\n• Talones apoyados\n• Mantener bastón alineado\n• Realizar 3 intentos\n\n✅ CRITERIOS DE PUNTUACIÓN\n3 = Cumple todo el patrón\n2 = Cumple con compensación\n1 = No logra profundidad o pierde alineación\n0 = Dolor'
    },
    { 
      id: 'single_leg_stance', name: 'Single Leg Stance', category: 'Estabilidad', type: 'bilateral_timer', unit: 'seg',
      proto: '• Equilibrio en un pie, manos en cintura.\n• Detener si pierde postura o toca el suelo.'
    },
    { 
      id: 'sit_stand', name: 'Sit to Stand', category: 'Resistencia', type: 'timer_reps', unit: 'reps', defaultTime: 30,
      proto: '• Máximas repeticiones en 30 segundos.\n• De sentado a parado completo.'
    },
    {
  id: 'step_test',
  name: '2-Minute Step Test',
  category: 'Resistencia',
  type: 'timer_auto',
  unit: 'pasos',
  defaultTime: 120,
  proto: '• Marcar en la pared el punto medio entre la rótula y la espina ilíaca anterosuperior.\n• El participante marcha en el lugar durante 2 minutos.\n• Se cuentan únicamente las veces que la rodilla derecha alcanza o supera la marca.\n• Cada elevación válida de la rodilla derecha equivale a 1 repetición.\n• El puntaje final es el número total de elevaciones válidas.'
},
{
  id: 'gait_speed',
  name: '10-Meter Walk Test',
  category: 'Resistencia',
  type: 'timer_reps',
  unit: 'seg',
  proto:
    '• Marcar 10 metros en línea recta.\n' +
    '• El paciente camina a velocidad habitual.\n' +
    '• Cronometrar el tiempo total.\n' +
    '• Registrar en segundos.\n' +
    '• Se recomienda realizar 2 intentos y registrar el mejor.'
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
    let imcFlag = null;

if (Number(patient?.peso) > 0 && Number(patient?.altura) > 0) {
  const alturaM = Number(patient.altura) / 100;
  const imcCalc = Number(patient.peso) / (alturaM * alturaM);

  if (imcCalc >= 30) {
    imcFlag = "Riesgo por obesidad";
  } else if (imcCalc >= 25) {
    imcFlag = "Sobrepeso (factor a considerar)";
  }
}

    TEST_LIST.forEach(t => {
      const r = results[t.id];
      if (!r) return;
      let score = 100;
      if (r.dolor === 'SI' || r.quality === 'red') score = 30;
      else if (r.quality === 'yellow') score = 60;

      if (score < categories[t.category]) categories[t.category] = score;
      if (score <= 30) worstTest = t.name;
    });

    return { labels, data, categories, worstTest, imcFlag };
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
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Edad" onChange={e => setPatient({...patient, edad: Number(e.target.value)})} />
              <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Peso kg" onChange={e => setPatient({...patient, peso: Number(e.target.value)})} />
              <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] text-white" placeholder="Altura cm" onChange={e => setPatient({...patient, altura: Number(e.target.value)})} />

<select
  className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none text-white"
  onChange={e => setPatient({...patient, genero: e.target.value})}
>
  <option value="">Género</option>
  <option value="male">Hombre</option>
  <option value="female">Mujer</option>
</select>
            </div>
            <input type="number" className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 outline-none focus:ring-1 focus:ring-[#FDCF01] italic text-white" placeholder="Cintura cm (opcional)" onChange={e => setPatient({...patient, cintura: Number(e.target.value)})} />
            <button 
              disabled={!patient.nombre || !patient.apellido || !patient.genero}
              onClick={() => {
  if (!patient.edad || patient.edad < 10 || patient.edad > 100) {
    alert('Edad inválida');
    return;
  }

  if (!patient.peso || patient.peso < 30 || patient.peso > 250) {
    alert('Peso inválido');
    return;
  }

  if (!patient.altura || patient.altura < 120 || patient.altura > 220) {
    alert('Altura inválida');
    return;
  }
  if (patient.cintura && (patient.cintura < 50 || patient.cintura > 200)) {
  alert('Cintura inválida');
  return;
}

  const alturaM = patient.altura / 100;
const imc = patient.peso / (alturaM * alturaM);

let imcClasificacion = '';

if (imc < 18.5) imcClasificacion = 'Bajo peso';
else if (imc < 25) imcClasificacion = 'Normal';
else if (imc < 30) imcClasificacion = 'Sobrepeso';
else imcClasificacion = 'Obesidad';

setPatient({
  ...patient,
  imc: imc.toFixed(1),
  imcClasificacion
});

setView('eval');
}}
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
            {t.type === 'bilateral_fms' && (
  <div className="space-y-6">
    {['izq', 'der'].map(side => (
      <div key={side} className="space-y-2">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          {side === 'izq' ? 'Lado Izquierdo' : 'Lado Derecho'}
        </span>

        <div className="grid grid-cols-4 gap-2">
          {[3,2,1,0].map(score => (
            <button
              key={score}
              onClick={() => updateResult(t.id, side, score)}
              className={`p-3 rounded-xl text-xs font-bold border ${
                r[side] === score
                  ? 'bg-[#FDCF01] border-[#FDCF01] text-black'
                  : 'bg-zinc-800 border-transparent text-zinc-500'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
)}

            {t.type === 'bilateral' && (
  <div className="flex justify-between items-center gap-4">
    <NumericInput 
      label={`Izq (${t.unit || ""})`} 
      value={r.izq} 
      onChange={(v) => updateResult(t.id, 'izq', v)} 
    />
    <div className="w-px h-10 bg-zinc-800 shrink-0"></div>
    <NumericInput 
      label={`Der (${t.unit || ""})`} 
      value={r.der} 
      onChange={(v) => updateResult(t.id, 'der', v)} 
    />
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
              {showProtocol?.id === 'shoulder_mob' && (
  <div className="mt-4 mb-6 pt-4 border-t border-zinc-700 text-xs space-y-1">
    <p className="uppercase text-zinc-400 text-[10px] font-semibold tracking-widest">
      Criterio de puntuación FMS
    </p>

    <p><strong>3</strong> = Movimiento óptimo</p>
    <p><strong>2</strong> = Movimiento funcional con compensación</p>
    <p><strong>1</strong> = Incapaz de completar el patrón</p>
    <p><strong>0</strong> = Dolor durante el movimiento</p>
  </div>
)}
{showProtocol?.id === 'overhead_squat' && (
  <div className="mt-4 mb-6 pt-4 border-t border-zinc-700 text-xs space-y-1">
    <p className="uppercase text-zinc-400 text-[10px] font-semibold tracking-widest">
      Criterio de puntuación FMS
    </p>
    <p><strong>3</strong> = Movimiento óptimo sin compensaciones</p>
    <p><strong>2</strong> = Movimiento funcional con compensaciones</p>
    <p><strong>1</strong> = Incapaz de completar el patrón correctamente</p>
    <p><strong>0</strong> = Dolor durante el movimiento</p>
  </div>
)}
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

  const pushUpResult = results["pushup"]?.val;
  const chairStandResult = results["sit_stand"]?.val;

  const stepTestResult = results["step_test"]?.val;
  const slsLeft = results["single_leg_stance"]?.izq;
  const ankleLeft = results["tobillo"]?.izq;
const ankleRight = results["tobillo"]?.der;

const ankleBest = Math.max(
  Number(ankleLeft || 0),
  Number(ankleRight || 0)
);

const ankleAsymmetry = calculateDorsiflexionAsymmetry(ankleLeft, ankleRight);
const slsRight = results["single_leg_stance"]?.der;
const slsAsymmetry = calculateAsymmetry(slsLeft, slsRight);
// =============================
// SHOULDER MOBILITY (FMS)
// =============================

const shoulderLeft = results["shoulder_mob"]?.izq;
const shoulderRight = results["shoulder_mob"]?.der;

let shoulderBest = null;
let shoulderClassification = null;

if (
  shoulderLeft !== undefined &&
  shoulderRight !== undefined
) {
  shoulderBest = Math.min(
    Number(shoulderLeft),
    Number(shoulderRight)
  );

  shoulderClassification = classifyShoulderMobility(
    shoulderBest
  );
}
// =============================
// OVERHEAD SQUAT
// =============================

const ohsChecklist = results["overhead_squat"]?.checklist || [];
const ohsDolor = results["overhead_squat"]?.dolor;

let ohsClassification = null;

if (results["overhead_squat"]) {
  ohsClassification = classifyOverheadSquat(
    ohsChecklist,
    ohsDolor
  );
}
const slsBest = Math.max(
  Number(slsLeft || 0),
  Number(slsRight || 0)
);
console.log("SLS LEFT:", slsLeft);
console.log("SLS RIGHT:", slsRight);
console.log("SLS BEST:", slsBest);
console.log("GENERO:", patient.genero);

let slsLevel = null;
let slsReference = null;

if (slsBest !== null && slsBest !== undefined && slsBest > 0 && patient.edad) {
  slsReference = getNormativeReference(
    "single_leg_stance",
    patient.genero,
    Number(patient.edad)
  );

  if (slsReference) {
    slsLevel = classifyByNormative(
      Number(slsBest),
      slsReference
    );
  }
}

let stepTestLevel = null;
let stepTestReference = null;

if (stepTestResult && patient.edad && patient.genero) {
  stepTestReference = getNormativeReference(
  "step_test",
  patient.genero,
  Number(patient.edad)
);

  if (stepTestReference) {
    stepTestLevel = classifyByNormative(
      Number(stepTestResult),
      stepTestReference
    );
  }
}
// =============================
// GAIT SPEED
// =============================

const gaitTime = results["gait_speed"]?.val;
let gaitClassification = null;

if (gaitTime && gaitTime > 0) {
  gaitClassification = classifyGaitSpeed(gaitTime);
}
let chairStandLevel = null;

if (chairStandResult && patient.edad && patient.genero) {
  const reference = getNormativeReference(
  "chairStand30s",
  patient.genero,
  Number(patient.edad)
);
  const classification = classifyChairStand(
    Number(chairStandResult),
    reference
  );

  chairStandLevel = classification;
}

let imc = null;
let imcClasificacion = null;

if (Number(patient.peso) > 0 && Number(patient.altura) > 0) {
  const alturaM = Number(patient.altura) / 100;
  imc = Number(patient.peso) / (alturaM * alturaM);

  if (imc < 18.5) imcClasificacion = "Bajo peso";
  else if (imc < 25) imcClasificacion = "Normal";
  else if (imc < 30) imcClasificacion = "Sobrepeso";
  else imcClasificacion = "Obesidad";
}

let imcFlag = null;

if (imc >= 30) {
  imcFlag = "Riesgo por obesidad";
} else if (imc >= 25) {
  imcFlag = "Sobrepeso (factor a considerar)";
}

let normativoPushUp = null;
let pushUpLevel = null;

if (pushUpResult && patient.edad && patient.genero) {
  normativoPushUp = getNormativeReference(
    "pushUps",
    patient.genero,
    Number(patient.edad)
  );

  if (normativoPushUp) {
    pushUpLevel = classifyByNormative(
      Number(pushUpResult),
      normativoPushUp
    );
  }
}

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 space-y-8 pb-32 print:p-0 print:bg-white print:text-black">
      
      
      <header className="text-center print:text-left flex flex-col items-center print:items-start">
        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none print:text-black">
          Reporte Evaluación
        </h1>

        <p className="text-[#FDCF01] font-black mt-1 uppercase tracking-widest text-[10px]">
          {patient.nombre} {patient.apellido} 
{patient.edad && `(${patient.edad} años)`} 
{patient.genero && ` - ${patient.genero === "male" ? "Hombre" : "Mujer"}`}
        </p>
      </header>
      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
  <p className="text-xs text-zinc-400 uppercase">IMC</p>
  <p className="text-2xl font-black text-white">
    {imc?.toFixed(1) || "--"} <span className="text-sm text-zinc-400">kg/m²</span>
  </p>
  <p className="text-sm font-bold text-[#FDCF01]">
    {imcClasificacion || "Sin datos"}
  </p>
</div>
<div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
  <p className="text-xs text-zinc-400 uppercase">
    30s Chair Stand
  </p>

  <p className="text-2xl font-black text-white">
    {chairStandResult || "--"} <span className="text-sm text-zinc-400">reps</span>
  </p>

  <p
    className={`text-sm font-bold ${
      chairStandLevel?.color === "green"
        ? "text-green-400"
        : chairStandLevel?.color === "red"
        ? "text-red-400"
        : chairStandLevel?.color === "orange"
        ? "text-orange-400"
        : "text-zinc-400"
    }`}
  >
    {chairStandLevel?.level || "Sin datos"}
  </p>

  {chairStandLevel?.interpretation && (
    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
      {chairStandLevel.interpretation}
    </p>
  )}
</div>
{stepTestResult && (
  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
    <p className="text-xs text-zinc-400 uppercase">
      2-Minute Step Test
    </p>

    <p className="text-2xl font-black text-white">
      {stepTestResult} <span className="text-sm text-zinc-400">pasos</span>
    </p>

    <p
      className={`text-sm font-bold ${
        stepTestLevel?.color === "green"
          ? "text-green-400"
          : stepTestLevel?.color === "red"
          ? "text-red-400"
          : stepTestLevel?.color === "orange"
          ? "text-orange-400"
          : "text-zinc-400"
      }`}
    >
      {stepTestLevel?.level || "Sin referencia normativa"}
    </p>

    {stepTestLevel?.interpretation && (
      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
        {stepTestLevel.interpretation}
      </p>
    )}

    {patient.edad < 60 && (
      <p className="text-[10px] text-zinc-500 mt-2 italic">
        Valores basados en guías clínicas funcionales para población adulta menor de 60 años.
      </p>
    )}
  </div>
)}
{gaitClassification && (
  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
    <p className="text-xs text-zinc-400 uppercase">
      10-Meter Walk Test
    </p>

    <p className="text-2xl font-black text-white">
      {gaitTime} <span className="text-sm text-zinc-400">seg</span>
    </p>

    <p className="text-lg font-bold text-white mt-1">
      Velocidad: {gaitClassification.speed} m/s
    </p>

    <p
      className={`text-sm font-bold ${
        gaitClassification.color === "green"
          ? "text-green-400"
          : gaitClassification.color === "yellow"
          ? "text-yellow-400"
          : gaitClassification.color === "orange"
          ? "text-orange-400"
          : "text-red-400"
      }`}
    >
      {gaitClassification.level}
    </p>

    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
      {gaitClassification.interpretation}
    </p>
  </div>
)}
{slsBest > 0 && (
  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
    <p className="text-xs text-zinc-400 uppercase">
      Single Leg Stance
    </p>

    <p className="text-2xl font-black text-white">
      {slsBest} <span className="text-sm text-zinc-400">seg</span>
    </p>

    <p
      className={`text-sm font-bold ${
        slsLevel?.color === "green"
          ? "text-green-400"
          : slsLevel?.color === "red"
          ? "text-red-400"
          : slsLevel?.color === "orange"
          ? "text-orange-400"
          : "text-zinc-400"
      }`}
    >
      {slsLevel?.level || "Sin referencia normativa"}
    </p>

    {slsLevel?.interpretation && (
      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
        {slsLevel.interpretation}
      </p>
    )}
    {slsAsymmetry && (
  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1">
    <p className="text-xs text-zinc-400">
      Diferencia: {slsAsymmetry.diff} seg
    </p>

    <p className="text-xs text-zinc-400">
      Asimetría: {slsAsymmetry.asymmetry}%
    </p>

    <p
      className={`text-sm font-bold ${
        slsAsymmetry.color === "green"
          ? "text-green-400"
          : slsAsymmetry.color === "yellow"
          ? "text-yellow-400"
          : slsAsymmetry.color === "orange"
          ? "text-orange-400"
          : "text-red-400"
      }`}
    >
      {slsAsymmetry.level}
    </p>

    <p className="text-xs text-zinc-400 leading-relaxed">
      {slsAsymmetry.interpretation}
    </p>
  </div>
)}
  </div>
)}
{ankleBest > 0 && (
  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
    <p className="text-xs text-zinc-400 uppercase">
      Dorsiflexión Tobillo
    </p>

    <p className="text-2xl font-black text-white">
      {ankleBest}°
    </p>

    {ankleAsymmetry && (
      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1">
        <p className="text-xs text-zinc-400">
          Diferencia: {ankleAsymmetry.diff}°
        </p>

       

        <p
          className={`text-sm font-bold ${
            ankleAsymmetry.color === "green"
              ? "text-green-400"
              : ankleAsymmetry.color === "yellow"
              ? "text-yellow-400"
              : ankleAsymmetry.color === "orange"
              ? "text-orange-400"
              : "text-red-400"
          }`}
        >
          {ankleAsymmetry.level}
        </p>

        <p className="text-xs text-zinc-400 leading-relaxed">
          {ankleAsymmetry.interpretation}
        </p>
      </div>
    )}
  </div>
)}
{shoulderBest !== null && (
  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
    <p className="text-xs text-zinc-400 uppercase">
      Shoulder Mobility (FMS)
    </p>

    <p className="text-2xl font-black text-white">
      Puntaje: {shoulderBest} / 3
    </p>

    <p
      className={`text-sm font-bold ${
        shoulderClassification?.color === "green"
          ? "text-green-400"
          : shoulderClassification?.color === "yellow"
          ? "text-yellow-400"
          : shoulderClassification?.color === "orange"
          ? "text-orange-400"
          : shoulderClassification?.color === "red"
          ? "text-red-400"
          : "text-zinc-400"
      }`}
    >
      {shoulderClassification?.level}
    </p>

    {shoulderClassification?.interpretation && (
      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
        {shoulderClassification.interpretation}
      </p>
    )}
  </div>
)}
{ohsClassification && (
  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4">
    <p className="text-xs text-zinc-400 uppercase">
      Overhead Squat
    </p>

    <p className="text-2xl font-black text-white">
      Puntaje: {ohsClassification.score} / 3
    </p>

    <p
      className={`text-sm font-bold ${
        ohsClassification.color === "green"
          ? "text-green-400"
          : ohsClassification.color === "yellow"
          ? "text-yellow-400"
          : ohsClassification.color === "orange"
          ? "text-orange-400"
          : "text-red-400"
      }`}
    >
      {ohsClassification.level}
    </p>

    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
      {ohsClassification.interpretation}
    </p>

    {ohsChecklist.length > 0 && (
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-500 uppercase mb-2">
          Compensaciones detectadas
        </p>
        <ul className="text-xs text-zinc-400 space-y-1">
          {ohsChecklist.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
      {pushUpResult && normativoPushUp && pushUpLevel && (
  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-2">
    <p className="text-xs text-zinc-400">Push-up</p>
    <p className="text-lg font-bold text-white">
      Resultado: {pushUpResult} reps
    </p>
    <p className="text-sm text-zinc-400">
      Media: {normativoPushUp?.mean ?? "-"} reps
    </p>
    <p
      className={`text-sm font-bold ${
        pushUpLevel?.color === "green"
          ? "text-green-400"
          : pushUpLevel?.color === "red"
          ? "text-red-400"
          : "text-zinc-400"
      }`}
    >
      {pushUpLevel?.level}
    </p>
  </div>
)}

      
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
            👉 {
  report.worstTest
    ? `Foco inmediato en reentrenamiento de ${report.worstTest} por déficit de calidad/dolor.`
    : report.imcFlag
    ? `Atención: ${report.imcFlag}. Considerar intervención sobre composición corporal.`
    : "Mantener esquema de progresión actual. Sin hallazgos críticos."
}
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
}

export default App;