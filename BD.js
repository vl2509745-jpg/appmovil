
const DB_NAME = "BaseDatos";
const DB_VERSION = 2; 
const STORE_NAME = "usuarios";

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        console.log("ObjectStore 'usuarios' creado.");
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      console.log("Base de datos lista.");
      resolve(db);
    };

    req.onerror = (e) => {
      console.error("Error al abrir la DB:", e.target.error);
      reject(e.target.error);
    };
  });
}


document.addEventListener("deviceready", () => {
  openDB();
});

openDB();

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}


async function guardarDatos() {
  try {
    const campo1 = document.getElementById("campo1").value.trim();
    const campo2 = document.getElementById("campo2").value.trim();
    const campo3 = document.getElementById("campo3").value.trim();

    if (!campo1 && !campo2 && !campo3) {
      alert("Completa al menos un campo.");
      return;
    }

    const database = await openDB();
    const tx = database.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const nuevoRegistro = {
      campo1,
      campo2,
      campo3,
      creadoEn: new Date().toISOString()
    };

    const addReq = store.add(nuevoRegistro);
    const id = await requestToPromise(addReq);

    await new Promise((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error || new Error("Transacción abortada"));
    });

    console.log("Datos guardados con id:", id);

    document.getElementById("campo1").value = "";
    document.getElementById("campo2").value = "";
    document.getElementById("campo3").value = "";

  } catch (err) {
    console.error("Error al guardar:", err);
    alert("Ocurrió un error guardando. Revisa la consola.");
  }
}


async function init() {
  const btn = document.getElementById("btnGuardar");
  const btnIr = document.getElementById("btnIrLista");

  try {
    await openDB();
    console.log("Base lista.");
    btn.disabled = false;
  } catch (err) {
    console.error("No se pudo abrir la DB:", err);
    alert("No se pudo abrir la base de datos.");
  }

  btn.addEventListener("click", guardarDatos);

  btnIr.addEventListener("click", () => {
    window.location.href = "./pag2.html";
  });
}


async function verificarLogin(c1, c2, c3) {
  try {
    const database = await openDB();
    const trans = database.transaction(STORE_NAME, "readonly");
    const store = trans.objectStore(STORE_NAME);

    const req = store.getAll();
    const usuarios = await requestToPromise(req);

    const encontrado = usuarios.find(u =>
      u.campo1 === c1 &&
      u.campo2 === c2 &&
      u.campo3 === c3
    );

    return !!encontrado;

  } catch (error) {
    console.error("Error en verificarLogin:", error);
    throw error;
  }
}

document.getElementById("btnLogin").addEventListener("click", async () => {
  const c1 = document.getElementById("campo1").value.trim();
  const c2 = document.getElementById("campo2").value.trim();
  const c3 = document.getElementById("campo3").value.trim();

  try {
    const acceso = await verificarLogin(c1, c2, c3);

    if (acceso) {
      console.log("Acceso concedido.");
      window.location.href = "./indice.html";
    } else {
      alert("Datos incorrectos.");
    }

  } catch (error) {
    console.log("Error:", error);
  }
});


function actualizarDatos() {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await openDB();
      const trans = database.transaction(STORE_NAME, "readonly");
      const store = trans.objectStore(STORE_NAME);

      const req = store.getAll();

      req.onsuccess = function () {
        const datosActualizados = req.result;
        console.log("Datos actualizados:", datosActualizados);
        resolve(datosActualizados);
      };

      req.onerror = function () {
        reject("Error al obtener datos actualizados.");
      };

    } catch (e) {
      reject(e);
    }
  });
}

init();
