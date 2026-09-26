// --- 1. CONEXIÓN A FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDYp2Z5OnDYLpfEYgzGfb7d48pl_1orO4g",
  authDomain: "red-unanimes-app.firebaseapp.com",
  projectId: "red-unanimes-app",
  storageBucket: "red-unanimes-app.firebasestorage.app",
  messagingSenderId: "780005530746",
  appId: "1:780005530746:web:46d6326f5e2dd978872fc3"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
const auth = firebase.auth(); 

const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = secondaryApp.auth();

let currentUsername = '';
let currentUserRol = '';
let currentConectorId = '';
let currentUserDisplayName = '';
let todosLosJovenesData = []; // Guardará todos los jóvenes en memoria para poder filtrarlos rápido

// --- 2. LÓGICA DE LOGIN Y ROLES ---
const pantallaLogin = document.getElementById('pantalla-login');
const appPrincipal = document.getElementById('app-principal');

auth.onAuthStateChanged((userAuth) => {
    if (userAuth) {
        currentUsername = userAuth.email.split('@')[0];
        
        db.collection('roles').doc(currentUsername).get().then((docRol) => {
            currentUserRol = (docRol.exists) ? docRol.data().rol : 'conector'; 
            if (currentUsername === 'admin') { currentUserRol = 'admin'; }

            db.collection('conectores').where('usuario', '==', currentUsername).get().then(snap => {
                if(!snap.empty) { 
                    currentConectorId = snap.docs[0].id; 
                    currentUserDisplayName = snap.docs[0].data().nombre; 
                }
                
                // Mostrar UI dependiendo del Rol
                if (currentUserRol === 'admin') {
                    document.querySelectorAll('.stat-admin-only, #menu-eventos, #menu-conectores').forEach(el => el.style.display = 'block');
                    document.getElementById('titulo-panel').innerText = "Panel de Control";
                    document.getElementById('caja-filtro-mis-jovenes').style.display = 'none'; // Admin siempre ve todos
                } else {
                    document.querySelectorAll('.stat-admin-only, #menu-eventos, #menu-conectores').forEach(el => el.style.display = 'none');
                    document.getElementById('titulo-panel').innerText = "Mi Área de Trabajo";
                    document.getElementById('caja-filtro-mis-jovenes').style.display = 'flex'; // Conectores pueden filtrar
                }

                pantallaLogin.style.display = 'none';
                appPrincipal.style.display = 'flex';
                iniciarApp(); 
            });
        });
    } else {
        pantallaLogin.style.display = 'flex'; appPrincipal.style.display = 'none';
    }
});

document.getElementById('formulario-login').addEventListener('submit', (e) => {
    e.preventDefault(); const userString = document.getElementById('login-username').value.toLowerCase().trim();
    auth.signInWithEmailAndPassword(userString + '@unanimes.app', document.getElementById('login-password').value)
        .then(() => { document.getElementById('mensaje-error-login').style.display = 'none'; })
        .catch(() => { document.getElementById('mensaje-error-login').style.display = 'block'; });
});
document.getElementById('btn-cerrar-sesion').addEventListener('click', () => { auth.signOut().then(() => window.location.reload()); });

// --- 3. NAVEGACIÓN Y MODALES ---
function mostrarSeccion(idSeccion) {
    document.querySelectorAll('main section').forEach(sec => { sec.classList.remove('seccion-activa'); sec.classList.add('seccion-oculta'); });
    document.getElementById(idSeccion).classList.remove('seccion-oculta'); document.getElementById(idSeccion).classList.add('seccion-activa');
}
function cerrarModal(modalId) { document.getElementById(modalId).classList.remove('modal-activo'); document.getElementById(modalId).classList.add('modal-oculto'); }

['cerrar-modal', 'cerrar-modal-evento', 'cerrar-modal-conector', 'cerrar-modal-asistencia', 'cerrar-modal-perfil', 'cerrar-modal-mi-perfil', 'cerrar-modal-eliminar'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => cerrarModal(e.target.closest('.modal-activo').id));
});

document.getElementById('btn-compartir-form').addEventListener('click', () => {
    const link = "https://rj-unanimes.github.io/RJUnanimesApp/registro.html";
    navigator.clipboard.writeText(link).then(() => { alert("¡Enlace copiado al portapapeles!\n\n" + link); }).catch(() => { alert("Selecciona y copia este enlace:\n" + link); });
});

document.getElementById('tipoAsistencia').addEventListener('change', function() { document.getElementById('caja-quien-acompana-int').style.display = (this.value === 'Acompañado') ? 'block' : 'none'; });
document.getElementById('quiere-servir').addEventListener('change', function() { document.getElementById('caja-ministerios-int').style.display = this.checked ? 'block' : 'none'; });

// Abrir form para NUEVO joven (BLOQUEANDO EL SELECTOR SI ES CONECTOR)
document.getElementById('btn-nuevo-joven').addEventListener('click', () => {
    document.getElementById('formulario-joven').reset(); document.getElementById('id-joven-edit').value = ''; 
    document.getElementById('titulo-modal-joven').innerText = 'Registrar Nuevo Joven';
    document.getElementById('caja-quien-acompana-int').style.display = 'none'; document.getElementById('caja-ministerios-int').style.display = 'none';
    
    // Solo el Admin puede asignar el conector
    document.getElementById('conector').disabled = (currentUserRol !== 'admin');
    
    document.getElementById('modal-joven').classList.remove('modal-oculto'); document.getElementById('modal-joven').classList.add('modal-activo');
});


// --- 4. FUNCIÓN PRINCIPAL DE LA APLICACIÓN ---
let eventosDisponibles = []; 

function iniciarApp() {
    
    // ---- LÓGICA DE MI PERFIL ----
    document.getElementById('btn-abrir-mi-perfil').addEventListener('click', () => {
        if(!currentConectorId && currentUsername === 'admin') { alert("Eres el Admin maestro. No tienes perfil asignado."); return; }
        db.collection('conectores').doc(currentConectorId).get().then(doc => {
            const data = doc.data(); document.getElementById('mi-nombre').value = data.nombre; document.getElementById('mi-whatsapp').value = data.whatsapp || '';
            document.getElementById('mi-usuario').value = data.usuario; document.getElementById('mi-pass').value = '';
            document.getElementById('modal-mi-perfil').classList.remove('modal-oculto'); document.getElementById('modal-mi-perfil').classList.add('modal-activo');
        });
    });
    document.getElementById('formulario-mi-perfil').addEventListener('submit', (e) => {
        e.preventDefault(); const newName = document.getElementById('mi-nombre').value; const newWapp = document.getElementById('mi-whatsapp').value;
        const newUser = document.getElementById('mi-usuario').value.toLowerCase().trim(); const newPass = document.getElementById('mi-pass').value;
        let p = []; const userAuth = auth.currentUser;
        if (newPass) p.push(userAuth.updatePassword(newPass));
        if (newUser !== currentUsername) { p.push(userAuth.updateEmail(newUser + '@unanimes.app')); p.push(db.collection('roles').doc(newUser).set({rol: currentUserRol})); p.push(db.collection('roles').doc(currentUsername).delete()); }
        p.push(db.collection('conectores').doc(currentConectorId).update({ nombre: newName, whatsapp: newWapp, usuario: newUser }));
        Promise.all(p).then(() => { cerrarModal('modal-mi-perfil'); if (newUser !== currentUsername || newPass) { alert("Credenciales actualizadas. Inicia sesión de nuevo."); auth.signOut().then(() => window.location.reload()); } else { alert("Perfil actualizado."); } }).catch(err => alert("Error: " + err.message));
    });

    // ---- CONECTORES (ADMIN ONLY) ----
    document.getElementById('btn-nuevo-evento').addEventListener('click', () => { document.getElementById('formulario-evento').reset(); document.getElementById('id-evento-edit').value = ''; document.getElementById('titulo-modal-evento').innerText = 'Crear Nuevo Evento'; document.getElementById('modal-evento').classList.remove('modal-oculto'); document.getElementById('modal-evento').classList.add('modal-activo'); });
    document.getElementById('btn-nuevo-conector').addEventListener('click', () => { document.getElementById('formulario-conector').reset(); document.getElementById('id-conector-edit').value = ''; document.getElementById('titulo-modal-conector').innerText = 'Añadir Conector'; document.getElementById('pass-conector').required = true; document.getElementById('caja-pass-conector').style.display = 'flex'; document.getElementById('modal-conector').classList.remove('modal-oculto'); document.getElementById('modal-conector').classList.add('modal-activo'); });

    window.editarConector = function(id) {
        db.collection('conectores').doc(id).get().then(doc => {
            const c = doc.data(); document.getElementById('id-conector-edit').value = id; document.getElementById('titulo-modal-conector').innerText = 'Editar Conector (Info Pública)';
            document.getElementById('nombre-conector').value = c.nombre; document.getElementById('whatsapp-conector').value = c.whatsapp || ''; document.getElementById('usuario-conector').value = c.usuario || ''; document.getElementById('rol-conector').value = c.rol || 'conector';
            document.getElementById('caja-pass-conector').style.display = 'none'; document.getElementById('pass-conector').required = false;
            document.getElementById('modal-conector').classList.remove('modal-oculto'); document.getElementById('modal-conector').classList.add('modal-activo');
        });
    };
    document.getElementById('formulario-conector').addEventListener('submit', (e) => {
        e.preventDefault(); const idEdit = document.getElementById('id-conector-edit').value; const nomUsr = document.getElementById('usuario-conector').value.toLowerCase().trim(); const rolSel = document.getElementById('rol-conector').value; const passTmp = document.getElementById('pass-conector').value;
        const datos = { nombre: document.getElementById('nombre-conector').value, whatsapp: document.getElementById('whatsapp-conector').value, usuario: nomUsr, rol: rolSel };
        if (idEdit) { db.collection('conectores').doc(idEdit).update(datos).then(() => { db.collection('roles').doc(nomUsr).set({ rol: rolSel }).then(() => cerrarModal('modal-conector')); }); } 
        else { secondaryAuth.createUserWithEmailAndPassword(nomUsr + '@unanimes.app', passTmp).then(() => { secondaryAuth.signOut(); datos.fechaRegistro = firebase.firestore.FieldValue.serverTimestamp(); db.collection('conectores').add(datos).then(() => { db.collection('roles').doc(nomUsr).set({ rol: rolSel }).then(() => { cerrarModal('modal-conector'); alert(`¡Creado! Usuario: ${nomUsr}`); }); }); }); }
    });

    db.collection('conectores').onSnapshot((snapshot) => {
        document.getElementById('stat-conectores').innerText = snapshot.size; 
        const lista = document.getElementById('lista-conectores'); const select = document.getElementById('conector');
        lista.innerHTML = ''; select.innerHTML = '<option value="">Sin asignar / Ninguno</option>';
        snapshot.forEach(doc => {
            const c = doc.data();
            lista.innerHTML += `<div class="tarjeta-joven" style="border-left-color: #8b5cf6;"><div><h3>${c.nombre}</h3><p>📱 ${c.whatsapp || 'N/A'}</p><p style="margin-top:5px; font-size:0.8rem; color:#64748b;">Login: <strong>${c.usuario || 'N/A'}</strong></p></div><button onclick="editarConector('${doc.id}')" class="btn-editar">✏️ Editar Info</button></div>`;
            select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
        });
    });


    // ---- LÓGICA DE JÓVENES (CON FILTROS Y BLOQUEOS DE ROL) ----
    window.editarJoven = function(id) {
        db.collection('jovenes').doc(id).get().then(doc => {
            const j = doc.data(); document.getElementById('id-joven-edit').value = id;
            document.getElementById('titulo-modal-joven').innerText = 'Editar Perfil';
            document.getElementById('nombre').value = j.nombre || ''; document.getElementById('fecha-nac').value = j.fechaNac || '';
            document.getElementById('whatsapp').value = j.whatsapp || ''; document.getElementById('barrio').value = j.barrio || '';
            document.getElementById('ocupacion').value = j.ocupacion || ''; document.getElementById('nivelBiblia').value = j.nivelBiblia || '';
            document.getElementById('tipoAsistencia').value = j.tipoAsistencia || ''; document.getElementById('intereses').value = j.intereses || ''; 
            document.getElementById('comentarios').value = j.comentarios || ''; document.getElementById('dones').value = j.dones || '';
            document.getElementById('fecha-visita').value = j.fechaVisita || ''; document.getElementById('estado').value = j.estado || 'Nuevo';
            
            // Cargar conector actual y bloquear el campo si es Conector
            document.getElementById('conector').value = j.conector || '';
            document.getElementById('conector').disabled = (currentUserRol !== 'admin');

            document.querySelectorAll('.check-ministerio-edit, .check-acompana-edit').forEach(chk => chk.checked = false);
            if(j.ministerios) j.ministerios.forEach(val => { let c = document.querySelector(`.check-ministerio-edit[value="${val}"]`); if(c) c.checked = true; });
            if(j.acompanantes) j.acompanantes.forEach(val => { let c = document.querySelector(`.check-acompana-edit[value="${val}"]`); if(c) c.checked = true; });

            document.getElementById('quiere-servir').checked = j.quiereServir || false;
            document.getElementById('caja-quien-acompana-int').style.display = (j.tipoAsistencia === 'Acompañado') ? 'block' : 'none';
            document.getElementById('caja-ministerios-int').style.display = (j.quiereServir) ? 'block' : 'none';

            document.getElementById('modal-joven').classList.remove('modal-oculto'); document.getElementById('modal-joven').classList.add('modal-activo');
        });
    };

    document.getElementById('formulario-joven').addEventListener('submit', (e) => {
        e.preventDefault(); const idEdit = document.getElementById('id-joven-edit').value;
        const mins = []; if(document.getElementById('quiere-servir').checked) document.querySelectorAll('.check-ministerio-edit:checked').forEach(chk => mins.push(chk.value));
        const acomp = []; if(document.getElementById('tipoAsistencia').value === 'Acompañado') document.querySelectorAll('.check-acompana-edit:checked').forEach(chk => acomp.push(chk.value));

        const datos = {
            nombre: document.getElementById('nombre').value || '', fechaNac: document.getElementById('fecha-nac').value || '',
            whatsapp: document.getElementById('whatsapp').value || '', barrio: document.getElementById('barrio').value || '',
            ocupacion: document.getElementById('ocupacion').value, nivelBiblia: document.getElementById('nivelBiblia').value,
            tipoAsistencia: document.getElementById('tipoAsistencia').value, acompanantes: acomp,
            quiereServir: document.getElementById('quiere-servir').checked, ministerios: mins,
            intereses: document.getElementById('intereses').value || '', comentarios: document.getElementById('comentarios').value || '',
            dones: document.getElementById('dones').value || '', fechaVisita: document.getElementById('fecha-visita').value || '', 
            estado: document.getElementById('estado').value || 'Nuevo', 
            conector: document.getElementById('conector').value || ''
        };

        if (idEdit) db.collection('jovenes').doc(idEdit).update(datos).then(() => cerrarModal('modal-joven'));
        else { datos.fechaRegistro = firebase.firestore.FieldValue.serverTimestamp(); db.collection('jovenes').add(datos).then(() => cerrarModal('modal-joven')); }
    });


    // DESCARGAR TODOS LOS JÓVENES Y FILTRAR EN LA PANTALLA
    db.collection('jovenes').onSnapshot((snapshot) => {
        document.getElementById('stat-jovenes').innerText = snapshot.size;
        todosLosJovenesData = []; 
        snapshot.forEach(doc => todosLosJovenesData.push({id: doc.id, ...doc.data()}));
        todosLosJovenesData.sort((a, b) => (b.fechaRegistro?.seconds || 0) - (a.fechaRegistro?.seconds || 0));
        
        renderizarJovenes();
    });

    // Escuchar cambios en la casilla "Ver solo mis asignados"
    document.getElementById('check-mis-jovenes').addEventListener('change', renderizarJovenes);

    function renderizarJovenes() {
        const lista = document.getElementById('lista-jovenes'); 
        lista.innerHTML = ''; 
        const filtroMios = document.getElementById('check-mis-jovenes').checked;

        todosLosJovenesData.forEach((joven) => {
            // Si la casilla está marcada y el joven NO me pertenece, me lo salto
            if (filtroMios && currentUserRol !== 'admin' && joven.conector !== currentUserDisplayName) {
                return;
            }

            let claseEstado = joven.estado === 'Nuevo' ? 'estado-nuevo' : joven.estado === 'Constante' ? 'estado-constante' : 'estado-intermitente';
            const btnEliminar = (currentUserRol === 'admin') ? `<button onclick="abrirModalEliminar('${joven.id}', '${joven.nombre}')" class="btn-editar" style="background-color: #ef4444; margin-top: 5px;">🗑️ Eliminar Perfil</button>` : '';

            lista.innerHTML += `
                <div class="tarjeta-joven">
                    <div><h3>${joven.nombre}</h3><p><strong>📍 Sector:</strong> ${joven.barrio || 'N/A'}</p><p><strong>🤝 Conector:</strong> ${joven.conector || 'Sin asignar'}</p><span class="etiqueta-estado ${claseEstado}">${joven.estado || 'Nuevo'}</span></div>
                    <div style="margin-top: 15px;">
                        <div style="display: flex; gap: 10px;">
                            <button onclick="abrirModalAsistencia('${joven.id}', '${joven.nombre}')" class="btn-primario" style="flex: 1; background-color: #10b981; padding: 8px;">📝 Asistencia</button>
                            <button onclick="abrirModalPerfil('${joven.id}', '${joven.nombre}')" class="btn-primario" style="flex: 1; background-color: #0f172a; padding: 8px;">🔍 Perfil</button>
                        </div>
                        <button onclick="editarJoven('${joven.id}')" class="btn-editar" style="background-color: #0284c7;">✏️ Editar Info</button>
                        ${btnEliminar}
                    </div>
                </div>
            `;
        });
    }

    // ELIMINAR JOVEN (ADMIN ONLY)
    window.abrirModalEliminar = function(id, nombre) {
        document.getElementById('id-joven-eliminar').value = id; document.getElementById('nombre-joven-eliminar').innerText = nombre; document.getElementById('pass-eliminar').value = '';
        document.getElementById('modal-eliminar').classList.remove('modal-oculto'); document.getElementById('modal-eliminar').classList.add('modal-activo');
    }
    document.getElementById('formulario-eliminar').addEventListener('submit', (e) => {
        e.preventDefault(); const idJoven = document.getElementById('id-joven-eliminar').value; const passwordConfirm = document.getElementById('pass-eliminar').value; const userCred = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(userCred.email, passwordConfirm);
        userCred.reauthenticateWithCredential(credential).then(() => { db.collection('jovenes').doc(idJoven).delete().then(() => { cerrarModal('modal-eliminar'); alert('Perfil eliminado permanentemente.'); }); }).catch(() => { alert('Contraseña incorrecta. No se puede eliminar.'); });
    });


    // ---- EVENTOS, ASISTENCIA Y PERFIL COMPLETO ----
    window.editarEvento = function(id) { db.collection('eventos').doc(id).get().then(doc => { const ev = doc.data(); document.getElementById('id-evento-edit').value = id; document.getElementById('titulo-modal-evento').innerText = 'Editar Evento'; document.getElementById('nombre-evento').value = ev.nombre; document.getElementById('fecha-evento').value = ev.fecha; document.getElementById('modal-evento').classList.remove('modal-oculto'); document.getElementById('modal-evento').classList.add('modal-activo'); }); };
    document.getElementById('formulario-evento').addEventListener('submit', (e) => { e.preventDefault(); const idEdit = document.getElementById('id-evento-edit').value; const datos = { nombre: document.getElementById('nombre-evento').value, fecha: document.getElementById('fecha-evento').value }; if (idEdit) db.collection('eventos').doc(idEdit).update(datos).then(() => cerrarModal('modal-evento')); else { datos.fechaRegistro = firebase.firestore.FieldValue.serverTimestamp(); db.collection('eventos').add(datos).then(() => cerrarModal('modal-evento')); } });
    db.collection('eventos').onSnapshot((snapshot) => { document.getElementById('stat-eventos').innerText = snapshot.size; const listaEventos = document.getElementById('lista-eventos'); listaEventos.innerHTML = ''; eventosDisponibles = []; let eventosArr = []; snapshot.forEach(doc => eventosArr.push({id: doc.id, ...doc.data()})); eventosArr.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); eventosArr.forEach((evento) => { eventosDisponibles.push({ id: evento.id, nombre: evento.nombre, fecha: evento.fecha }); listaEventos.innerHTML += `<div class="tarjeta-joven" style="border-left-color: #10b981;"><div><h3>${evento.nombre}</h3><p>📅 ${evento.fecha}</p></div><button onclick="editarEvento('${evento.id}')" class="btn-editar">✏️ Editar Evento</button></div>`; }); });

    document.getElementById('check-asistio').addEventListener('change', (e) => { const checkParticipo = document.getElementById('check-participo'); if (!e.target.checked) { checkParticipo.checked = false; checkParticipo.disabled = true; } else { checkParticipo.disabled = false; } });
    window.abrirModalAsistencia = function(idJoven, nombreJoven) { document.getElementById('id-joven-asistencia').value = idJoven; document.getElementById('titulo-asistencia').innerText = `Asistencia: ${nombreJoven}`; document.getElementById('check-asistio').checked = true; document.getElementById('check-participo').checked = false; document.getElementById('check-participo').disabled = false; const select = document.getElementById('select-evento-asistencia'); select.innerHTML = '<option value="">Selecciona un evento...</option>'; eventosDisponibles.forEach(ev => select.innerHTML += `<option value="${ev.id}">${ev.nombre} (${ev.fecha})</option>`); document.getElementById('modal-asistencia').classList.remove('modal-oculto'); document.getElementById('modal-asistencia').classList.add('modal-activo'); };
    document.getElementById('formulario-asistencia').addEventListener('submit', (e) => { e.preventDefault(); const idJoven = document.getElementById('id-joven-asistencia').value; const idEvento = document.getElementById('select-evento-asistencia').value; const datosAsistencia = { idJoven: idJoven, idEvento: idEvento, asistio: document.getElementById('check-asistio').checked, participo: document.getElementById('check-participo').checked, notas: document.getElementById('notas-asistencia').value, fechaRegistro: firebase.firestore.FieldValue.serverTimestamp() }; db.collection('asistencias').where('idJoven', '==', idJoven).get().then((snapshot) => { const registroExistente = snapshot.docs.find(doc => doc.data().idEvento === idEvento); if (registroExistente) db.collection('asistencias').doc(registroExistente.id).update(datosAsistencia).then(() => cerrarModal('modal-asistencia')); else db.collection('asistencias').add(datosAsistencia).then(() => cerrarModal('modal-asistencia')); }); });

    window.abrirModalPerfil = function(idJoven, nombreJoven) {
        document.getElementById('titulo-perfil').innerText = `Perfil: ${nombreJoven}`; document.getElementById('modal-perfil').classList.remove('modal-oculto'); document.getElementById('modal-perfil').classList.add('modal-activo');
        const cajaInfo = document.getElementById('info-perfil'); const cajaHistorial = document.getElementById('contenido-historial');
        cajaInfo.innerHTML = '<p>Cargando...</p>'; cajaHistorial.innerHTML = '<p>Buscando...</p>';

        db.collection('jovenes').doc(idJoven).get().then((doc) => {
            if(doc.exists) {
                const j = doc.data();
                let textoEdad = ''; if (j.fechaNac) { const partes = j.fechaNac.split('-'); const cumple = new Date(partes[0], partes[1] - 1, partes[2]); const hoy = new Date(); let edad = hoy.getFullYear() - cumple.getFullYear(); const mes = hoy.getMonth() - cumple.getMonth(); if (mes < 0 || (mes === 0 && hoy.getDate() < cumple.getDate())) { edad--; } textoEdad = ` <strong style="color: #0284c7;">(${edad} años)</strong>`; }
                const mins = (j.quiereServir && j.ministerios && j.ministerios.length > 0) ? j.ministerios.join(', ') : 'Ninguno';
                const acomp = (j.tipoAsistencia === 'Acompañado' && j.acompanantes && j.acompanantes.length > 0) ? `(${j.acompanantes.join(', ')})` : '';

                cajaInfo.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <p><strong>📱 WhatsApp:</strong> ${j.whatsapp || 'No registrado'}</p><p><strong>🎂 Nacimiento:</strong> ${j.fechaNac || 'No registrado'}${textoEdad}</p>
                        <p><strong>🗓️ 1era Visita:</strong> ${j.fechaVisita || 'No registrado'}</p><p><strong>🤝 Conector:</strong> ${j.conector || 'Ninguno'}</p>
                    </div><hr style="margin: 15px 0; border-top: 1px solid #cbd5e1;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <p><strong>💼 Ocupación:</strong> ${j.ocupacion || 'N/A'}</p><p><strong>📖 Nivel Biblia:</strong> ${j.nivelBiblia ? j.nivelBiblia+'/5' : 'N/A'}</p>
                        <p><strong>🚶‍♂️ Asistencia:</strong> ${j.tipoAsistencia || 'N/A'} ${acomp}</p><p><strong>🙌 Desea Servir:</strong> ${j.quiereServir ? 'Sí' : 'No'}</p>
                    </div>
                    <p style="margin-top: 10px; background: #f0fdf4; padding: 10px; border-radius: 6px;"><strong>🎯 Áreas:</strong> ${mins}</p><hr style="margin: 15px 0; border-top: 1px solid #cbd5e1;">
                    <p><strong>🧠 Personalidad y Gustos:</strong><br>${j.intereses || 'No especificados'}</p><p style="margin-top: 10px;"><strong>🌟 Dones:</strong><br>${j.dones || 'No especificados'}</p>
                    <p style="margin-top: 10px; padding: 10px; background: #fffbeb; border-radius: 6px; border-left: 3px solid #f59e0b;"><strong>💬 Comentarios:</strong><br>${j.comentarios || 'Ninguno'}</p>
                `;
            }
        });

        db.collection('asistencias').where('idJoven', '==', idJoven).get().then((snapshot) => {
            if (snapshot.empty) { cajaHistorial.innerHTML = '<p>No hay registros de asistencia.</p>'; return; }
            let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
            snapshot.forEach((doc) => {
                const r = doc.data(); const evento = eventosDisponibles.find(e => e.id === r.idEvento);
                const nEv = evento ? evento.nombre : 'Desconocido'; const fEv = evento ? evento.fecha : '';
                html += `<div style="background: #f8fafc; border-left: 4px solid ${r.asistio ? '#0284c7' : '#94a3b8'}; padding: 15px; border-radius: 8px;"><h4 style="margin-bottom: 5px; color: #0f172a;">${nEv} <span style="font-size: 0.8rem; font-weight: normal; color: #64748b;">(${fEv})</span></h4><p style="margin: 0; font-size: 0.9rem;">${r.asistio?'✅ Asistió':'❌ Ausente'} | ${r.participo?'⭐ Participó':'😶 No participó'}${r.notas ? `<br><small style="color: #64748b;">📝 ${r.notas}</small>` : ''}</p></div>`;
            });
            cajaHistorial.innerHTML = html + '</div>';
        });
    };
}