// --- 1. CONEXIÓN A FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDYp2Z5OnDYLpfEYgzGfb7d48pl_1orO4g",
  authDomain: "red-unanimes-app.firebaseapp.com",
  projectId: "red-unanimes-app",
  storageBucket: "red-unanimes-app.firebasestorage.app",
  messagingSenderId: "780005530746",
  appId: "1:780005530746:web:46d6326f5e2dd978872fc3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 2. LÓGICA DE INTERFAZ (Mostrar/Ocultar campos) ---
document.getElementById('reg-acompanado').addEventListener('change', function() {
    document.getElementById('caja-quien-acompana').style.display = (this.value === 'Acompañado') ? 'block' : 'none';
});

document.getElementById('reg-quiere-servir').addEventListener('change', function() {
    document.getElementById('caja-ministerios').style.display = this.checked ? 'block' : 'none';
});


// --- 3. LÓGICA DE ENVÍO DE DATOS ---
document.getElementById('form-publico').addEventListener('submit', (e) => {
    e.preventDefault();
    const boton = e.target.querySelector('button');
    boton.innerText = "Enviando..."; boton.disabled = true;

    // Recolectar múltiples opciones si las marcaron
    const ministeriosSeleccionados = [];
    if(document.getElementById('reg-quiere-servir').checked) {
        document.querySelectorAll('.check-ministerio:checked').forEach(chk => ministeriosSeleccionados.push(chk.value));
    }

    const acompanantesSeleccionados = [];
    if(document.getElementById('reg-acompanado').value === 'Acompañado') {
        document.querySelectorAll('.check-acompana:checked').forEach(chk => acompanantesSeleccionados.push(chk.value));
    }

    const hoy = new Date().toISOString().split('T')[0];

    // Construir el perfil completo
    const datosJoven = {
        nombre: document.getElementById('reg-nombre').value.trim(),
        fechaNac: document.getElementById('reg-fecha').value,
        whatsapp: document.getElementById('reg-whatsapp').value.trim(),
        barrio: document.getElementById('reg-barrio').value.trim(),
        ocupacion: document.getElementById('reg-ocupacion').value,
        nivelBiblia: document.getElementById('reg-biblia').value,
        tipoAsistencia: document.getElementById('reg-acompanado').value,
        acompanantes: acompanantesSeleccionados,
        quiereServir: document.getElementById('reg-quiere-servir').checked,
        ministerios: ministeriosSeleccionados,
        comentarios: document.getElementById('reg-comentarios').value.trim(),
        intereses: "", 
        dones: "", 
        fechaVisita: hoy,
        estado: "Nuevo",
        conector: "", 
        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('jovenes').add(datosJoven).then(() => {
        document.getElementById('caja-formulario').style.display = 'none';
        document.getElementById('caja-exito').style.display = 'block';
    }).catch((error) => {
        alert("Hubo un error al enviar los datos. Revisa tu conexión a internet.");
        boton.innerText = "Enviar mis datos 🚀"; boton.disabled = false;
    });
});