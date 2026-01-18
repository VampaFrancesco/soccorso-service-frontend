// Controllo autenticazione PRIMA del DOMContentLoaded
const token = localStorage.getItem('authToken');

if (!token) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', function () {

    // ===== CARICA DATI UTENTE =====
    const email = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = email || "Utente";

    // Leggi array di ruoli
    const rolesJSON = localStorage.getItem('userRoles');
    let ruoli = [];

    try {
        ruoli = JSON.parse(rolesJSON) || [];
    } catch (e) {
        console.error('Errore parsing ruoli:', e);
        ruoli = [];
    }

    console.log('👥 Ruoli utente:', ruoli);

    // Controlla se ha ruolo ADMIN
    const isAdmin = ruoli.some(r => r.includes('ADMIN'));
    const isOperatore = ruoli.some(r => r.includes('OPERATORE'));

    if (isAdmin) {
        document.getElementById('userRole').textContent = "Admin";
    } else if (isOperatore) {
        document.getElementById('userRole').textContent = "Operatore";
    } else {
        document.getElementById('userRole').textContent = "Utente";
    }

    // ===== LOGOUT =====
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // ===== FUNZIONE HELPER PER FORMATTARE STATO =====
    window.formattaStato = function (stato) {
        if (!stato) return 'N/D';
        return stato.replace(/_/g, ' ');
    }

    // ===== GESTIONE RICHIESTE =====
    const filtro = document.getElementById('statoFilter');

    async function caricaRichieste() {
        const filtroSel = filtro.value;
        console.log('🔎 Carico richieste con stato:', filtroSel);

        try {
            const richieste = await visualizzaRichiesteFiltrate(filtroSel);
            console.log('✅ Richieste ricevute:', richieste);

            const container = document.getElementById('richiesteList');
            container.innerHTML = '';

            if (!richieste || richieste.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#999; padding:2rem;">Nessuna richiesta trovata</p>';
                return;
            }

            richieste.forEach(richiesta => {
                const statoFormattato = formattaStato(richiesta.stato);

                const cardHTML = `
                    <div class="card" data-id="${richiesta.id}">
                        <div class="card-header">
                            <span class="card-title">Richiesta #${richiesta.id}</span>
                            <span class="badge ${richiesta.stato}">${statoFormattato}</span>
                        </div>
                        <div class="card-body">
                            <p><strong>Nome:</strong> ${richiesta.nome_segnalante || 'N/D'}</p>
                            <p><strong>Email:</strong> ${richiesta.email_segnalante || 'N/D'}</p>
                            <p><strong>Telefono:</strong> ${richiesta.telefono_segnalante || 'N/D'}</p>
                            <p><strong>Indirizzo:</strong> ${richiesta.indirizzo || 'N/D'}</p>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });

            // Aggiungi click listener alle card
            const cards = document.querySelectorAll('#richiesteList .card');
            cards.forEach(card => {
                card.addEventListener('click', async function () {
                    const richiestaId = card.getAttribute('data-id');
                    await mostraDettagliRichiesta(richiestaId);
                });
            });

        } catch (error) {
            console.error('❌ Errore caricamento:', error);
            const container = document.getElementById('richiesteList');
            container.innerHTML = '<p style="text-align:center; color:#dc3545; padding:2rem;">Errore nel caricamento delle richieste</p>';
        }
    }

    async function mostraDettagliRichiesta(id) {
        try {
            const dettagli = await dettagliRichiestaSoccorso(id);
            console.log('📋 Dettagli richiesta:', dettagli);

            // Salva dati per modifica
            window.currentRichiestaData = dettagli;

            const statoFormattato = formattaStato(dettagli.stato);

            // Popola modal
            document.getElementById('richiestaId').textContent = dettagli.id || 'N/D';
            document.getElementById('richiestaStato').textContent = statoFormattato;
            document.getElementById('richiestaStato').className = `badge ${dettagli.stato}`;
            document.getElementById('richiestaNome').textContent = dettagli.nome_segnalante || 'N/D';
            document.getElementById('richiestaEmail').textContent = dettagli.email_segnalante || 'N/D';
            document.getElementById('richiestaTelefono').textContent = dettagli.telefono_segnalante || 'N/D';
            document.getElementById('richiestaIndirizzo').textContent = dettagli.indirizzo || 'N/D';
            document.getElementById('richiestaNote').textContent = dettagli.descrizione || 'Nessuna descrizione';
            document.getElementById('richiestaMissioneId').textContent = dettagli.missione_id || 'N/D';

            const ipElement = document.getElementById('richiestaIP');
            if (ipElement) {
                ipElement.textContent = dettagli.ip_origine || "IP non disponibile";
            }

            // Date
            document.getElementById('richiestaCreatedAt').textContent = dettagli.created_at ?
                new Date(dettagli.created_at).toLocaleString('it-IT') : 'N/D';
            document.getElementById('richiestaUpdatedAt').textContent = dettagli.updated_at ?
                new Date(dettagli.updated_at).toLocaleString('it-IT') : 'N/D';
            document.getElementById('richiestaConvalidataAt').textContent = dettagli.convalidata_at ?
                new Date(dettagli.convalidata_at).toLocaleString('it-IT') : 'Non convalidata';

            // Valutazione
            document.getElementById('richiestaValutazione').textContent = dettagli.livello_successo || 'N/D';

            // Foto
            const fotoContainer = document.getElementById('richiestaFotoContainer');
            if (dettagli.foto_url) {
                document.getElementById('richiestaFoto').src = dettagli.foto_url;
                fotoContainer.style.display = 'block';
            } else {
                fotoContainer.style.display = 'none';
            }

            // Mappa Leaflet - Rimuovi e ricrea completamente il container
            const oldMapContainer = document.getElementById('richiestaMap');
            const parent = oldMapContainer.parentNode;
            const newMapContainer = document.createElement('div');
            newMapContainer.id = 'richiestaMap';
            newMapContainer.style.cssText = 'height: 300px; border-radius: 8px; margin-top: 10px;';
            parent.replaceChild(newMapContainer, oldMapContainer);

            if (dettagli.latitudine && dettagli.longitudine) {
                const lat = parseFloat(dettagli.latitudine);
                const lng = parseFloat(dettagli.longitudine);

                // Aspetta che il DOM si aggiorni prima di inizializzare la mappa
                setTimeout(() => {
                    const map = L.map('richiestaMap').setView([lat, lng], 15);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);

                    L.marker([lat, lng]).addTo(map)
                        .bindPopup(`<b>Richiesta #${dettagli.id}</b><br>${dettagli.indirizzo || 'Posizione'}`)
                        .openPopup();

                    // Forza il ricalcolo delle dimensioni
                    map.invalidateSize();
                }, 100);
            } else {
                newMapContainer.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">Coordinate non disponibili</p>';
            }

            // Gestione bottone annulla
            const annullaRichiestaBtn = document.getElementById('annullaRichiestaBtn');
            const nuovoAnnullaBtn = annullaRichiestaBtn.cloneNode(true);
            annullaRichiestaBtn.parentNode.replaceChild(nuovoAnnullaBtn, annullaRichiestaBtn);

            const btnCreaMissione = document.getElementById('btnCreaMissione');
            const nuovoCreaBtn = btnCreaMissione.cloneNode(true);
            btnCreaMissione.parentNode.replaceChild(nuovoCreaBtn, btnCreaMissione);

            // Nascondi "Crea Missione" se la richiesta ha già una missione
            if (dettagli.missione_id) {
                nuovoCreaBtn.style.display = 'none';
                console.log('⚠️ Richiesta già associata a missione #' + dettagli.missione_id);
            } else {
                nuovoCreaBtn.style.display = 'inline-block';
                nuovoCreaBtn.addEventListener('click', function () {
                    apriNuovaMissione(id);
                });
            }

            nuovoAnnullaBtn.addEventListener('click', async function () {
                console.log('🗑️ Annulla richiesta: ' + id);

                const result = await Swal.fire({
                    title: 'Sei sicuro?',
                    text: `Vuoi annullare la richiesta #${id}?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sì, annulla',
                    cancelButtonText: 'No, torna indietro'
                });

                if (!result.isConfirmed) return;

                try {
                    nuovoAnnullaBtn.disabled = true;
                    nuovoAnnullaBtn.textContent = 'Annullamento in corso...';

                    await annullaRichiestaSoccorso(id);

                    await Swal.fire('Annullata!', 'Richiesta annullata con successo!', 'success');
                    document.getElementById('richiestaModal').classList.remove('active');
                    caricaRichieste();

                } catch (error) {
                    console.error('❌ Errore annullamento:', error);
                    await Swal.fire('Errore', error.message, 'error');
                    nuovoAnnullaBtn.disabled = false;
                    nuovoAnnullaBtn.textContent = 'Annulla Richiesta';
                }
            });

            // Mostra modal
            const modal = document.getElementById('richiestaModal');
            modal.classList.add('active');

        } catch (error) {
            console.error('❌ Errore dettagli richiesta:', error);
            await Swal.fire('Errore', 'Errore nel caricamento dei dettagli: ' + error.message, 'error');
        }
    }

    // Rendi globale la funzione per permettere il click dalle altre tab
    window.mostraDettagliRichiesta = mostraDettagliRichiesta;

    // ===== GESTIONE TABS =====
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            console.log('🔘 Click su tab');

            const tabName = button.getAttribute('data-tab');
            console.log('📑 Tab selezionato:', tabName);

            // Rimuovi classe "active" da tutti i bottoni e contenuti
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Aggiungi "active" al tab cliccato
            button.classList.add('active');
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Carica dati in base al tab selezionato
            if (tabName === 'richieste') {
                // Già caricate all'avvio
            } else if (tabName === 'missioni') {
                if (typeof caricaTutteLeMissioni === 'function') {
                    caricaTutteLeMissioni();
                }
            } else if (tabName === 'missioni-non-positive') {
                if (typeof mostraRichiesteNonPositive === 'function') {
                    mostraRichiesteNonPositive();
                }
            } else if (tabName === 'operatori') {
                if (typeof caricaOperatoriLiberi === 'function') {
                    caricaOperatoriLiberi();
                }
            }
        });
    });

    // Listener cambio filtro richieste
    filtro.addEventListener('change', caricaRichieste);

    // ===== GESTIONE MODIFICA RICHIESTA =====
    document.getElementById('btnModificaRichiesta')?.addEventListener('click', async function () {
        if (!window.currentRichiestaData) return;

        const data = window.currentRichiestaData;

        // Popola form modifica
        document.getElementById('mrId').textContent = data.id;
        document.getElementById('mrIdInput').value = data.id;
        document.getElementById('mrStato').value = data.stato || '';
        document.getElementById('mrDescrizione').value = data.descrizione || '';
        document.getElementById('mrIndirizzo').value = data.indirizzo || '';
        document.getElementById('mrLatitudine').value = data.latitudine || '';
        document.getElementById('mrLongitudine').value = data.longitudine || '';
        document.getElementById('mrLivelloSuccesso').value = data.livello_successo || '';

        // Chiudi modal dettagli e apri modal modifica
        document.getElementById('richiestaModal').classList.remove('active');
        document.getElementById('modificaRichiestaModal').classList.add('active');
    });

    // Submit form modifica richiesta
    document.getElementById('modificaRichiestaForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = document.getElementById('mrIdInput').value;
        const data = {
            stato: document.getElementById('mrStato').value,
            descrizione: document.getElementById('mrDescrizione').value || undefined,
            indirizzo: document.getElementById('mrIndirizzo').value || undefined,
            latitudine: document.getElementById('mrLatitudine').value ? parseFloat(document.getElementById('mrLatitudine').value) : undefined,
            longitudine: document.getElementById('mrLongitudine').value ? parseFloat(document.getElementById('mrLongitudine').value) : undefined,
            livello_successo: document.getElementById('mrLivelloSuccesso').value ? parseInt(document.getElementById('mrLivelloSuccesso').value) : undefined
        };

        // Rimuovi campi undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        try {
            await aggiornaRichiesta(id, data);
            await Swal.fire('Successo!', 'Richiesta aggiornata con successo!', 'success');
            document.getElementById('modificaRichiestaModal').classList.remove('active');
            caricaRichieste(); // Ricarica lista
        } catch (error) {
            console.error('Errore aggiornamento richiesta:', error);
            await Swal.fire('Errore', error.message, 'error');
        }
    });

    // ===== GESTIONE MODIFICA MISSIONE =====
    document.getElementById('btnModificaMissione')?.addEventListener('click', async function () {
        if (!window.currentMissioneData) return;

        const data = window.currentMissioneData;

        // Popola form modifica
        document.getElementById('mmId').textContent = data.id;
        document.getElementById('mmIdInput').value = data.id;
        document.getElementById('mmStato').value = data.stato || '';
        document.getElementById('mmPosizione').value = data.posizione || '';
        document.getElementById('mmObiettivo').value = data.obiettivo || '';
        document.getElementById('mmCommenti').value = data.commenti_finali || '';

        // Chiudi modal dettagli e apri modal modifica
        document.getElementById('missioneModal').classList.remove('active');
        document.getElementById('modificaMissioneModal').classList.add('active');
    });

    // Submit form modifica missione
    document.getElementById('modificaMissioneForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = document.getElementById('mmIdInput').value;
        const data = {
            stato: document.getElementById('mmStato').value,
            posizione: document.getElementById('mmPosizione').value || undefined,
            obiettivo: document.getElementById('mmObiettivo').value || undefined,
            commenti_finali: document.getElementById('mmCommenti').value || undefined
        };

        // Rimuovi campi undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        try {
            await aggiornaMissione(id, data);
            await Swal.fire('Successo!', 'Missione aggiornata con successo!', 'success');
            document.getElementById('modificaMissioneModal').classList.remove('active');

            // Ricarica liste
            if (typeof caricaTutteLeMissioni === 'function') {
                caricaTutteLeMissioni();
            }
        } catch (error) {
            console.error('Errore aggiornamento missione:', error);
            await Swal.fire('Errore', error.message, 'error');
        } finally {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.textContent = 'Salva Modifiche';
        }
    });

    // Salva dati correnti quando si aprono i dettagli
    const originalMostraDettagliRichiesta = mostraDettagliRichiesta;
    mostraDettagliRichiesta = async function (id) {
        const dettagli = await dettagliRichiestaSoccorso(id);
        currentRichiestaData = dettagli; // Salva i dati per la modifica
        return originalMostraDettagliRichiesta(id);
    };

    // Salva dati correnti quando si aprono i dettagli missione (se esiste)
    if (typeof mostraDettagliMissione === 'function') {
        const originalMostraDettagliMissione = mostraDettagliMissione;
        mostraDettagliMissione = async function (id) {
            const dettagli = await dettagliMissione(id);
            currentMissioneData = dettagli; // Salva i dati per la modifica
            return originalMostraDettagliMissione(id);
        };
    }

    // Carica richieste all'avvio
    caricaRichieste();

    // ===== CHIUSURA MODAL =====
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // ===== GESTIONE NUOVA MISSIONE =====

    window.apriNuovaMissione = async function (richiestaId) {
        console.log('🚀 Apertura modal nuova missione per richiesta:', richiestaId);

        // Chiudi dettagli richiesta
        document.getElementById('richiestaModal').classList.remove('active');

        // Reset form
        document.getElementById('nuovaMissioneForm').reset();
        document.getElementById('nmRichiestaId').textContent = richiestaId;
        document.getElementById('nmRichiestaIdInput').value = richiestaId;
        document.getElementById('nmOperatoriList').innerHTML = '<p>Caricamento...</p>';
        document.getElementById('nmCaposquadra').innerHTML = '<option value="">Caricamento...</option>';

        // Apri modal
        const modal = document.getElementById('nuovaMissioneModal');
        modal.classList.add('active');

        try {
            // Carica operatori disponibili
            const operatori = await operatoriDisponibili(true);

            const selectCapo = document.getElementById('nmCaposquadra');
            const listOp = document.getElementById('nmOperatoriList');

            selectCapo.innerHTML = '<option value="">Seleziona un caposquadra...</option>';
            listOp.innerHTML = '';

            if (!operatori || operatori.length === 0) {
                listOp.innerHTML = '<p class="error">Nessun operatore disponibile!</p>';
                return;
            }

            operatori.forEach(op => {
                // Popola Select Caposquadra
                const option = document.createElement('option');
                option.value = op.id;
                option.textContent = `${op.nome} ${op.cognome}`;
                selectCapo.appendChild(option);

                // Popola Checkbox Operatori
                const div = document.createElement('div');
                div.style.marginBottom = '5px';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'operatori';
                checkbox.value = op.id;
                checkbox.id = `op_${op.id}`;

                const label = document.createElement('label');
                label.htmlFor = `op_${op.id}`;
                label.textContent = ` ${op.nome} ${op.cognome}`;

                div.appendChild(checkbox);
                div.appendChild(label);
                listOp.appendChild(div);
            });

        } catch (error) {
            console.error('Errore caricamento operatori:', error);
            alert('Impossibile caricare gli operatori disponibili.');
        }
    };

    // Gestione submit form nuova missione
    document.getElementById('nuovaMissioneForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const richiestaId = document.getElementById('nmRichiestaIdInput').value;
        const obiettivo = document.getElementById('nmObiettivo').value;
        const posizione = document.getElementById('nmPosizione').value;
        const caposquadraId = document.getElementById('nmCaposquadra').value;

        // Raccogli operatori selezionati
        const operatoriCheckboxes = document.querySelectorAll('input[name="operatori"]:checked');
        const operatoriIds = Array.from(operatoriCheckboxes).map(cb => parseInt(cb.value));

        if (!caposquadraId) {
            await Swal.fire('Attenzione', 'Devi selezionare un caposquadra!', 'warning');
            return;
        }

        if (operatoriIds.length === 0) {
            await Swal.fire('Attenzione', 'Devi selezionare almeno un operatore!', 'warning');
            return;
        }

        const missione = {
            richiesta_id: parseInt(richiestaId),
            obiettivo: obiettivo,
            posizione: posizione,
            caposquadra_id: parseInt(caposquadraId),
            operatori_ids: operatoriIds,
            latitudine: 0,
            longitudine: 0
        };
        try {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Creazione...';

            await inserimentoMissione(missione);

            await Swal.fire('Successo!', 'Missione creata con successo!', 'success');
            document.getElementById('nuovaMissioneModal').classList.remove('active');

            // Ricarica la lista richieste
            caricaRichieste();

            // Ricarica operatori liberi se siamo nella tab
            if (document.getElementById('operatori').classList.contains('active')) {
                if (typeof caricaOperatoriLiberi === 'function') {
                    caricaOperatoriLiberi();
                }
            }

        } catch (error) {
            console.error('Errore creazione missione:', error);
            await Swal.fire('Errore', error.message, 'error');
        } finally {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.textContent = 'Crea Missione';
        }
    });

}); // ← CHIUSURA DOMContentLoaded
