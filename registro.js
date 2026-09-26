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

// --- 2. LÓGICA DE ENVÍO ---
document.getElementById('form-publico').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Cambiamos el texto del botón para que sepa que está cargando
    const boton = e.target.querySelector('button');
    boton.innerText = "Enviando...";
    boton.disabled = true;

    // Obtener la fecha de hoy para registrar cuándo llenó el formulario
    const hoy = new Date().toISOString().split('T')[0];

    const datosJoven = {
        nombre: document.getElementById('reg-nombre').value.trim(),
        fechaNac: document.getElementById('reg-fecha').value,
        whatsapp: document.getElementById('reg-whatsapp').value.trim(),
        barrio: document.getElementById('reg-barrio').value.trim(),
        intereses: document.getElementById('reg-intereses').value.trim(),
        dones: "", // Queda en blanco para que un líder lo evalúe después
        fechaVisita: hoy,
        estado: "Nuevo",
        conector: "", // Queda sin asignar para que tú lo asignes en el panel
        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Enviar a la base de datos
    db.collection('jovenes').add(datosJoven).then(() => {
        // Ocultar formulario y mostrar mensaje de éxito
        document.getElementById('caja-formulario').style.display = 'none';
        document.getElementById('caja-exito').style.display = 'block';
    }).catch((error) => {
        alert("Hubo un error al enviar los datos. Revisa tu conexión a internet.");
        boton.innerText = "Intentar de nuevo";
        boton.disabled = false;
    });
});