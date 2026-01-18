const API_BASE_URL = 'http://localhost:8080';

async function apiCall(endpoint, method = 'GET', body = null, needsAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    // Aggiungi token_autenticazione se richiesto
    if (needsAuth) {
        const token_autenticazione = localStorage.getItem('authToken');
        if (token_autenticazione) {
            headers['Authorization'] = `Bearer ${token_autenticazione}`;
        }
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Gestisci errori HTTP
        if (response.status === 401) {
            // token_autenticazione scaduto o non valido
            localStorage.clear();
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            let errorMsg = 'Errore nella richiesta';
            try {
                const error = JSON.parse(errorText);
                errorMsg = error.detail || errorMsg;
            } catch (e) {
                errorMsg = errorText || errorMsg;
            }
            throw new Error(errorMsg);
        }

        // Leggi il testo della risposta
        const responseText = await response.text();

        // Se la risposta è vuota, ritorna null
        if (!responseText || responseText.trim() === '') {
            console.warn('⚠️ Risposta vuota dal server per:', endpoint);
            return null;
        }

        // Prova a parsare il JSON
        return JSON.parse(responseText);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

//API 1a
async function login(credenziali) {
    return await apiCall('/swa/open/auth/login', 'POST', credenziali, false);
}

//API 2a 
async function logout() {

}

//API 2
async function inserisciRichiestaSoccorso(richiesta) {
    return await apiCall('/swa/open/richieste', 'POST', richiesta, false);
}

//API 4
async function visualizzaRichiesteFiltrate(stato) {
    return await apiCall(`/swa/api/richieste?stato=${stato}`, 'GET', null, true);
}

//API 4b - Tutte le Missioni
async function visualizzaTutteLeMissioni() {
    return await apiCall('/swa/api/missioni', 'GET', null, true);
}

//API 5 - Richieste Non Positive
async function visualizzaRichiesteNonPositive() {
    return await apiCall('/swa/api/richieste/non-positive', 'GET', null, true);
}

//API 6
async function operatoriDisponibili(valore) {
    return await apiCall(`/swa/api/operatori?disponibile=${valore}`, 'GET', null, true);
}

//API 7
async function inserimentoMissione(missione) {
    return await apiCall('/swa/api/missioni', 'POST', missione, true);
}

//API 8
async function chiudiMissione(id) {
    return await apiCall('/swa/api/missioni/' + id + '/modifica-stato?nuovo_stato=CHIUSA', 'PATCH', null, true);
}

//API 9
async function annullaRichiestaSoccorso(id) {
    return await apiCall('/swa/api/richieste/' + id + '/annullamento', 'PATCH', null, true);
}

//API 10
async function dettagliMissione(id) {
    return await apiCall('/swa/api/missioni/' + id, 'GET', null, true);
}

//API 11
async function dettagliRichiestaSoccorso(id) {
    return await apiCall('/swa/api/richieste/' + id, 'GET', null, true);
}

//API 12
async function infoOperatore(id) {
    return await apiCall('/swa/api/operatori/' + id, 'GET', null, true);
}

//API 13
async function operatoInMissioni(id) {
    return await apiCall(`/swa/api/operatori/${id}/missioni`, 'GET', null, true);
}

//API 14 - Aggiorna Richiesta
async function aggiornaRichiesta(id, data) {
    return await apiCall(`/swa/api/richieste/${id}`, 'PATCH', data, true);
}

//API 15 - Aggiorna Missione
async function aggiornaMissione(id, data) {
    return await apiCall(`/swa/api/missioni/${id}`, 'PATCH', data, true);
}

//API 16 - Conferma Convalida
async function convalidaRichiesta(token) {
    return await apiCall('/swa/open/richieste/conferma-convalida', 'POST', { token_convalida: token }, false);
}

//API 17 - Valuta Richiesta
async function valutaRichiesta(id, valutazione) {
    return await apiCall(`/swa/api/richieste/${id}/valutazione`, 'PATCH', { livello_successo: valutazione }, true);
}
