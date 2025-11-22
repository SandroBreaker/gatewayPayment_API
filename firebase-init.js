import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variáveis globais do Firebase (expostas para debug ou uso externo se necessário)
window.firebaseApp = null;
window.firebaseDb = null;
window.firebaseAuth = null;
window.firebaseUserId = null;

// Logs de Debug
setLogLevel('Debug');

/**
 * Inicializa o Firebase e a Autenticação.
 */
async function initializeFirebase() {
    try {
        // Tenta obter configuração de variáveis globais (simulando injeção de ambiente)
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
        const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : null;
        const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

        if (!firebaseConfig) {
            console.warn("Firebase: Configuração não encontrada. Ignorando inicialização.");
            return;
        }

        // Inicializa App, Firestore e Auth
        window.firebaseApp = initializeApp(firebaseConfig);
        window.firebaseDb = getFirestore(window.firebaseApp);
        window.firebaseAuth = getAuth(window.firebaseApp);

        // Configura o listener de autenticação
        onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                window.firebaseUserId = user.uid;
                console.log("Firebase Auth: Usuário autenticado (UID:", user.uid, ")");
            } else {
                window.firebaseUserId = null;
                console.log("Firebase Auth: Usuário deslogado.");
            }
        });

        // Autenticação
        if (initialAuthToken) {
            await signInWithCustomToken(window.firebaseAuth, initialAuthToken);
            console.log("Firebase: Autenticação via Token Customizado.");
        } else {
            await signInAnonymously(window.firebaseAuth);
            console.log("Firebase: Autenticação Anônima.");
        }

    } catch (error) {
        console.error("Erro na inicialização do Firebase:", error);
    }
}

initializeFirebase();
