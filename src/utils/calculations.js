import { normativeData } from "../data/normativeData";

// Obtener grupo etario (según estudio chileno 18–80)
function getAgeGroup(test, age) {

  // --- PushUps y Chair Stand (rangos generales) ---
  if (test === "pushUps" || test === "chairStand30s") {
    if (age >= 18 && age <= 29) return "18-29";
    if (age >= 30 && age <= 39) return "30-39";
    if (age >= 40 && age <= 49) return "40-49";
    if (age >= 50 && age <= 59) return "50-59";
    if (age >= 60 && age <= 69) return "60-69";
    if (age >= 70 && age <= 80) return "70-80";
  }

  // --- 2-Minute Step Test ---
if (test === "step_test") {
    if (age >= 40 && age <= 49) return "40-49";
    if (age >= 50 && age <= 59) return "50-59";
    if (age >= 60 && age <= 64) return "60-64";
    if (age >= 65 && age <= 69) return "65-69";
    if (age >= 70 && age <= 74) return "70-74";
    if (age >= 75 && age <= 79) return "75-79";
    if (age >= 80 && age <= 84) return "80-84";
    if (age >= 85 && age <= 89) return "85-89";
    if (age >= 90 && age <= 94) return "90-94";
  }

// --- Single Leg Stance ---
if (test === "single_leg_stance") {
  if (age >= 20 && age <= 39) return "20-39";
  if (age >= 40 && age <= 49) return "40-49";
  if (age >= 50 && age <= 59) return "50-59";
  if (age >= 60 && age <= 69) return "60-69";
  if (age >= 70 && age <= 79) return "70-79";
  if (age >= 80 && age <= 89) return "80-89";
}

  return null;
}

// Obtener referencia normativa completa
export function getNormativeReference(test, gender, age) {
  const ageGroup = getAgeGroup(test, age);

  if (!ageGroup) return null;

  // ✅ Single Leg Stance NO depende de género
  if (test === "single_leg_stance") {
  const normalizedGender = (() => {
    if (!gender) return null;
    const g = gender.toLowerCase();

    if (["masculino", "hombre", "m", "male"].includes(g)) return "male";
    if (["femenino", "mujer", "f", "female"].includes(g)) return "female";

    return null;
  })();

  if (!normalizedGender) return null;

  return normativeData.single_leg_stance?.[normalizedGender]?.[ageGroup] ?? null;
}

  // ✅ Normalización SOLO de género
  const normalizedGender = (() => {
    if (!gender) return null;
    const g = gender.toLowerCase();

    if (["masculino", "hombre", "m", "male"].includes(g)) return "male";
    if (["femenino", "mujer", "f", "female"].includes(g)) return "female";

    return null;
  })();

  if (!normalizedGender) return null;

  return normativeData[test]?.[normalizedGender]?.[ageGroup] ?? null;
}
// Clasificación general por rangos (para otros test)
export function classifyByNormative(value, reference) {
  if (value === null || value === undefined || !reference) {
    return {
      level: "Sin referencia",
      color: "gray",
      interpretation:
        "No se dispone de valores normativos para esta edad o sexo."
    };
  }

  if (value >= reference.excellent) {
    return {
      level: "Excelente",
      color: "green",
      interpretation:
        "Rendimiento superior al esperado para su edad y sexo. Indica muy buena capacidad cardiorrespiratoria funcional."
    };
  }

  if (value >= reference.good) {
    return {
      level: "Bueno",
      color: "blue",
      interpretation:
        "Rendimiento por encima del promedio esperado para su grupo etario."
    };
  }

  if (value >= reference.average) {
    return {
      level: "Promedio",
      color: "yellow",
      interpretation:
        "Capacidad funcional dentro del rango esperado para su edad y sexo."
    };
  }

  if (reference.low && value >= reference.low) {
    return {
      level: "Bajo",
      color: "orange",
      interpretation:
        "Rendimiento por debajo del rango esperado. Puede sugerir disminución de la capacidad cardiorrespiratoria funcional."
    };
  }

  return {
    level: "Muy bajo",
    color: "red",
    interpretation:
      "Rendimiento significativamente inferior al esperado. Puede indicar compromiso relevante de la resistencia funcional."
  };
}

// Clasificación específica 30s Chair Stand
export function classifyChairStand(value, reference) {
  if (value === null || value === undefined || !reference) {
    return {
      level: "Sin referencia",
      color: "gray",
      interpretation:
        "No se dispone de valores normativos para esta edad o sexo."
    };
  }

  if (value >= reference.excellent) {
    return {
      level: "Excelente",
      color: "green",
      interpretation:
        "El rendimiento es superior al esperado para su edad y sexo, indicando una muy buena fuerza funcional de miembros inferiores."
    };
  }

  if (value >= reference.good) {
    return {
      level: "Bueno",
      color: "blue",
      interpretation:
        "El rendimiento se encuentra dentro del rango esperado para su edad y sexo."
    };
  }

  if (value >= reference.average) {
    return {
      level: "Promedio",
      color: "yellow",
      interpretation:
        "El rendimiento está dentro del rango funcional promedio para su grupo etario."
    };
  }

  if (value >= reference.low) {
    return {
      level: "Bajo",
      color: "orange",
      interpretation:
        "El rendimiento está por debajo del rango esperado para su edad y sexo, lo que puede sugerir disminución de la fuerza funcional en miembros inferiores."
    };
  }

  return {
    level: "Muy bajo",
    color: "red",
    interpretation:
      "El rendimiento está significativamente por debajo del rango esperado para su edad y sexo, lo que puede indicar compromiso importante de la fuerza funcional."
  };
}
// =============================
// ASIMETRÍA MIEMBROS INFERIORES
// =============================
export function calculateAsymmetry(left, right) {
  const l = Number(left);
  const r = Number(right);

  if (isNaN(l) || isNaN(r)) return null;

  const diff = Math.abs(l - r);
  const max = Math.max(l, r);

  const asymmetry = (diff / max) * 100;

  let level = null;
  let color = null;
  let interpretation = null;

  if (asymmetry < 10) {
    level = "Simetría normal";
    color = "green";
    interpretation = "Diferencia entre miembros dentro de rango funcional esperado.";
  } else if (asymmetry < 15) {
    level = "Asimetría leve";
    color = "yellow";
    interpretation = "Ligera diferencia entre miembros. Monitorear evolución.";
  } else if (asymmetry < 20) {
    level = "Asimetría moderada";
    color = "orange";
    interpretation = "Diferencia relevante. Recomendado trabajo unilateral específico.";
  } else {
    level = "Asimetría alta";
    color = "red";
    interpretation = "Alto riesgo funcional. Priorizar intervención correctiva.";
  }

  return {
    diff,
    asymmetry: asymmetry.toFixed(1),
    level,
    color,
    interpretation
  };
}
// =============================
// DORSIFLEXIÓN WBLT (ANGULAR)
// =============================
export function classifyDorsiflexion(angle) {
  if (angle === null || angle === undefined) {
    return {
      level: "Sin datos",
      color: "gray",
      interpretation: "No se registró valor angular."
    };
  }

  if (angle >= 40) {
    return {
      level: "Excelente",
      color: "green",
      interpretation:
        "Movilidad óptima de tobillo en carga. Adecuada para sentadilla profunda y patrones dinámicos."
    };
  }

  if (angle >= 35) {
    return {
      level: "Buena",
      color: "blue",
      interpretation:
        "Movilidad funcional adecuada en carga, sin limitaciones relevantes."
    };
  }

  if (angle >= 30) {
    return {
      level: "Funcional límite",
      color: "yellow",
      interpretation:
        "Rango funcional en límite inferior. Puede generar compensaciones en tareas profundas."
    };
  }

  if (angle >= 25) {
    return {
      level: "Restricción leve",
      color: "orange",
      interpretation:
        "Limitación de dorsiflexión en carga. Recomendado trabajo específico de movilidad."
    };
  }

  return {
    level: "Restricción significativa",
    color: "red",
    interpretation:
      "Déficit importante de dorsiflexión en carga. Asociado a mayor riesgo compensatorio."
  };
}

export function calculateDorsiflexionAsymmetry(left, right) {
  
  const l = Number(left);
  const r = Number(right);

  if (isNaN(l) || isNaN(r)) return null;

  const diff = Math.abs(l - r);

  let level;
  let color;
  let interpretation;

  // 🔥 CRITERIO CLÍNICO POR DIFERENCIA EN GRADOS
  if (diff <= 3) {
    level = "Simetría normal";
    color = "green";
    interpretation = "Diferencia menor o igual a 3°. Dentro de rango funcional normal.";
  } else if (diff <= 5) {
    level = "Asimetría leve";
    color = "yellow";
    interpretation = "Diferencia leve (4–5°). Puede requerir seguimiento.";
  } else if (diff <= 8) {
    level = "Asimetría moderada";
    color = "orange";
    interpretation = "Diferencia relevante. Recomendado trabajo de movilidad unilateral.";
  } else {
    level = "Asimetría alta";
    color = "red";
    interpretation = "Diferencia >8°. Alto riesgo de compensaciones.";
  }

  return {
    diff,
    level,
    color,
    interpretation
  };
}
// =============================
// SHOULDER MOBILITY (FMS)
// =============================
export function classifyShoulderMobility(score) {
  if (score === null || score === undefined) {
    return {
      level: "Sin datos",
      color: "gray",
      interpretation: "No se registró puntaje."
    };
  }

  if (score === 3) {
    return {
      level: "Movilidad funcional óptima",
      color: "green",
      interpretation: "Rango completo y simétrico según criterio FMS."
    };
  }

  if (score === 2) {
    return {
      level: "Limitación leve",
      color: "yellow",
      interpretation: "Movilidad funcional con restricción leve."
    };
  }

  if (score === 1) {
    return {
      level: "Restricción significativa",
      color: "orange",
      interpretation: "Déficit relevante de movilidad de hombro."
    };
  }

  return {
    level: "Dolor",
    color: "red",
    interpretation: "Dolor durante el test. Requiere evaluación clínica."
  };
}
// =============================
// OVERHEAD SQUAT (Checklist + FMS Auto Score)
// =============================

export const classifyOverheadSquat = (checklist, dolor) => {
  const safeChecklist = Array.isArray(checklist) ? checklist : [];

  if (dolor === "SI") {
    return {
      score: 0,
      level: "Dolor durante el movimiento",
      color: "red",
      interpretation:
        "Presencia de dolor. Requiere evaluación específica antes de progresar."
    };
  }

  const compensaciones = safeChecklist.length;

  if (compensaciones === 0) {
    return {
      score: 3,
      level: "Movimiento óptimo",
      color: "green",
      interpretation:
        "Patrón global estable y sin compensaciones visibles."
    };
  }

  if (compensaciones <= 2) {
    return {
      score: 2,
      level: "Funcional con compensaciones",
      color: "yellow",
      interpretation:
        "Patrón funcional pero con déficits segmentarios detectables."
    };
  }

  return {
    score: 1,
    level: "Patrón deficiente",
    color: "orange",
    interpretation:
      "Compensaciones múltiples. Prioridad de intervención."
  };
};
// =============================
// 10-METER WALK TEST
// =============================
export function classifyGaitSpeed(timeSeconds) {

  if (!timeSeconds || isNaN(timeSeconds) || timeSeconds <= 0) {
    return null;
  }

  const speed = 10 / Number(timeSeconds);

  if (speed >= 1.3) {
    return {
      speed: speed.toFixed(2),
      level: "Excelente",
      color: "green",
      interpretation:
        "Velocidad de marcha alta. Asociada a muy buena capacidad funcional y bajo riesgo."
    };
  }

  if (speed >= 1.0) {
    return {
      speed: speed.toFixed(2),
      level: "Normal",
      color: "green",
      interpretation:
        "Velocidad dentro del rango funcional esperado en adultos sanos."
    };
  }

  if (speed >= 0.8) {
    return {
      speed: speed.toFixed(2),
      level: "Límite funcional",
      color: "yellow",
      interpretation:
        "Velocidad en límite inferior. Puede indicar inicio de declive funcional."
    };
  }

  if (speed >= 0.6) {
    return {
      speed: speed.toFixed(2),
      level: "Riesgo funcional",
      color: "orange",
      interpretation:
        "Velocidad reducida asociada a mayor riesgo funcional."
    };
  }

  return {
    speed: speed.toFixed(2),
    level: "Alto riesgo",
    color: "red",
    interpretation:
      "Velocidad marcadamente reducida. Asociada a alto riesgo funcional."
  };
}