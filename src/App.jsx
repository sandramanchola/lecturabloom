import { useState, useEffect, useCallback } from "react";

// ─── ⚙️  CONFIGURACIÓN — pega aquí tus credenciales de Supabase ──────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY || "";

// ─── SUPABASE CLIENT (sin SDK, fetch puro) ────────────────────────────────────
const sb = {
  headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method:"POST", headers:{...this.headers,"Prefer":"return=representation"}, body:JSON.stringify(data) });
    const d = await r.json(); return Array.isArray(d) ? d[0] : d;
  },
  async select(table, filter="", order="created_at.desc") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&order=${order}`, { headers:this.headers });
    return r.json();
  },
  async update(table, id, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method:"PATCH", headers:{...this.headers,"Prefer":"return=minimal"}, body:JSON.stringify(data) });
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method:"DELETE", headers:this.headers });
  },
  async selectOne(table, filter) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&limit=1`, { headers:this.headers });
    const d = await r.json(); return Array.isArray(d)?d[0]:null;
  },
};

// ─── AUTH CLIENT ─────────────────────────────────────────────────────────────
const auth = {
  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
      body:JSON.stringify({email,password})
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
      body:JSON.stringify({email,password})
    });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`}
    });
  },
};

function sbWithToken(token) {
  const h = {"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`};
  return {
    async insert(table, data) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {method:"POST",headers:{...h,"Prefer":"return=representation"},body:JSON.stringify(data)});
      const d = await r.json(); return Array.isArray(d)?d[0]:d;
    },
    async select(table, filter="", order="created_at.desc") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&order=${order}`, {headers:h});
      return r.json();
    },
    async selectOne(table, filter) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&limit=1`, {headers:h});
      const d = await r.json(); return Array.isArray(d)?d[0]:null;
    },
    async update(table, id, data) {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {method:"PATCH",headers:{...h,"Prefer":"return=minimal"},body:JSON.stringify(data)});
    },
    async delete(table, id) {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {method:"DELETE",headers:h});
    },
  };
}

function generateCode() {
  const w=["LUNA","SOL","MAR","RIO","PAZ","LUZ","FE","ORO","ALA","ECO","OLA","VID","ROC","PEZ","GEM","ARK","ZAP","FOX","JAZ","REY"];
  return w[Math.floor(Math.random()*w.length)]+Math.floor(10+Math.random()*90);
}

// ─── TRADUCCIONES ─────────────────────────────────────────────────────────────
const T = {
  es: {
    appName:"LecturaBloom", tagline:"Comprensión lectora · Bloom · TEKS",
    iam_teacher:"👩‍🏫 Soy Docente", iam_student:"🎒 Soy Estudiante",
    teacher_panel:"Panel del Docente", student_zone:"Zona del Estudiante", student_label:"Estudiante",
    back_home:"← Inicio",
    // Teacher setup
    teacher_setup_title:"📚 Nueva Sesión de Clase", teacher_setup_sub:"Configura el texto y TEKS antes de comenzar.",
    session_name_label:"Nombre de la sesión", session_name_placeholder:"Ej: Semana 3 — La célula",
    grade_label:"Grado", grade_placeholder:"Ej: 4to grado", teks_label:"TEKS", teks_placeholder:"TEKS §110.6(b)(6)(A)...",
    objective_label:"Objetivo de Aprendizaje", objective_placeholder:"El estudiante podrá...",
    reading_label:"Texto de Lectura", reading_placeholder:"Pega aquí el texto...",
    save_btn:"✅ Guardar Sesión y Activar", saving_btn:"Guardando...", fill_all:"Completa todos los campos.",
    how_works:"¿Cómo funciona?",
    steps:["Docente — Configura texto, TEKS y objetivo.","Clase — Escalofoneo inicial con estudiantes.","Estudiante — Preguntas de opción múltiple escaladas por Bloom.","IA — Diagnóstica y personaliza.","Tiquete RAC — Respuesta construida guiada.","Historial — Accede a sesiones anteriores siempre."],
    // History
    history_title:"📅 Historial de Sesiones", history_empty:"No hay sesiones anteriores.",
    history_loading:"Cargando historial...", session_of:"Sesión del", students_count:"estudiantes",
    view_session:"Ver sesión →", new_session:"+ Nueva Sesión",
    session_code_label:"Código de Sesión", session_code_sub:"Comparte este código con tus estudiantes",
    enter_code:"Ingresar código de sesión", enter_code_placeholder:"Ej: LUNA42", enter_code_btn:"Entrar →",
    code_not_found:"Código no encontrado. Verifica con tu maestro/a.", code_loading:"Buscando sesión...",
    share_code:"📋 Copiar código", copied:"¡Copiado!", delete_session:"🗑️ Borrar sesión",
    confirm_delete:"¿Seguro que quieres borrar esta sesión?",
    // Student intro
    welcome_title:"👋 Bienvenido", welcome_sub:"Demuestra lo que comprendiste. La app se adapta a tu nivel.",
    learning_objective:"Objetivo de Aprendizaje", your_name:"Tu nombre", name_placeholder:"Escribe tu nombre...", start_btn:"🚀 Comenzar",
    // Questions
    question_of:"Pregunta", of:"de", confirm_btn:"Confirmar →", continue_btn:"Continuar →",
    loading_questions:"Generando preguntas...", loading_generic:"Cargando...",
    // Scaffolding
    scaffold_title:"🔨 Ejercicio de Escalofoneo", activity_label:"Actividad", hint_label:"💡 Ver pista",
    write_here:"Escribe tu respuesta...", next_step:"Siguiente →", complete_scaffold:"✅ Completar",
    ref_text:"Texto de referencia", loading_scaffold:"Generando escalofoneo...",
    // Exit ticket
    exit_title:"🎫 Tiquete de Salida", exit_sub:"Usa la estrategia RAC: Reafirma · Responde · Cita Evidencia.",
    rac_r:"R — Reafirma la pregunta", rac_r_hint:"Reescribe la pregunta con tus propias palabras como oración completa.",
    rac_a:"A — Responde", rac_a_hint:"Da tu respuesta directamente y con claridad.",
    rac_c:"C — Cita Evidencia", rac_c_hint:"Cita evidencia textual con comillas o parafraseando.",
    rac_example_label:"Estructura RAC",
    rac_placeholder_r:"El texto trata sobre...", rac_placeholder_a:"Yo creo que...", rac_placeholder_c:"Según el texto, «...»",
    send_exit:"Enviar Tiquete 🎫", loading_exit:"Generando tiquete de salida...",
    rac_model_answer:"Respuesta modelo",
    // Results
    great_job:"¡Buen trabajo", result_pass:"¡Demostraste comprensión del texto!", result_fail:"¡Seguimos trabajando juntos!",
    your_level:"Tu nivel de comprensión", bloom_label:"Bloom — Nivel", teacher_will_get:"Tu maestra/o recibirá un informe detallado.",
    // Report
    report_title:"📊 Informe de Intervención", strengths:"✅ Fortalezas", gaps:"⚠️ Brechas",
    intervention_groups:"👥 Grupos de Intervención", priority:"Prioridad", bloom_range:"Bloom",
    students_label:"Estudiantes", focus_label:"Enfoque", strategies_label:"Estrategias", activities_label:"Actividades",
    immediate_actions:"⚡ Acciones Inmediatas", next_steps:"📅 Próximos Pasos",
    no_data:"Aún no hay datos de estudiantes.", loading_report:"Generando plan de intervención...",
    teacher_not_set:"El docente aún no ha configurado la lectura.",
    // Session detail
    session_detail:"Detalle de Sesión", back_history:"← Historial", student_detail:"Detalle del Estudiante",
    bloom_score:"Nivel Bloom", exit_result:"Tiquete de Salida", scaffolding_needed:"Necesitó Escalofoneo",
    perf_great:"Va muy bien", perf_progress:"En progreso", perf_support:"Necesita apoyo",
    tap_student:"Toca a un estudiante para ver su detalle", ind_strengths:"💪 Fortalezas", ind_weaknesses:"📈 A trabajar",
    gen_analysis:"Genera el plan para ver fortalezas y áreas de cada estudiante", report_saved:"Plan guardado ✓", regen_plan:"🔄 Regenerar plan",
    rac_response:"Respuesta RAC", rac_eval:"Evaluación RAC",
    yes:"Sí", no:"No", score:"Puntaje",
    intervention_plan:"Plan de Intervención", generate_plan:"Generar Plan de Intervención",
    // Bloom
    bloom:["Recordar","Comprender","Aplicar","Analizar","Evaluar","Crear"],
    bloom_desc:["Recordar información","Explicar con propias palabras","Usar en nuevas situaciones","Descomponer en partes","Justificar decisiones","Producir nuevas ideas"],
    // Auth
    login_title:"👩‍🏫 Acceso Docente", login_sub:"Inicia sesión para gestionar tus clases.",
    signup_title:"Crear cuenta", login_tab:"Iniciar sesión", signup_tab:"Registrarse",
    email_label:"Correo electrónico", email_placeholder:"tu@correo.com",
    password_label:"Contraseña", password_placeholder:"Mínimo 6 caracteres",
    login_btn:"Entrar →", signup_btn:"Crear cuenta →",
    logging_in:"Entrando...", signing_up:"Creando cuenta...",
    logout_btn:"Cerrar sesión", welcome_teacher:"Bienvenida/o",
    auth_error:"Error de autenticación. Verifica tu correo y contraseña.",
    confirm_email:"¡Cuenta creada! Revisa tu correo para confirmar.",
    qlang:"español", scaffold_lang:"español",
    q_system:`Eres especialista en Taxonomía de Bloom y STAAR de Texas. ADAPTA SIEMPRE el nivel de dificultad, vocabulario y longitud de oraciones al GRADO indicado: grados 1-2 vocabulario muy básico y oraciones muy cortas con preguntas literales; grado 3 vocabulario sencillo y preguntas concretas; grados 4-5 dificultad intermedia, mezcla de literal e inferencial, vocabulario de nivel; grados 6-8 lenguaje académico, inferencias complejas y vocabulario avanzado. Las preguntas DEBEN alinearse directamente con el TEKS y el OBJETIVO DE APRENDIZAJE proporcionados: enfoca cada pregunta en la habilidad específica que indica el TEKS y el objetivo. Genera 6 preguntas de opción múltiple en ESPAÑOL, una por nivel Bloom: stem con contexto textual, 4 opciones plausibles, tipos: idea principal, inferencia, vocabulario en contexto, estructura, propósito del autor. Sin "todas las anteriores". SOLO JSON válido sin backticks.`,
    sc_system:"Eres experto en estrategias de lectura. Genera ejercicios de ESCALOFONEO en ESPAÑOL. SOLO JSON válido.",
    exit_system:`Eres experto en evaluación STAAR. Genera un TIQUETE DE SALIDA en ESPAÑOL: pregunta abierta de respuesta construida, alineada STAAR, no trabajada en clase, requiere estrategia RAC (R=Reafirmar, A=Responder, C=Citar evidencia). SOLO JSON válido.`,
    rep_system:"Eres especialista en educación. Genera plan de intervención detallado en ESPAÑOL. SOLO JSON válido.",
    rac_eval_system:"Eres evaluador de escritura académica STAAR. Evalúa respuesta RAC del estudiante. SOLO JSON válido.",
  },
  en: {
    appName:"LecturaBloom", tagline:"Reading Comprehension · Bloom · TEKS",
    iam_teacher:"👩‍🏫 I'm a Teacher", iam_student:"🎒 I'm a Student",
    teacher_panel:"Teacher Dashboard", student_zone:"Student Zone", student_label:"Student",
    back_home:"← Home",
    teacher_setup_title:"📚 New Class Session", teacher_setup_sub:"Set up the text and TEKS before class starts.",
    session_name_label:"Session name", session_name_placeholder:"E.g.: Week 3 — The Cell",
    grade_label:"Grade", grade_placeholder:"E.g.: 4th grade", teks_label:"TEKS", teks_placeholder:"TEKS §110.6(b)(6)(A)...",
    objective_label:"Learning Objective", objective_placeholder:"The student will...",
    reading_label:"Reading Text", reading_placeholder:"Paste the text here...",
    save_btn:"✅ Save Session & Activate", saving_btn:"Saving...", fill_all:"Please fill in all fields.",
    how_works:"How does it work?",
    steps:["Teacher — Set text, TEKS, and objective.","Class — Initial scaffolding with students.","Student — Multiple-choice questions scaled by Bloom.","AI — Diagnoses and personalizes.","RAC Ticket — Guided constructed response.","History — Access past sessions anytime."],
    history_title:"📅 Session History", history_empty:"No past sessions.",
    history_loading:"Loading history...", session_of:"Session from", students_count:"students",
    view_session:"View session →", new_session:"+ New Session",
    session_code_label:"Session Code", session_code_sub:"Share this code with your students",
    enter_code:"Enter session code", enter_code_placeholder:"E.g.: LUNA42", enter_code_btn:"Enter →",
    code_not_found:"Code not found. Check with your teacher.", code_loading:"Looking up session...",
    share_code:"📋 Copy code", copied:"Copied!", delete_session:"🗑️ Delete session",
    confirm_delete:"Are you sure you want to delete this session?",
    welcome_title:"👋 Welcome", welcome_sub:"Show what you understood. The app adapts to your level.",
    learning_objective:"Learning Objective", your_name:"Your name", name_placeholder:"Type your name...", start_btn:"🚀 Start",
    question_of:"Question", of:"of", confirm_btn:"Confirm →", continue_btn:"Continue →",
    loading_questions:"Generating questions...", loading_generic:"Loading...",
    scaffold_title:"🔨 Scaffolding Exercise", activity_label:"Activity", hint_label:"💡 Show hint",
    write_here:"Write your answer...", next_step:"Next →", complete_scaffold:"✅ Complete",
    ref_text:"Reference text", loading_scaffold:"Generating scaffolding...",
    exit_title:"🎫 Exit Ticket", exit_sub:"Use the RAC strategy: Restate · Answer · Cite Evidence.",
    rac_r:"R — Restate the question", rac_r_hint:"Rewrite the question in your own words as a complete sentence.",
    rac_a:"A — Answer", rac_a_hint:"Give your answer directly and clearly.",
    rac_c:"C — Cite Evidence", rac_c_hint:"Support with textual evidence using quotes or paraphrasing.",
    rac_example_label:"RAC Structure",
    rac_placeholder_r:"The text is about...", rac_placeholder_a:"I think...", rac_placeholder_c:"According to the text, '...'",
    send_exit:"Submit Ticket 🎫", loading_exit:"Generating exit ticket...",
    rac_model_answer:"Model Answer",
    great_job:"Great job", result_pass:"You demonstrated text comprehension!", result_fail:"We keep working together!",
    your_level:"Your comprehension level", bloom_label:"Bloom — Level", teacher_will_get:"Your teacher will receive a detailed report.",
    report_title:"📊 Intervention Report", strengths:"✅ Strengths", gaps:"⚠️ Gaps",
    intervention_groups:"👥 Intervention Groups", priority:"Priority", bloom_range:"Bloom",
    students_label:"Students", focus_label:"Focus", strategies_label:"Strategies", activities_label:"Activities",
    immediate_actions:"⚡ Immediate Actions", next_steps:"📅 Next Steps",
    no_data:"No student data yet.", loading_report:"Generating intervention plan...",
    teacher_not_set:"The teacher hasn't set up the reading yet.",
    session_detail:"Session Detail", back_history:"← History", student_detail:"Student Detail",
    bloom_score:"Bloom Level", exit_result:"Exit Ticket", scaffolding_needed:"Needed Scaffolding",
    perf_great:"Doing great", perf_progress:"In progress", perf_support:"Needs support",
    tap_student:"Tap a student to see their detail", ind_strengths:"💪 Strengths", ind_weaknesses:"📈 To work on",
    gen_analysis:"Generate the plan to see each student's strengths and areas", report_saved:"Plan saved ✓", regen_plan:"🔄 Regenerate plan",
    rac_response:"RAC Response", rac_eval:"RAC Evaluation",
    yes:"Yes", no:"No", score:"Score",
    intervention_plan:"Intervention Plan", generate_plan:"Generate Intervention Plan",
    bloom:["Remember","Understand","Apply","Analyze","Evaluate","Create"],
    bloom_desc:["Recall information","Explain in own words","Use in new situations","Break into parts","Justify decisions","Produce new ideas"],
    // Auth
    login_title:"👩‍🏫 Teacher Access", login_sub:"Sign in to manage your classes.",
    signup_title:"Create account", login_tab:"Sign in", signup_tab:"Sign up",
    email_label:"Email", email_placeholder:"your@email.com",
    password_label:"Password", password_placeholder:"At least 6 characters",
    login_btn:"Enter →", signup_btn:"Create account →",
    logging_in:"Signing in...", signing_up:"Creating account...",
    logout_btn:"Sign out", welcome_teacher:"Welcome",
    auth_error:"Authentication error. Check your email and password.",
    confirm_email:"Account created! Check your email to confirm.",
    qlang:"English", scaffold_lang:"English",
    q_system:`You are a specialist in Bloom's Taxonomy and the Texas STAAR exam. ALWAYS ADAPT difficulty, vocabulary, and sentence length to the GRADE provided: grades 1-2 very basic vocabulary and very short sentences with literal questions; grade 3 simple vocabulary and concrete questions; grades 4-5 intermediate difficulty, mix of literal and inferential, grade-level vocabulary; grades 6-8 academic language, complex inferences, and advanced vocabulary. Questions MUST align directly with the provided TEKS and LEARNING OBJECTIVE: focus each question on the specific skill named in the TEKS and objective. Generate 6 multiple-choice questions in ENGLISH, one per Bloom level: stem with text context, 4 plausible choices, types: main idea, inference, vocabulary in context, text structure, author's purpose. No "all of the above". ONLY valid JSON no backticks.`,
    sc_system:"You are an expert in reading strategies. Generate a SCAFFOLDING exercise in ENGLISH. ONLY valid JSON.",
    exit_system:`You are a STAAR assessment expert. Generate an EXIT TICKET in ENGLISH: open-ended constructed response, STAAR-aligned, not covered in class, requires RAC strategy (R=Restate, A=Answer, C=Cite Evidence). ONLY valid JSON.`,
    rep_system:"You are an education specialist. Generate a detailed intervention plan in ENGLISH. ONLY valid JSON.",
    rac_eval_system:"You are a STAAR academic writing evaluator. Evaluate the student's RAC response. ONLY valid JSON.",
  }
};

const getBloom = (lang) => [
  {id:1,accent:"#2196F3",icon:"🧩"},{id:2,accent:"#4CAF50",icon:"💡"},
  {id:3,accent:"#FF9800",icon:"⚙️"},{id:4,accent:"#E91E63",icon:"🔍"},
  {id:5,accent:"#9C27B0",icon:"⚖️"},{id:6,accent:"#009688",icon:"✨"},
].map((b,i)=>({...b,name:T[lang].bloom[i],desc:T[lang].bloom_desc[i]}));

const PHASES = {TEACHER_SETUP:"ts",HISTORY:"hi",SESSION_DETAIL:"sd",STUDENT_INTRO:"si",STUDENT_CODE:"sc2",QUESTIONS:"q",SCAFFOLDING:"sc",EXIT_TICKET:"et",RESULTS:"r",TEACHER_REPORT:"tr"};

async function callClaude(sys, user, max=2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:max,system:sys,messages:[{role:"user",content:user}]}),
  });
  const d = await res.json();
  const raw = d.content?.map(b=>b.text||"").join("\n")||"";
  try { return JSON.parse(raw.replace(/```json|```/g,"").trim()); } catch { return {raw}; }
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",fontFamily:"'Georgia','Times New Roman',serif",color:"#f0ece4"},
  hdr:{background:"rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"0.9rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(10px)",flexWrap:"wrap",gap:"0.5rem"},
  htitle:{fontSize:"1.3rem",fontWeight:"700",color:"#f9d56e",margin:0},
  hsub:{fontSize:"0.7rem",color:"rgba(255,255,255,0.45)",margin:0},
  main:{maxWidth:"900px",margin:"0 auto",padding:"1.5rem 1rem"},
  card:{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"16px",padding:"1.5rem",marginBottom:"1.2rem",backdropFilter:"blur(8px)"},
  ctitle:{fontSize:"1.1rem",fontWeight:"700",color:"#f9d56e",marginTop:0,marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},
  lbl:{display:"block",fontSize:"0.75rem",letterSpacing:"0.1em",color:"rgba(255,255,255,0.55)",marginBottom:"0.35rem",textTransform:"uppercase"},
  inp:{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"0.7rem 0.9rem",color:"#f0ece4",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"},
  ta:{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"0.7rem 0.9rem",color:"#f0ece4",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",resize:"vertical",minHeight:"110px",boxSizing:"border-box"},
  btn:{background:"linear-gradient(135deg,#f9d56e,#f0a500)",color:"#1a1a2e",border:"none",borderRadius:"8px",padding:"0.8rem 1.8rem",fontSize:"0.9rem",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"},
  bto:{background:"transparent",color:"#f9d56e",border:"1px solid #f9d56e",borderRadius:"8px",padding:"0.65rem 1.3rem",fontSize:"0.85rem",cursor:"pointer",fontFamily:"inherit"},
  bts:{background:"rgba(255,255,255,0.09)",color:"#f0ece4",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"6px",padding:"0.45rem 0.9rem",fontSize:"0.8rem",cursor:"pointer",fontFamily:"inherit"},
  btsm:{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"6px",padding:"0.35rem 0.7rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"inherit"},
  pbar:{background:"rgba(255,255,255,0.1)",borderRadius:"999px",height:"5px",overflow:"hidden",marginBottom:"0.5rem"},
  pfill:(p,c)=>({width:`${p}%`,height:"100%",background:c,borderRadius:"999px",transition:"width 0.5s ease"}),
  optBtn:(sel,correct,rev)=>{
    if(!rev) return {width:"100%",textAlign:"left",background:sel?"rgba(249,213,110,0.15)":"rgba(255,255,255,0.04)",border:sel?"1px solid #f9d56e":"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"0.85rem 1rem",color:"#f0ece4",fontSize:"0.88rem",cursor:"pointer",marginBottom:"0.5rem",fontFamily:"inherit"};
    const base={width:"100%",textAlign:"left",borderRadius:"8px",padding:"0.85rem 1rem",fontSize:"0.88rem",cursor:"default",marginBottom:"0.5rem",fontFamily:"inherit",border:"1px solid transparent"};
    if(correct) return {...base,background:"rgba(76,175,80,0.2)",border:"1px solid #4CAF50",color:"#81C784"};
    if(sel&&!correct) return {...base,background:"rgba(244,67,54,0.15)",border:"1px solid #F44336",color:"#EF9A9A"};
    return {...base,background:"rgba(255,255,255,0.02)",color:"rgba(255,255,255,0.28)"};
  },
  sec:{fontSize:"0.68rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.38)",marginBottom:"0.6rem",marginTop:0},
  spin:{width:"38px",height:"38px",border:"3px solid rgba(249,213,110,0.15)",borderTop:"3px solid #f9d56e",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"2rem auto"},
  badge:(lv,lang)=>{const b=getBloom(lang)[lv-1];return{background:b?.accent+"33",border:`1px solid ${b?.accent}55`,color:b?.accent,borderRadius:"6px",padding:"0.18rem 0.55rem",fontSize:"0.67rem",fontWeight:"700"};},
  pill:(c)=>({display:"inline-flex",alignItems:"center",background:c+"33",border:`1px solid ${c}55`,color:c,borderRadius:"999px",padding:"0.2rem 0.65rem",fontSize:"0.7rem",fontWeight:"600"}),
  feedback:(ok)=>({marginTop:"0.8rem",padding:"0.9rem 1rem",borderRadius:"10px",background:ok?"rgba(76,175,80,0.1)":"rgba(244,67,54,0.08)",border:`1px solid ${ok?"#4CAF50":"#F44336"}33`,fontSize:"0.88rem",color:"rgba(255,255,255,0.82)",lineHeight:"1.6"}),
  langBtn:(a)=>({background:a?"rgba(249,213,110,0.18)":"transparent",border:a?"1px solid #f9d56e":"1px solid rgba(255,255,255,0.18)",color:a?"#f9d56e":"rgba(255,255,255,0.42)",borderRadius:"6px",padding:"0.3rem 0.65rem",fontSize:"0.78rem",cursor:"pointer",fontFamily:"inherit",fontWeight:a?"700":"400"}),
  divider:{borderColor:"rgba(255,255,255,0.08)",margin:"1.2rem 0"},
  // History card
  histCard:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"1rem 1.2rem",marginBottom:"0.8rem",cursor:"pointer",transition:"background 0.15s",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"1rem",flexWrap:"wrap"},
  // Student row
  studentRow:{padding:"0.9rem 1rem",borderRadius:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",marginBottom:"0.6rem"},
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function LangToggle({lang,setLang}) {
  return <div style={{display:"flex",gap:"0.35rem"}}>
    <button style={S.langBtn(lang==="es")} onClick={()=>setLang("es")}>🇲🇽 ES</button>
    <button style={S.langBtn(lang==="en")} onClick={()=>setLang("en")}>🇺🇸 EN</button>
  </div>;
}
function Spinner({msg}) {
  return <div style={{textAlign:"center",padding:"2.5rem 1rem"}}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={S.spin}/><p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.85rem",marginTop:"0.5rem"}}>{msg}</p>
  </div>;
}
function ScoreChip({label,score,max,color}) {
  const c=color||(score>=max*0.8?"#81C784":score>=max*0.5?"#FFB74D":"#EF9A9A");
  return <span style={{...S.pill(c),gap:"0.3rem"}}><strong>{label}</strong> {score}/{max}</span>;
}
function fmt(dateStr) {
  if(!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
}


// ─── TEACHER LOGIN ────────────────────────────────────────────────────────────
function TeacherLogin({onLogin, lang}) {
  const t=T[lang];
  const [tab,setTab]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  const handle=async()=>{
    if(!email||!password) return;
    setLoading(true); setError(""); setSuccess("");
    const res = tab==="login"
      ? await auth.signIn(email,password)
      : await auth.signUp(email,password);
    setLoading(false);
    if(res.error) { setError(t.auth_error); return; }
    if(tab==="signup") { setSuccess(t.confirm_email); return; }
    if(res.access_token) onLogin({token:res.access_token, email:res.user?.email||email});
  };

  return <div style={{maxWidth:"420px",margin:"3rem auto",padding:"0 1rem"}}>
    <div style={S.card}>
      <h2 style={{...S.ctitle,justifyContent:"center"}}>{t.login_title}</h2>
      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem",textAlign:"center",marginTop:"-0.5rem",marginBottom:"1.5rem"}}>{t.login_sub}</p>
      
      {/* Tabs */}
      <div style={{display:"flex",gap:"0.4rem",marginBottom:"1.5rem",background:"rgba(255,255,255,0.05)",borderRadius:"10px",padding:"0.3rem"}}>
        {[["login",t.login_tab],["signup",t.signup_tab]].map(([key,label])=>(
          <button key={key} style={{flex:1,padding:"0.5rem",borderRadius:"8px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:"0.85rem",fontWeight:tab===key?"700":"400",background:tab===key?"rgba(249,213,110,0.2)":"transparent",color:tab===key?"#f9d56e":"rgba(255,255,255,0.45)",transition:"all 0.2s"}}
            onClick={()=>{setTab(key);setError("");setSuccess("");}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{marginBottom:"1rem"}}>
        <label style={S.lbl}>{t.email_label}</label>
        <input style={S.inp} type="email" placeholder={t.email_placeholder} value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
      </div>
      <div style={{marginBottom:"1.3rem"}}>
        <label style={S.lbl}>{t.password_label}</label>
        <input style={S.inp} type="password" placeholder={t.password_placeholder} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
      </div>

      {error&&<p style={{color:"#EF9A9A",fontSize:"0.82rem",marginBottom:"0.8rem",textAlign:"center"}}>{error}</p>}
      {success&&<p style={{color:"#81C784",fontSize:"0.82rem",marginBottom:"0.8rem",textAlign:"center"}}>{success}</p>}

      <button style={{...S.btn,width:"100%",opacity:(!email||!password||loading)?0.45:1}}
        onClick={handle} disabled={!email||!password||loading}>
        {loading?(tab==="login"?t.logging_in:t.signing_up):(tab==="login"?t.login_btn:t.signup_btn)}
      </button>
    </div>
  </div>;
}

// ─── TEACHER SETUP ────────────────────────────────────────────────────────────
function TeacherSetup({onSubmit,onHistory,lang}) {
  const t=T[lang];
  const [form,setForm]=useState({session_name:"",reading:"",objective:"",teks:"",grade:""});
  const [loading,setLoading]=useState(false);
  const set=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    if(!form.reading||!form.objective||!form.teks) return alert(t.fill_all);
    setLoading(true); onSubmit(form);
  };
  return <div>
    <div style={S.card}>
      <h2 style={S.ctitle}>{t.teacher_setup_title}</h2>
      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem",marginTop:"-0.5rem",marginBottom:"1.2rem"}}>{t.teacher_setup_sub}</p>
      <div style={{marginBottom:"1rem"}}><label style={S.lbl}>{t.session_name_label}</label><input style={S.inp} placeholder={t.session_name_placeholder} value={form.session_name} onChange={set("session_name")}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"1rem"}}>
        <div><label style={S.lbl}>{t.grade_label}</label><input style={S.inp} placeholder={t.grade_placeholder} value={form.grade} onChange={set("grade")}/></div>
        <div><label style={S.lbl}>{t.teks_label}</label><input style={S.inp} placeholder={t.teks_placeholder} value={form.teks} onChange={set("teks")}/></div>
      </div>
      <div style={{marginBottom:"1rem"}}><label style={S.lbl}>{t.objective_label}</label><textarea style={S.ta} rows={2} placeholder={t.objective_placeholder} value={form.objective} onChange={set("objective")}/></div>
      <div style={{marginBottom:"1.3rem"}}><label style={S.lbl}>{t.reading_label}</label><textarea style={{...S.ta,minHeight:"180px"}} placeholder={t.reading_placeholder} value={form.reading} onChange={set("reading")}/></div>
      <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap"}}>
        <button style={S.btn} onClick={submit} disabled={loading}>{loading?t.saving_btn:t.save_btn}</button>
        <button style={S.bto} onClick={onHistory}>📅 {t.history_title}</button>
      </div>
    </div>
    <div style={{...S.card,background:"rgba(249,213,110,0.04)",borderColor:"rgba(249,213,110,0.15)"}}>
      <p style={S.sec}>{t.how_works}</p>
      <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.55)",lineHeight:"1.9"}}>
        {t.steps.map((s,i)=>{const [b,...r]=s.split(" — ");return <div key={i}>{i+1}. <strong style={{color:"#f9d56e"}}>{b}</strong>{r.length?" — "+r.join(" — "):""}</div>;})}
      </div>
    </div>
  </div>;
}

// ─── HISTORY LIST ─────────────────────────────────────────────────────────────
function HistoryList({onSelect,onNew,lang,db}) {
  const t=T[lang];
  const [sessions,setSessions]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const data=await (db||sb).select("sessions","","created_at.desc");
    setSessions(Array.isArray(data)?data:[]); setLoading(false);
  })();},[db]);
  if(loading) return <Spinner msg={t.history_loading}/>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem",flexWrap:"wrap",gap:"0.5rem"}}>
      <h2 style={{...S.ctitle,margin:0}}>{t.history_title}</h2>
      <button style={S.btn} onClick={onNew}>{t.new_session}</button>
    </div>
    {sessions.length===0&&<div style={S.card}><p style={{textAlign:"center",color:"rgba(255,255,255,0.35)",margin:0}}>{t.history_empty}</p></div>}
    {sessions.map(s=>(
      <div key={s.id} style={S.histCard} onClick={()=>onSelect(s)}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.09)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
        <div>
          <div style={{fontWeight:"700",color:"#f9d56e",marginBottom:"0.25rem"}}>{s.session_name||`${t.session_of} ${fmt(s.created_at)}`}</div>
          <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.4)"}}>{s.grade&&`${s.grade} · `}{s.teks}</div>
          <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.5)",marginTop:"0.2rem",maxWidth:"480px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.objective}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.4rem"}}>
          <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.35)"}}>{fmt(s.created_at)}</div>
          {s.session_code&&<span style={{fontSize:"1.1rem",fontWeight:"900",color:"#f9d56e",letterSpacing:"0.1em"}}>{s.session_code}</span>}
          <div style={{display:"flex",gap:"0.4rem"}}>
            <span style={{...S.pill("#64B5F6")}}>{t.view_session}</span>
            <span style={{...S.pill("#EF9A9A"),cursor:"pointer"}} onClick={e=>{e.stopPropagation();if(window.confirm(t.confirm_delete)){sb.delete("sessions",s.id);setSessions(p=>p.filter(x=>x.id!==s.id));}}}>{t.delete_session}</span>
          </div>
        </div>
      </div>
    ))}
  </div>;
}

// ─── SESSION DETAIL ────────────────────────────────────────────────────────────
function SessionDetail({session,onBack,lang,db}) {
  const t=T[lang];
  const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [report,setReport]=useState(session.intervention_report||null);
  const [genReport,setGenReport]=useState(false);
  const bl=getBloom(lang);

  useEffect(()=>{(async()=>{
    // Reload session from Supabase to get latest intervention_report
    const fresh = await (db||sb).selectOne("sessions", `id=eq.${session.id}`);
    if(fresh?.intervention_report) setReport(fresh.intervention_report);
    const data=await (db||sb).select("student_results",`session_id=eq.${session.id}`,"created_at.asc");
    setStudents(Array.isArray(data)?data:[]); setLoading(false);
  })();},[session.id]);

  const generateReport=async()=>{
    setGenReport(true);
    const sum=students.map(s=>`${s.student_name}: Bloom ${s.bloom_score}/6, exit ${s.exit_correct?"correct":"incorrect"}, scaffolding ${s.needed_scaffolding?"yes":"no"}`).join("\n");
    const r=await callClaude(t.rep_system,
      `Objective:"${session.objective}"\nTEKS:"${session.teks}"\nLanguage:${t.scaffold_lang}\nStudents:\n${sum}\n\nFor EACH student provide individual strengths and areas to work on. Then group students for intervention. JSON:\n{"summary":"","studentAnalysis":[{"name":"","strengths":["",""],"weaknesses":["",""]}],"interventionGroups":[{"groupName":"","students":[],"bloomRange":"","priority":"high|medium|low","focus":"","strategies":[],"suggestedActivities":[]}],"immediateActions":[],"nextSteps":""}`
    ,3000);
    setReport(r); setGenReport(false);
    // Save to Supabase so we don't regenerate (and waste AI) next time
    if(r&&!r.raw){ 
      try{ 
        await (db||sb).update("sessions",session.id,{intervention_report:r});
      }catch(e){ console.error("Save plan error:", e); } 
    }
  };

  if(loading) return <Spinner msg={t.loading_generic}/>;

  const pc={alta:"#F44336",high:"#F44336",media:"#FF9800",medium:"#FF9800",baja:"#4CAF50",low:"#4CAF50"};

  return <div>
    <button style={{...S.bts,marginBottom:"1rem"}} onClick={onBack}>{t.back_history}</button>

    {/* Session header */}
    <div style={{...S.card,background:"rgba(33,150,243,0.07)",borderColor:"rgba(33,150,243,0.25)"}}>
      <h2 style={{...S.ctitle,color:"#64B5F6"}}>{session.session_name||t.session_detail}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"0.5rem",fontSize:"0.82rem",color:"rgba(255,255,255,0.55)"}}>
        <div>📅 {fmt(session.created_at)}</div>
        {session.grade&&<div>🏫 {session.grade}</div>}
        <div>📋 {session.teks}</div>
        <div>👥 {students.length} {t.students_label}</div>
      </div>
      <div style={{marginTop:"0.7rem",padding:"0.6rem 0.8rem",borderRadius:"8px",background:"rgba(255,255,255,0.04)",fontSize:"0.85rem",color:"#f9d56e"}}>{session.objective}</div>
    </div>

    {/* Stats row */}
    {students.length>0&&(()=>{
      const avg=(students.reduce((s,x)=>s+(x.bloom_score||0),0)/students.length).toFixed(1);
      const passed=students.filter(x=>x.exit_correct).length;
      const scaff=students.filter(x=>x.needed_scaffolding).length;
      return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.8rem",marginBottom:"1.2rem"}}>
        {[["📊",avg,"6","Bloom avg","#64B5F6"],[`${passed}/${students.length}`,"","",lang==="es"?"Tiquete ✓":"Exit ✓","#81C784"],[scaff,"","",lang==="es"?"Escalofoneo":"Scaffolding","#FFB74D"]].map(([v,v2,v3,label,color],i)=>(
          <div key={i} style={{...S.card,margin:0,textAlign:"center",padding:"1rem"}}>
            <div style={{fontSize:i===0?"1.5rem":"1.8rem",fontWeight:"700",color}}>{v}{v2&&<span style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.4)"}}>/{v3}</span>}</div>
            <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",marginTop:"0.2rem"}}>{label}</div>
          </div>
        ))}
      </div>;
    })()}

    {/* Student performance cards */}
    <div style={S.card}>
      <p style={S.sec}>{t.students_label}</p>
      {students.length===0&&<p style={{color:"rgba(255,255,255,0.35)",textAlign:"center"}}>{t.no_data}</p>}
      {students.length>0&&<p style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.35)",marginTop:"-0.3rem",marginBottom:"0.9rem"}}>{t.tap_student}</p>}
      {/* Color-coded cards grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.6rem"}}>
        {students.map(s=>{
          // Performance level: green=great, yellow=progress, red=needs support
          const bloom=s.bloom_score||0;
          const perf = (bloom>=5&&s.exit_correct) ? "great" : (bloom>=3&&!s.needed_scaffolding) ? "progress" : "support";
          const pcolor = {great:"#4CAF50",progress:"#FF9800",support:"#F44336"}[perf];
          const plabel = {great:t.perf_great,progress:t.perf_progress,support:t.perf_support}[perf];
          const isSel = selected?.id===s.id;
          return <div key={s.id} onClick={()=>setSelected(isSel?null:s)}
            style={{cursor:"pointer",padding:"0.8rem",borderRadius:"12px",background:pcolor+"14",border:isSel?`2px solid ${pcolor}`:`1px solid ${pcolor}40`,transition:"all 0.2s",textAlign:"center"}}>
            <div style={{width:"12px",height:"12px",borderRadius:"50%",background:pcolor,margin:"0 auto 0.5rem"}}/>
            <div style={{fontWeight:"700",fontSize:"0.9rem",marginBottom:"0.2rem"}}>{s.student_name} <span style={{fontSize:"0.7rem",fontWeight:"400"}}>{s.lang==="en"?"🇺🇸":"🇲🇽"}</span></div>
            <div style={{fontSize:"0.68rem",color:pcolor,fontWeight:"600"}}>{plabel}</div>
            <div style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.35)",marginTop:"0.3rem"}}>Bloom {bloom}/6 · {s.exit_correct?"✅":"❌"}</div>
          </div>;
        })}
      </div>

      {/* Expanded detail of selected student */}
      {selected&&(()=>{
        const s=selected;
        const ind=report?.studentAnalysis?.find(a=>a.name?.toLowerCase().trim()===s.student_name?.toLowerCase().trim());
        return <div style={{marginTop:"1rem",padding:"1.1rem",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(249,213,110,0.2)",animation:"fadeIn 0.25s ease"}}>
          <h3 style={{margin:"0 0 0.8rem",color:"#f9d56e",fontSize:"1.05rem"}}>{s.student_name}</h3>
          {/* Individual strengths/weaknesses from saved report */}
          {ind&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem",marginBottom:"1rem"}}>
            <div style={{padding:"0.7rem",borderRadius:"8px",background:"rgba(76,175,80,0.08)",border:"1px solid rgba(76,175,80,0.2)"}}>
              <p style={{...S.sec,margin:"0 0 0.4rem",color:"#81C784"}}>{t.ind_strengths}</p>
              {ind.strengths?.map((x,i)=><div key={i} style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.7)",marginBottom:"0.25rem",lineHeight:"1.4"}}>• {x}</div>)}
            </div>
            <div style={{padding:"0.7rem",borderRadius:"8px",background:"rgba(255,152,0,0.08)",border:"1px solid rgba(255,152,0,0.2)"}}>
              <p style={{...S.sec,margin:"0 0 0.4rem",color:"#FFB74D"}}>{t.ind_weaknesses}</p>
              {ind.weaknesses?.map((x,i)=><div key={i} style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.7)",marginBottom:"0.25rem",lineHeight:"1.4"}}>• {x}</div>)}
            </div>
          </div>}
          {!ind&&<p style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.35)",fontStyle:"italic",marginBottom:"1rem"}}>{t.gen_analysis}</p>}
          {/* RAC response */}
          {s.rac_response&&<div style={{marginBottom:"0.8rem"}}>
            <p style={S.sec}>{t.rac_response}</p>
            {[["R","#2196F3",s.rac_response.r],["A","#4CAF50",s.rac_response.a],["C","#FF9800",s.rac_response.c]].map(([l,c,v])=>v&&(
              <div key={l} style={{marginBottom:"0.5rem",padding:"0.6rem 0.8rem",borderRadius:"8px",background:c+"0d",border:`1px solid ${c}22`}}>
                <strong style={{color:c,fontSize:"0.78rem"}}>{l}:</strong> <span style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.75)"}}>{v}</span>
              </div>
            ))}
          </div>}
          {/* RAC scores */}
          {s.rac_evaluation&&<div>
            <p style={S.sec}>{t.rac_eval}</p>
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"0.5rem"}}>
              <ScoreChip label="R" score={s.rac_evaluation.rScore} max={2}/>
              <ScoreChip label="A" score={s.rac_evaluation.aScore} max={2}/>
              <ScoreChip label="C" score={s.rac_evaluation.cScore} max={2}/>
              <ScoreChip label="Total" score={s.rac_evaluation.totalScore} max={s.rac_evaluation.maxScore}/>
            </div>
            {s.rac_evaluation.overallFeedback&&<p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.55)",margin:0,lineHeight:"1.5"}}>{s.rac_evaluation.overallFeedback}</p>}
          </div>}
        </div>;
      })()}
    </div>

    {/* Intervention plan: groups + actions + next steps only */}
    {students.length>0&&<div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h3 style={{...S.ctitle,margin:0,fontSize:"1rem"}}>{t.intervention_plan}</h3>
        {!report&&<button style={S.btn} onClick={generateReport} disabled={genReport}>
          {genReport?<span>⏳ {lang==="es"?"Generando...":"Generating..."}</span>:`🧠 ${t.generate_plan}`}
        </button>}
        {report&&<div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:"0.72rem",color:"#81C784"}}>{t.report_saved}</span>
          <button style={{...S.bts,fontSize:"0.72rem"}} onClick={generateReport} disabled={genReport}>{t.regen_plan}</button>
        </div>}
      </div>
      {genReport&&<Spinner msg={t.loading_report}/>}
      {report&&!genReport&&<div style={{animation:"fadeIn 0.3s ease"}}>
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:"0.85rem",marginBottom:"1rem",lineHeight:"1.6"}}>{report.summary}</p>
        {report.interventionGroups?.map((g,i)=>{const c=pc[g.priority]||"#888";return(
          <div key={i} style={{padding:"0.9rem",borderRadius:"10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${c}33`,marginBottom:"0.8rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.4rem",flexWrap:"wrap",gap:"0.4rem"}}>
              <strong style={{color:"#f9d56e"}}>{g.groupName}</strong>
              <span style={{...S.pill(c),fontSize:"0.62rem"}}>{t.priority}: {g.priority}</span>
            </div>
            <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.38)",marginBottom:"0.4rem"}}>{t.bloom_range}: {g.bloomRange} · {t.students_label}: {g.students?.join(", ")}</div>
            <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.65)",marginBottom:"0.6rem"}}><strong>{t.focus_label}:</strong> {g.focus}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem"}}>
              <div><p style={{...S.sec,marginBottom:"0.3rem"}}>{t.strategies_label}</p>{g.strategies?.map((s,j)=><div key={j} style={{fontSize:"0.77rem",color:"rgba(255,255,255,0.55)",marginBottom:"0.2rem"}}>→ {s}</div>)}</div>
              <div><p style={{...S.sec,marginBottom:"0.3rem"}}>{t.activities_label}</p>{g.suggestedActivities?.map((a,j)=><div key={j} style={{fontSize:"0.77rem",color:"rgba(255,255,255,0.55)",marginBottom:"0.2rem"}}>• {a}</div>)}</div>
            </div>
          </div>
        );})}
        <div style={{padding:"0.9rem",borderRadius:"10px",background:"rgba(249,213,110,0.04)",border:"1px solid rgba(249,213,110,0.15)"}}>
          <p style={{...S.sec,marginBottom:"0.5rem"}}>{t.immediate_actions}</p>
          {report.immediateActions?.map((a,i)=><div key={i} style={{fontSize:"0.85rem",color:"#f9d56e",marginBottom:"0.35rem"}}>{i+1}. {a}</div>)}
          <hr style={S.divider}/>
          <p style={{...S.sec,marginBottom:"0.4rem"}}>{t.next_steps}</p>
          <p style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.55)",margin:0,lineHeight:"1.6"}}>{report.nextSteps}</p>
        </div>
      </div>}
    </div>}
  </div>;
}


// ─── STUDENT CODE ENTRY ───────────────────────────────────────────────────────
function StudentCodeEntry({onEnter,lang}) {
  const t=T[lang];
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const handle=async()=>{
    if(!input.trim()) return;
    setLoading(true); setError("");
    const code=input.trim().toUpperCase();
    const session=await sb.selectOne("sessions",`session_code=eq.${code}`);
    if(!session){setError(t.code_not_found);setLoading(false);return;}
    onEnter(session);
  };
  return <div style={{...S.card,maxWidth:"420px",margin:"2rem auto"}}>
    <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
      <div style={{fontSize:"2.5rem",marginBottom:"0.5rem"}}>🎒</div>
      <h2 style={{...S.ctitle,justifyContent:"center",margin:"0 0 0.3rem"}}>{t.enter_code}</h2>
      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem",margin:0}}>{lang==="es"?"Pide el código a tu maestra/o":"Ask your teacher for the code"}</p>
    </div>
    <input
      style={{...S.inp,fontSize:"1.4rem",textAlign:"center",letterSpacing:"0.2em",fontWeight:"700",marginBottom:"0.8rem",textTransform:"uppercase"}}
      placeholder={t.enter_code_placeholder}
      value={input}
      onChange={e=>setInput(e.target.value.toUpperCase())}
      onKeyDown={e=>e.key==="Enter"&&handle()}
      maxLength={8}
    />
    {error&&<p style={{color:"#EF9A9A",fontSize:"0.82rem",textAlign:"center",margin:"0 0 0.8rem"}}>{error}</p>}
    <button style={{...S.btn,width:"100%",opacity:(!input.trim()||loading)?0.45:1}}
      onClick={handle} disabled={!input.trim()||loading}>
      {loading?t.code_loading:t.enter_code_btn}
    </button>
  </div>;
}

// ─── ACTIVE SESSION CODE DISPLAY (for teacher) ────────────────────────────────
function ActiveCodeDisplay({code,lang,onClose}) {
  const t=T[lang];
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  return <div style={{...S.card,background:"rgba(76,175,80,0.08)",borderColor:"rgba(76,175,80,0.3)",textAlign:"center",marginBottom:"1.2rem"}}>
    <p style={{...S.sec,margin:"0 0 0.5rem"}}>{t.session_code_label}</p>
    <div style={{fontSize:"3rem",fontWeight:"900",letterSpacing:"0.2em",color:"#f9d56e",margin:"0.5rem 0"}}>{code}</div>
    <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.8rem",margin:"0 0 1rem"}}>{t.session_code_sub}</p>
    <div style={{display:"flex",gap:"0.6rem",justifyContent:"center",flexWrap:"wrap"}}>
      <button style={S.btn} onClick={copy}>{copied?t.copied:t.share_code}</button>
      <button style={S.bts} onClick={onClose}>← {lang==="es"?"Ver historial":"View history"}</button>
    </div>
  </div>;
}

// ─── STUDENT INTRO ────────────────────────────────────────────────────────────
function StudentIntro({setup,onStart,lang,loading}) {
  const t=T[lang];
  const [name,setName]=useState("");
  return <div style={S.card}>
    <h2 style={S.ctitle}>{t.welcome_title}</h2>
    <p style={{color:"rgba(255,255,255,0.55)",lineHeight:"1.7",marginBottom:"1.2rem"}}>{t.welcome_sub}</p>
    <div style={{...S.card,background:"rgba(255,255,255,0.03)",marginBottom:"1rem",padding:"1rem"}}>
      <p style={S.sec}>{t.learning_objective}</p>
      <p style={{color:"#f9d56e",margin:0,fontSize:"0.9rem"}}>{setup.objective}</p>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem",padding:"0.65rem 0.9rem",borderRadius:"8px",background:"rgba(249,213,110,0.06)",border:"1px solid rgba(249,213,110,0.18)"}}>
      <span>{lang==="es"?"🇲🇽":"🇺🇸"}</span>
      <span style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.5)"}}>{lang==="es"?"Las preguntas se generarán en español.":"Questions will be generated in English."} {lang==="es"?"Cambia arriba si prefieres English.":"Switch above if you prefer español."}</span>
    </div>
    <div style={{marginBottom:"1.2rem"}}><label style={S.lbl}>{t.your_name}</label><input style={S.inp} placeholder={t.name_placeholder} value={name} onChange={e=>setName(e.target.value)} disabled={loading}/></div>
    <button style={{...S.btn,opacity:(!name||loading)?0.45:1}} onClick={()=>name&&!loading&&onStart(name)} disabled={!name||loading}>
      {loading?(lang==="es"?"⏳ Generando preguntas...":"⏳ Generating questions..."):t.start_btn}
    </button>
  </div>;
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────
function QuestionCard({question,index,total,onAnswer,bloomLevel,lang}) {
  const t=T[lang]; const bl=getBloom(lang)[bloomLevel-1]||getBloom(lang)[0];
  const [sel,setSel]=useState(null); const [rev,setRev]=useState(false);
  const ok=sel===question.correct;
  return <div style={S.card}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem",flexWrap:"wrap",gap:"0.4rem"}}>
      <span style={{fontSize:"0.76rem",color:"rgba(255,255,255,0.38)"}}>{t.question_of} {index+1} {t.of} {total}</span>
      <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
        {question.staarType&&<span style={{background:"rgba(249,213,110,0.13)",border:"1px solid rgba(249,213,110,0.28)",color:"#f9d56e",borderRadius:"6px",padding:"0.17rem 0.5rem",fontSize:"0.65rem",fontWeight:"600"}}>🏆 {question.staarType}</span>}
        <span style={S.badge(bloomLevel,lang)}>{bl.icon} {bl.name}</span>
      </div>
    </div>
    <div style={S.pbar}><div style={S.pfill((index/total)*100,bl.accent)}/></div>
    <p style={{fontSize:"0.97rem",lineHeight:"1.75",margin:"1rem 0"}}>{question.question}</p>
    <div>{question.options.map((opt,i)=>(
      <button key={i} style={S.optBtn(sel===opt,opt===question.correct,rev)} onClick={()=>!rev&&setSel(opt)}>
        <span style={{fontWeight:"600",marginRight:"0.45rem",opacity:0.45}}>{String.fromCharCode(65+i)}.</span>{opt}
      </button>
    ))}</div>
    {rev&&<div style={{animation:"fadeIn 0.3s ease"}}>
      <div style={S.feedback(ok)}>{ok?"✅ ":"❌ "}{question.explanation}</div>
      <button style={{...S.btn,marginTop:"0.9rem"}} onClick={()=>onAnswer(sel,ok)}>{t.continue_btn}</button>
    </div>}
    {!rev&&<button style={{...S.btn,marginTop:"0.9rem",opacity:sel?1:0.45}} onClick={()=>sel&&setRev(true)} disabled={!sel}>{t.confirm_btn}</button>}
  </div>;
}

// ─── SCAFFOLDING ──────────────────────────────────────────────────────────────
function ScaffoldingExercise({setup,level,onComplete,lang}) {
  const t=T[lang]; const [sc,setSc]=useState(null); const [loading,setLoading]=useState(true);
  const [step,setStep]=useState(0); const [ans,setAns]=useState({});
  useEffect(()=>{(async()=>{
    const r=await callClaude(t.sc_system,
      `Text:"${setup.reading.substring(0,1200)}"\nObjective:"${setup.objective}"\nTEKS:"${setup.teks}"\nBloom level:${level}/6\nGrade:"${setup.grade||''}"\nLanguage:${t.scaffold_lang}\n\nGenerate 4-step scaffolding for a struggling young reader. Use VERY SIMPLE language, SHORT sentences (max 12 words each), warm encouraging tone, one idea at a time. Keep each instruction and activity brief so the child does not get tired reading. JSON:\n{"title":"","intro":"","steps":[{"title":"","instruction":"","activity":"","hint":""}]}`
    ,1800); setSc(r); setLoading(false);
  })();},[]);
  if(loading) return <Spinner msg={t.loading_scaffold}/>;
  const cur=sc?.steps?.[step];
  return <div>
    <div style={{...S.card,borderColor:"rgba(255,165,0,0.25)",background:"rgba(255,165,0,0.04)"}}>
      <h2 style={{...S.ctitle,color:"#FFB74D",fontSize:"1.3rem"}}>{t.scaffold_title}</h2>
      <p style={{color:"rgba(255,255,255,0.7)",fontSize:"1.05rem",marginTop:"-0.2rem",lineHeight:"1.7"}}>{sc?.intro}</p>
    </div>
    <div style={{display:"flex",gap:"0.4rem",marginBottom:"1.2rem",flexWrap:"wrap"}}>
      {sc?.steps?.map((s,i)=><div key={i} style={{flex:1,minWidth:"70px",padding:"0.45rem",borderRadius:"8px",textAlign:"center",fontSize:"0.68rem",background:i<step?"rgba(76,175,80,0.18)":i===step?"rgba(255,183,77,0.18)":"rgba(255,255,255,0.04)",border:i===step?"1px solid #FFB74D":"1px solid transparent",color:i<step?"#81C784":i===step?"#FFB74D":"rgba(255,255,255,0.28)"}}>
        {i<step?"✓":i+1}<br/><span style={{fontSize:"0.62rem"}}>{s.title}</span>
      </div>)}
    </div>
    {cur&&<div style={{...S.card,padding:"1.6rem 1.5rem"}}>
      <h3 style={{color:"#FFB74D",marginTop:0,fontSize:"1.4rem",marginBottom:"1rem"}}>{step+1}. {cur.title}</h3>
      <p style={{lineHeight:"2",marginBottom:"1.3rem",fontSize:"1.18rem",color:"rgba(255,255,255,0.92)"}}>{cur.instruction}</p>
      <div style={{background:"rgba(255,183,77,0.1)",borderRadius:"12px",padding:"1.2rem 1.3rem",marginBottom:"1.2rem",borderLeft:"5px solid #FFB74D"}}>
        <p style={{...S.sec,fontSize:"0.8rem",marginBottom:"0.5rem"}}>{t.activity_label}</p>
        <p style={{margin:0,fontSize:"1.15rem",lineHeight:"1.9",color:"rgba(255,255,255,0.92)"}}>{cur.activity}</p>
      </div>
      <details style={{marginBottom:"1.2rem"}}><summary style={{cursor:"pointer",color:"#FFB74D",fontSize:"1rem",padding:"0.4rem 0"}}>{t.hint_label}</summary>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:"1.05rem",marginTop:"0.5rem",lineHeight:"1.8"}}>{cur.hint}</p></details>
      <textarea style={{...S.ta,minHeight:"90px",marginBottom:"1.2rem",fontSize:"1.1rem",lineHeight:"1.7",padding:"1rem"}} placeholder={t.write_here} value={ans[step]||""} onChange={e=>setAns(a=>({...a,[step]:e.target.value}))}/>
      {step<(sc.steps.length-1)?<button style={{...S.btn,fontSize:"1.1rem",padding:"0.9rem 2rem"}} onClick={()=>setStep(s=>s+1)}>{t.next_step}</button>:<button style={{...S.btn,fontSize:"1.1rem",padding:"0.9rem 2rem"}} onClick={()=>onComplete(ans)}>{t.complete_scaffold}</button>}
    </div>}
    <div style={{...S.card,background:"rgba(255,255,255,0.02)"}}>
      <p style={S.sec}>{t.ref_text}</p>
      <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.52)",lineHeight:"1.7",maxHeight:"180px",overflowY:"auto"}}>{setup.reading}</p>
    </div>
  </div>;
}

// ─── EXIT TICKET (RAC) ────────────────────────────────────────────────────────
function ExitTicket({setup,bloomScore,onComplete,lang}) {
  const t=T[lang];
  const [tk,setTk]=useState(null); const [loading,setLoading]=useState(true);
  const [rac,setRac]=useState({r:"",a:"",c:""});
  const [submitted,setSubmitted]=useState(false);
  const [evaluation,setEvaluation]=useState(null);
  const [evaluating,setEvaluating]=useState(false);

  useEffect(()=>{(async()=>{
    const r=await callClaude(t.exit_system,
      `Text:"${setup.reading.substring(0,1200)}"\nObjective:"${setup.objective}"\nTEKS:"${setup.teks}"\nBloom:${bloomScore}/6\nLanguage:${t.scaffold_lang}\n\nGenerate ONE open-ended STAAR constructed response exit ticket. JSON:\n{"question":"","context":"","bloomLevel":4,"modelAnswer":{"r":"","a":"","c":""}}`
    ,1200); setTk(r); setLoading(false);
  })();},[]);

  const canSubmit=rac.r.trim().length>8&&rac.a.trim().length>8&&rac.c.trim().length>8;

  const handleSubmit=async()=>{
    if(!canSubmit) return;
    setEvaluating(true);
    const ev=await callClaude(
      lang==="es"?"Eres evaluador de escritura STAAR. Evalúa respuesta RAC. SOLO JSON válido.":"You are a STAAR writing evaluator. Evaluate RAC response. ONLY valid JSON.",
      `Question:"${tk.question}"\nText:"${setup.reading.substring(0,600)}"\nObjective:"${setup.objective}"\nRAC:\nR:${rac.r}\nA:${rac.a}\nC:${rac.c}\n\nJSON:\n{"rScore":2,"aScore":2,"cScore":2,"rFeedback":"","aFeedback":"","cFeedback":"","overallFeedback":"","metObjective":true,"totalScore":6,"maxScore":6}`
    ,1000);
    setEvaluation(ev); setEvaluating(false); setSubmitted(true);
    onComplete(ev?.metObjective===true, {r:rac.r,a:rac.a,c:rac.c}, ev);
  };

  const sc=(s,m)=>s>=m*0.8?"#81C784":s>=m*0.5?"#FFB74D":"#EF9A9A";

  if(loading) return <Spinner msg={t.loading_exit}/>;

  return <div>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{...S.card,background:"rgba(156,39,176,0.07)",borderColor:"rgba(156,39,176,0.25)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.4rem"}}>
        <h2 style={{...S.ctitle,margin:0}}>{t.exit_title}</h2>
        <div style={{display:"flex",gap:"0.35rem"}}>
          <span style={{...S.pill("#f9d56e"),fontSize:"0.65rem"}}>🏆 Reto</span>
          <span style={{...S.pill("#CE93D8"),fontSize:"0.65rem"}}>✍️ RAC</span>
        </div>
      </div>
      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem",margin:"0.4rem 0 0"}}>{t.exit_sub}</p>
    </div>

    {/* RAC guide */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.6rem",marginBottom:"1.2rem"}}>
      {[["R","#2196F3",t.rac_r,t.rac_r_hint],["A","#4CAF50",t.rac_a,t.rac_a_hint],["C","#FF9800",t.rac_c,t.rac_c_hint]].map(([l,c,label,hint])=>(
        <div key={l} style={{background:c+"0d",border:`1px solid ${c}28`,borderRadius:"10px",padding:"0.7rem"}}>
          <div style={{fontWeight:"900",fontSize:"1.2rem",color:c}}>{l}</div>
          <div style={{fontSize:"0.7rem",fontWeight:"700",color:c,marginBottom:"0.2rem"}}>{label.split("—")[1]?.trim()||label}</div>
          <div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.42)",lineHeight:"1.4"}}>{hint}</div>
        </div>
      ))}
    </div>

    <div style={S.card}>
      {tk?.context&&<div style={{padding:"0.7rem 0.9rem",borderRadius:"8px",background:"rgba(255,255,255,0.04)",borderLeft:"3px solid #CE93D8",marginBottom:"1rem",fontSize:"0.87rem",fontStyle:"italic",color:"rgba(255,255,255,0.58)"}}>{tk.context}</div>}
      <p style={{fontSize:"1rem",lineHeight:"1.75",fontWeight:"500",marginBottom:"1.3rem"}}>{tk?.question}</p>

      {!submitted&&[["r","#2196F3",t.rac_r,t.rac_placeholder_r],["a","#4CAF50",t.rac_a,t.rac_placeholder_a],["c","#FF9800",t.rac_c,t.rac_placeholder_c]].map(([k,c,label,ph])=>(
        <div key={k} style={{marginBottom:"1rem"}}>
          <label style={{display:"flex",alignItems:"center",gap:"0.45rem",marginBottom:"0.35rem"}}>
            <span style={{fontWeight:"900",fontSize:"0.95rem",color:c}}>{k.toUpperCase()}</span>
            <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.48)"}}>{label.split("—")[1]?.trim()||label}</span>
          </label>
          <textarea style={{...S.ta,minHeight:"70px",borderColor:rac[k].length>8?c+"66":"rgba(255,255,255,0.18)"}}
            placeholder={ph} value={rac[k]} onChange={e=>setRac(v=>({...v,[k]:e.target.value}))}/>
        </div>
      ))}

      {submitted&&evaluation&&<div style={{animation:"fadeIn 0.35s ease"}}>
        <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem",flexWrap:"wrap"}}>
          {[["R",evaluation.rScore,2],["A",evaluation.aScore,2],["C",evaluation.cScore,2]].map(([l,s,m])=>(
            <ScoreChip key={l} label={l} score={s} max={m}/>
          ))}
          <ScoreChip label="Total" score={evaluation.totalScore} max={evaluation.maxScore}/>
        </div>
        {[["r","#2196F3",t.rac_r,rac.r,evaluation.rFeedback],["a","#4CAF50",t.rac_a,rac.a,evaluation.aFeedback],["c","#FF9800",t.rac_c,rac.c,evaluation.cFeedback]].map(([k,c,label,val,fb])=>(
          <div key={k} style={{marginBottom:"0.8rem",padding:"0.8rem 0.9rem",borderRadius:"9px",background:c+"0a",border:`1px solid ${c}25`}}>
            <div style={{fontWeight:"700",color:c,fontSize:"0.75rem",marginBottom:"0.3rem"}}>{k.toUpperCase()} — {label.split("—")[1]?.trim()||label}</div>
            <p style={{margin:"0 0 0.35rem",fontSize:"0.87rem",color:"rgba(255,255,255,0.8)",fontStyle:"italic"}}>"{val}"</p>
            <p style={{margin:0,fontSize:"0.78rem",color:"rgba(255,255,255,0.48)"}}>{fb}</p>
          </div>
        ))}
        <div style={{...S.feedback(evaluation.metObjective),marginBottom:"1rem"}}>{evaluation.metObjective?"✅ ":"🔧 "}{evaluation.overallFeedback}</div>
        {tk?.modelAnswer&&<details style={{marginBottom:"1rem"}}>
          <summary style={{cursor:"pointer",color:"rgba(255,255,255,0.38)",fontSize:"0.78rem"}}>{t.rac_model_answer}</summary>
          <div style={{padding:"0.8rem",borderRadius:"9px",background:"rgba(255,255,255,0.04)",fontSize:"0.82rem",lineHeight:"1.65",color:"rgba(255,255,255,0.58)",marginTop:"0.4rem"}}>
            <div><strong style={{color:"#64B5F6"}}>R:</strong> {tk.modelAnswer.r}</div>
            <div style={{marginTop:"0.3rem"}}><strong style={{color:"#81C784"}}>A:</strong> {tk.modelAnswer.a}</div>
            <div style={{marginTop:"0.3rem"}}><strong style={{color:"#FFB74D"}}>C:</strong> {tk.modelAnswer.c}</div>
          </div>
        </details>}
      </div>}

      {!submitted&&(evaluating?<Spinner msg={lang==="es"?"Evaluando tu RAC...":"Evaluating your RAC..."}/>:
        <button style={{...S.btn,background:"linear-gradient(135deg,#CE93D8,#9C27B0)",color:"white",opacity:canSubmit?1:0.45}}
          onClick={handleSubmit} disabled={!canSubmit}>{t.send_exit}</button>
      )}
    </div>

    <div style={{...S.card,background:"rgba(255,255,255,0.02)"}}>
      <p style={S.sec}>{t.ref_text}</p>
      <p style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.5)",lineHeight:"1.7",maxHeight:"170px",overflowY:"auto"}}>{setup.reading}</p>
    </div>
  </div>;
}

// ─── STUDENT RESULTS ──────────────────────────────────────────────────────────
function StudentResults({studentName,bloomScore,exitCorrect,lang}) {
  const t=T[lang]; const bl=getBloom(lang)[Math.min(Math.round(bloomScore)-1,5)];
  return <div>
    <div style={{...S.card,textAlign:"center"}}>
      <div style={{fontSize:"2.8rem",marginBottom:"0.4rem"}}>{exitCorrect?"🌟":"💪"}</div>
      <h2 style={{color:"#f9d56e",margin:"0 0 0.4rem"}}>{t.great_job}, {studentName}!</h2>
      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.88rem"}}>{exitCorrect?t.result_pass:t.result_fail}</p>
    </div>
    <div style={{...S.card,textAlign:"center"}}>
      <p style={S.sec}>{t.your_level}</p>
      <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:"0.45rem",padding:"1.3rem 1.8rem",background:bl?.accent+"1a",border:`2px solid ${bl?.accent}55`,borderRadius:"12px"}}>
        <span style={{fontSize:"1.8rem"}}>{bl?.icon}</span>
        <span style={{color:bl?.accent,fontWeight:"700",fontSize:"1rem"}}>{bl?.name}</span>
        <span style={{color:"rgba(255,255,255,0.42)",fontSize:"0.75rem"}}>{t.bloom_label} {bloomScore}</span>
      </div>
      <p style={{color:"rgba(255,255,255,0.42)",fontSize:"0.8rem",marginTop:"0.8rem"}}>{t.teacher_will_get}</p>
    </div>
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang,setLang]=useState("es");
  const [mode,setMode]=useState("landing");  // landing | teacher | student | ready
  const [phase,setPhase]=useState(PHASES.TEACHER_SETUP);
  const [setup,setSetup]=useState(null);
  const [sessionId,setSessionId]=useState(null);
  const [studentName,setStudentName]=useState("");
  const [questions,setQuestions]=useState([]);
  const [qLoading,setQLoading]=useState(false);
  const [currentQ,setCurrentQ]=useState(0);
  const [answers,setAnswers]=useState([]);
  const [bloomScore,setBloomScore]=useState(1);
  const [exitCorrect,setExitCorrect]=useState(false);
  const [needScaff,setNeedScaff]=useState(false);
  const [racData,setRacData]=useState(null);
  const [racEval,setRacEval]=useState(null);
  const [selectedSession,setSelectedSession]=useState(null);
  const [activeCode,setActiveCode]=useState(null);
  const [teacher,setTeacher]=useState(null); // {token, email}
  const [sbd,setSbd]=useState(null); // sbWithToken instance
  const t=T[lang];

  const css=`*{box-sizing:border-box}body{margin:0}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}button{transition:opacity 0.15s,transform 0.12s}button:hover:not(:disabled){opacity:0.87;transform:translateY(-1px)}button:disabled{opacity:0.42;cursor:not-allowed}textarea,input{transition:border-color 0.2s}`;

  // Save session to Supabase
  const handleTeacherSubmit=async(form)=>{
    const code=generateCode();
    const db=sbd||sb;
    const row=await db.insert("sessions",{reading:form.reading,objective:form.objective,teks:form.teks,grade:form.grade,session_name:form.session_name,session_date:new Date().toISOString().slice(0,10),session_code:code,teacher_email:teacher?.email||"demo"});
    setSetup({...form,session_code:code}); setSessionId(row?.id||null);
    setQuestions([]); setPhase(PHASES.TEACHER_SETUP); setMode("teacher"); setActiveCode(code);
  };

  // Generate questions per student in their language
  const handleStart=async(name)=>{
    setStudentName(name); setCurrentQ(0); setAnswers([]); setNeedScaff(false);
    setQLoading(true);
    const tl=T[lang];
    const r=await callClaude(tl.q_system,
      `Text:"${setup.reading.substring(0,1400)}"\nObjective:"${setup.objective}"\nTEKS:"${setup.teks}"\nGrade:"${setup.grade}"\nLanguage:${tl.qlang}\n\nGenerate 6 STAAR-aligned questions, one per Bloom level. staarType options: "main idea","inference","vocabulary in context","text structure","author's purpose","literary device","supporting detail". JSON:\n{"questions":[{"bloomLevel":1,"staarType":"main idea","question":"","options":["","","",""],"correct":"","explanation":""}]}`
    ,2500);
    setQuestions(r.questions||[]); setQLoading(false); setPhase(PHASES.QUESTIONS);
  };

  const handleAnswer=(sel,ok)=>{
    const q=questions[currentQ];
    const na=[...answers,{question:q,selected:sel,isCorrect:ok,bloomLevel:q.bloomLevel}];
    setAnswers(na);
    if(currentQ+1>=questions.length){
      const cl={}; na.forEach(a=>{if(!cl[a.bloomLevel])cl[a.bloomLevel]={c:0,t:0};cl[a.bloomLevel].t++;if(a.isCorrect)cl[a.bloomLevel].c++;});
      let max=0; Object.entries(cl).forEach(([lv,s])=>{if(s.c/s.t>=0.5)max=parseInt(lv);});
      const sc=Math.max(1,max); setBloomScore(sc);
      const wrong=na.filter(a=>!a.isCorrect).length;
      if(wrong>=3){setNeedScaff(true);setPhase(PHASES.SCAFFOLDING);}
      else setPhase(PHASES.EXIT_TICKET);
    } else setCurrentQ(c=>c+1);
  };

  // Save student result to Supabase
  const handleExitComplete=async(ok, racResponse, racEvaluation)=>{
    setExitCorrect(ok); setRacData(racResponse); setRacEval(racEvaluation);
    if(sessionId){
      await sb.insert("student_results",{
        session_id:sessionId, student_name:studentName, lang,
        bloom_score:bloomScore, exit_correct:ok,
        needed_scaffolding:needScaff,
        rac_response:racResponse||null,
        rac_evaluation:racEvaluation||null,
      });
    }
    setPhase(PHASES.RESULTS);
  };

  const Header=({sub})=><div style={S.hdr}>
    <div><h1 style={S.htitle}>{t.appName}</h1><p style={S.hsub}>{sub}</p></div>
    <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
      <LangToggle lang={lang} setLang={setLang}/>
      <button style={S.bts} onClick={()=>setMode("landing")}>{t.back_home}</button>
    </div>
  </div>;

  // ── LANDING ──
  if(mode==="landing") return <div style={S.app}>
    <style>{css}</style>
    <div style={S.hdr}><h1 style={S.htitle}>{t.appName}</h1><LangToggle lang={lang} setLang={setLang}/></div>
    <div style={{maxWidth:"620px",margin:"0 auto",padding:"3.5rem 1rem",textAlign:"center",animation:"fadeUp 0.5s ease"}}>
      <div style={{fontSize:"3.5rem",marginBottom:"0.8rem"}}>📖</div>
      <h1 style={{fontSize:"1.9rem",color:"#f9d56e",fontWeight:"700",margin:"0 0 0.4rem"}}>{t.appName}</h1>
      <p style={{color:"rgba(255,255,255,0.42)",fontSize:"0.9rem",marginBottom:"2.5rem",lineHeight:"1.7"}}>{t.tagline}</p>
      <div style={{display:"flex",gap:"0.9rem",justifyContent:"center",flexWrap:"wrap"}}>
        <button style={{...S.btn,fontSize:"0.95rem",padding:"0.9rem 2.2rem"}} onClick={()=>teacher?setMode("teacher"):setMode("teacher_login")}>{t.iam_teacher}</button>
        <button style={{...S.btn,background:"linear-gradient(135deg,#64B5F6,#1565C0)",color:"white",fontSize:"0.95rem",padding:"0.9rem 2.2rem"}}
          onClick={()=>{setMode("student_code");}}>
          {t.iam_student}
        </button>
      </div>
    </div>
  </div>;

  // ── TEACHER LOGIN ──
  if(mode==="teacher_login") return <div style={S.app}><style>{css}</style>
    <div style={S.hdr}><h1 style={S.htitle}>{t.appName}</h1><LangToggle lang={lang} setLang={setLang}/></div>
    <TeacherLogin lang={lang} onLogin={(user)=>{setTeacher(user);setSbd(sbWithToken(user.token));setMode("teacher");setPhase(PHASES.TEACHER_SETUP);}}/>
  </div>;

  // ── TEACHER ──
  if(mode==="teacher") return <div style={S.app}><style>{css}</style>
    <div style={S.hdr}>
      <div><h1 style={S.htitle}>{t.appName}</h1><p style={S.hsub}>{teacher?.email||t.teacher_panel}</p></div>
      <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
        <LangToggle lang={lang} setLang={setLang}/>
        <button style={S.bts} onClick={()=>setMode("landing")}>{t.back_home}</button>
        <button style={{...S.bts,color:"#EF9A9A",borderColor:"rgba(239,154,154,0.3)"}} onClick={async()=>{if(teacher)await auth.signOut(teacher.token);setTeacher(null);setSbd(null);setMode("landing");}}>{t.logout_btn}</button>
      </div>
    </div>
    <div style={S.main}>
      {activeCode&&<ActiveCodeDisplay code={activeCode} lang={lang} onClose={()=>{setActiveCode(null);setPhase(PHASES.HISTORY);}}/>}
      {!activeCode&&phase===PHASES.HISTORY&&<HistoryList lang={lang} db={sbd||sb}
        onSelect={s=>{setSelectedSession(s);setPhase(PHASES.SESSION_DETAIL);}}
        onNew={()=>setPhase(PHASES.TEACHER_SETUP)}/>}
      {!activeCode&&phase===PHASES.SESSION_DETAIL&&selectedSession&&<SessionDetail session={selectedSession} lang={lang} db={sbd||sb}
        onBack={()=>setPhase(PHASES.HISTORY)}/>}
      {!activeCode&&(phase===PHASES.TEACHER_SETUP||!phase)&&<TeacherSetup lang={lang}
        onSubmit={handleTeacherSubmit}
        onHistory={()=>setPhase(PHASES.HISTORY)}/>}
    </div>
  </div>;

  // ── STUDENT CODE ENTRY ──
  if(mode==="student_code") return <div style={S.app}><style>{css}</style>
    <div style={S.hdr}><h1 style={S.htitle}>{t.appName}</h1><div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}><LangToggle lang={lang} setLang={setLang}/><button style={S.bts} onClick={()=>setMode("landing")}>{t.back_home}</button></div></div>
    <div style={S.main}>
      <StudentCodeEntry lang={lang} onEnter={(session)=>{setSetup(session);setSessionId(session.id);setPhase(PHASES.STUDENT_INTRO);setMode("student");}}/>
    </div>
  </div>;

  // ── STUDENT ──
  if(mode==="student"||mode==="ready") return <div style={S.app}><style>{css}</style>
    <Header sub={studentName?`${t.student_label}: ${studentName}`:t.student_zone}/>
    <div style={S.main}>
      {phase===PHASES.STUDENT_INTRO&&<StudentIntro setup={setup} onStart={handleStart} lang={lang} loading={qLoading}/>}
      {phase===PHASES.QUESTIONS&&(questions.length>0
        ?<QuestionCard key={currentQ} question={questions[currentQ]} index={currentQ} total={questions.length} bloomLevel={questions[currentQ].bloomLevel} onAnswer={handleAnswer} lang={lang}/>
        :<Spinner msg={t.loading_questions}/>)}
      {phase===PHASES.SCAFFOLDING&&<ScaffoldingExercise setup={setup} level={bloomScore} onComplete={()=>setPhase(PHASES.EXIT_TICKET)} lang={lang}/>}
      {phase===PHASES.EXIT_TICKET&&<ExitTicket setup={setup} bloomScore={bloomScore} onComplete={handleExitComplete} lang={lang}/>}
      {phase===PHASES.RESULTS&&<StudentResults studentName={studentName} bloomScore={bloomScore} exitCorrect={exitCorrect} lang={lang}/>}
    </div>
  </div>;

  return null;
}
