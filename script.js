// Estado inicial actualizado con los campos de encantamientos y variables internas
let state = {
    attr: 4, hab: 3, ext: 2, charm_atk: 0, vd: 3,
    dmg: 5, netos: 0, charm_dmg: 0, soak: 2
};

/**
 * Función para los botones + y -
 */
function changeVal(field, diff) {
    state[field] = Math.max(0, state[field] + diff);
    document.getElementById(`val-${field}`).value = state[field];
}

/**
 * Permite al usuario tipear el número a mano, 
 * se actualice el estado interno de la app correctamente.
 */
function updateState(field, value) {
    let num = parseInt(value);
    if (isNaN(num) || num < 0) num = 0;
    state[field] = num;
    document.getElementById(`val-${field}`).value = num;
}

/**
 * FASE DE ATAQUE (CON LOGICA DE MULTIPLICADORES PRE Y POST VD)
 */
function tirarAtaque() {
    const totalDice = state.attr + state.hab + state.ext + state.charm_atk;
    if (totalDice <= 0) return;

    const grid = document.getElementById("grid-ataque");
    const resBox = document.getElementById("res-ataque");
    const doubleTens = document.getElementById("double-attack").checked;
    
    // Captura de los nuevos checkboxes de multiplicadores de ataque desde el HTML
    const mPreVD = document.getElementById("mult-pre-vd").checked;
    const mPostVD = document.getElementById("mult-post-vd").checked;

    grid.innerHTML = "";
    resBox.style.display = "none";
    document.getElementById("panel-daño").style.opacity = "0.4";
    document.getElementById("panel-daño").style.pointerEvents = "none";

    for (let i = 0; i < totalDice; i++) {
        let d = document.createElement("div");
        d.className = "die-box die-rolling";
        d.innerText = "?";
        grid.appendChild(d);
    }

    setTimeout(() => {
        let dados = [];
        let totalExitos = 0;

        for (let i = 0; i < totalDice; i++) {
            let r = Math.floor(Math.random() * 10) + 1;
            dados.push(r);
            if (r === 10 && doubleTens) totalExitos += 2;
            else if (r >= 7) totalExitos += 1;
        }

        dados.sort((a,b) => b - a);
        grid.innerHTML = "";

        dados.forEach(val => {
            let d = document.createElement("div");
            d.className = "die-box";
            d.innerText = val;
            if (val === 10 && doubleTens) d.className += " die-gold";
            else if (val >= 7) d.className += " die-success";
            grid.appendChild(d);
        });

        // --- LÓGICA DE MULTIPLICADORES DE ATAQUE ---
        let baseExitos = totalExitos;
        
        // 1. x2 Pre-Defensa: Duplica los éxitos obtenidos antes de compararlos con la VD
        if (mPreVD) baseExitos = baseExitos * 2;
        
        // Restamos la defensa del rival (VD)
        state.netos = baseExitos - state.vd;
        
        // 2. x2 Post-Defensa: Si el ataque impactó, duplica los éxitos netos finales (luego de restar la VD)
        if (mPostVD && state.netos > 0) state.netos = state.netos * 2;
        // ---------------------------------------------------------

        resBox.style.display = "block";

        if (state.netos > 0) {
            resBox.style.borderLeftColor = "var(--success)";
            resBox.innerHTML = `<div class="result-title" style="color:var(--success);">🎯 ¡Impacto Exitoso!</div>
                                Éxitos en Dados: <b>${totalExitos}</b> ${mPreVD ? '(<span style="color:#fda4af;">x2 Pre-VD Activo</span>)' : ''}<br>
                                Defensa (VD Rival): <b>-${state.vd}</b><br>
                                Éxitos Netos Finales: Te quedan <b>${state.netos} éxitos netos</b> ${mPostVD ? '(<span style="color:#f43f5e;">x2 Post-VD Activo</span>)' : ''}.`;
            
            document.getElementById("val-netos").value = state.netos;
            document.getElementById("panel-daño").style.opacity = "1";
            document.getElementById("panel-daño").style.pointerEvents = "auto";
        } else {
            resBox.style.borderLeftColor = "var(--accent)";
            resBox.innerHTML = `<div class="result-title" style="color:var(--accent);">🛡️ El enemigo no recibe daño</div>
                                Éxitos Calculados: <b>${baseExitos}</b> | Defensa (VD Rival): <b>-${state.vd}</b><br>
                                No lograste superar la defensa del rival en esta ocasión.`;
            
            document.getElementById("val-netos").value = 0;
        }
    }, 400);
}

/**
 * FASE DE DAÑO (CON LOGICA DE MULTIPLICADORES PRE Y POST ABSORCIÓN DE DAÑO)
 */
function tirarDaño() {
    // Captura de los nuevos checkboxes de multiplicadores de daño desde el HTML
    const mPreSoak = document.getElementById("mult-pre-soak").checked;
    const mPostSoak = document.getElementById("mult-post-soak").checked;

    // --- LÓGICA DE RESERVA DE DADOS DE DAÑO ---
    let poolDañoBase = state.dmg + state.netos + state.charm_dmg;
    
    // 1. x2 Pre-Absorción: Duplica toda la reserva de daño acumulada antes de restarle la absorción enemiga(Soak)
    if (mPreSoak) poolDañoBase = poolDañoBase * 2;
    
    let totalDice = poolDañoBase - state.soak;
    
    // 2. x2 Post-Absorción: Duplica los dados reales finales que van a la mesa tras restar la absorción del enemigo (Soak)
    if (mPostSoak && totalDice > 0) totalDice = totalDice * 2;

    // Regla Oficial Exalted: Mínimo se tira siempre 1 dado de daño (Daño de Esquirla / Ping Damage)
    if (totalDice < 1) totalDice = 1; 
    // --------------------------------------------------------

    const grid = document.getElementById("grid-daño");
    const resBox = document.getElementById("res-daño");
    const doubleTens = document.getElementById("double-damage").checked;

    grid.innerHTML = "";
    resBox.style.display = "none";

    for (let i = 0; i < totalDice; i++) {
        let d = document.createElement("div");
        d.className = "die-box die-rolling";
        d.style.borderColor = "var(--damage-color)";
        d.innerText = "?";
        grid.appendChild(d);
    }

    setTimeout(() => {
        let dados = [];
        let heridas = 0;

        for (let i = 0; i < totalDice; i++) {
            let r = Math.floor(Math.random() * 10) + 1;
            dados.push(r);
            if (r === 10 && doubleTens) heridas += 2;
            else if (r >= 7) heridas += 1;
        }

        dados.sort((a,b) => b - a);
        grid.innerHTML = "";

        dados.forEach(val => {
            let d = document.createElement("div");
            d.className = "die-box";
            d.innerText = val;
            if (val === 10 && doubleTens) d.className += " die-gold";
            else if (val >= 7) d.className += " die-success";
            grid.appendChild(d);
        });

        resBox.style.display = "block";
        resBox.innerHTML = `<div class="result-title" style="color:var(--damage-color);">💥 Heridas Provocadas</div>
                            Dados Totales Tirados: <b>${totalDice}</b><br>
                            Modificadores de Daño: ${mPreSoak ? '[<span style="color:#93c5fd;">x2 Pre-Soak</span>] ' : ''}${mPostSoak ? '[<span style="color:#3b82f6;">x2 Post-Soak</span>]' : ''}<br>
                            El defensor recibe un total de <b>${heridas} Niveles de Salud</b> de daño real.`;

        // EFECTO VISUAL DE GOLPE CRÍTICO (Modificado a < 2s de duración total)
        if (heridas >= 8) {
            triggerBloodSplatter();
        }

    }, 400);
}

/**
 * Genera un sonido de tajo de espada realista usando Web Audio API
 */
function sonarEspadazo() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // 1. Ruido blanco para el aire y filo metálico
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);

    const gainNoise = ctx.createGain();
    gainNoise.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNoise.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

    noise.connect(filter);
    filter.connect(gainNoise);
    gainNoise.connect(ctx.destination);

    // 2. Impacto sordo y grave del golpe
    const osc = ctx.createOscillator();
    const gainOsc = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);

    gainOsc.gain.setValueAtTime(0.4, ctx.currentTime);
    gainOsc.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gainOsc);
    gainOsc.connect(ctx.destination);

    noise.start();
    osc.start();
    noise.stop(ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
}

/**
 * Función encargada de activar los efectos especiales en sincronía con el CSS veloz
 */
function triggerBloodSplatter() {
    const slash = document.getElementById("slash-effect");
    const blood = document.getElementById("blood-effect");

    // 1. Sonido instantáneo
    sonarEspadazo();

    // 2. Activar animaciones cortas en cascada
    slash.classList.add("animate-slash");
    blood.classList.add("animate-blood");

    // Limpieza veloz a los 1.3 segundos para acoplarse al CSS rápido
    setTimeout(() => {
        slash.classList.remove("animate-slash");
        blood.classList.remove("animate-blood");
    }, 1300); 
}