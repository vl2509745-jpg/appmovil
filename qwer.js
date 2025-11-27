
const DB_NAME = "BaseDatos";
const DB_VERSION = 2;
const STORE_NAME = "usuarios";

let _db = null;


function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        console.log("ObjectStore 'usuarios' creado (onupgradeneeded).");
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      
      _db.onclose = () => { _db = null; };
      _db.onversionchange = () => {
        try { _db.close(); } catch (_) {}
        _db = null;
      };
      resolve(_db);
    };

    req.onerror = (e) => {
      console.error("openDB error:", e.target.error);
      reject(e.target.error);
    };
  });
}


function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (evt) => resolve(evt.target.result);
    request.onerror = (evt) => reject(evt.target.error);
  });
}


async function getAllUsuarios() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const req = store.getAll();
  return requestToPromise(req);
}


async function borrarUsuarioPorId(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const req = store.delete(id);
  await requestToPromise(req);

 
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transacción abortada"));
  });
}


async function cargarUsuarios() {
  try {
    const usuarios = await getAllUsuarios();
    const tbody = document.querySelector("#tabla tbody");
    if (!tbody) {
      console.warn("No se encontró #tabla tbody en el DOM.");
      return;
    }

    tbody.innerHTML = "";

    if (!usuarios || usuarios.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5'>No hay usuarios</td></tr>";
      return;
    }

    for (const u of usuarios) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id ?? ""}</td>
        <td>${u.campo1 ?? ""}</td>
        <td>${u.campo2 ?? ""}</td>
        <td>${u.campo3 ?? ""}</td>
        <td>
          <button class="btnBorrar" data-id="${u.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    
    tbody.removeEventListener("click", onTablaClick);
    tbody.addEventListener("click", onTablaClick);

  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
}


async function onTablaClick(e) {
  const target = e.target;
  if (target.classList && target.classList.contains("btnBorrar")) {
    const id = Number(target.dataset.id);
    if (!Number.isInteger(id)) return;
    if (!confirm(`¿Eliminar usuario con ID ${id}?`)) return;

    try {
      await borrarUsuarioPorId(id);
      
      await cargarUsuarios();
    } catch (err) {
      console.error("Error borrando usuario:", err);
      alert("No se pudo borrar el usuario. Revisa la consola.");
    }
  }
}


const btnVolver = document.getElementById("btnVolver");
if (btnVolver) {
  btnVolver.addEventListener("click", () => {
    window.location.href = "./index.html";
  });
}


function initQwer() {
  
  if (window.cordova || window.Capacitor) {
    document.addEventListener("deviceready", async () => {
      try {
        await openDB();
        cargarUsuarios();
      } catch (err) {
        console.error("No se pudo abrir DB en deviceready:", err);
      }
    }, { once: true });
  } else {
    
    openDB().then(() => cargarUsuarios()).catch(err => {
      console.error("No se pudo abrir DB (navegador):", err);
    });
  }
}


initQwer();
