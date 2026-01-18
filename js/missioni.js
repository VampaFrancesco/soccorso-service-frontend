// ===== GESTIONE TAB MISSIONI (TUTTE) =====

async function caricaTutteLeMissioni() {
    console.log('🔎 Carico tutte le missioni...');

    try {
        const missioni = await visualizzaTutteLeMissioni();
        console.log('✅ Missioni ricevute:', missioni);

        const container = document.getElementById('missioniList');
        container.innerHTML = '';

        if (!missioni || missioni.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:2rem;">Nessuna missione trovata</p>';
            return;
        }

        missioni.forEach(missione => {
            const statoFormattato = formattaStato(missione.stato);

            const cardHTML = `
                <div class="card" data-id="${missione.id}">
                    <div class="card-header">
                        <span class="card-title">Missione #${missione.id}</span>
                        <span class="badge ${missione.stato}">${statoFormattato}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Obiettivo:</strong> ${missione.obiettivo || 'N/D'}</p>
                        <p><strong>Data:</strong> ${new Date(missione.created_at).toLocaleDateString('it-IT') || 'N/D'}</p>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        // Aggiungi click per aprire dettagli
        const cards = document.querySelectorAll('#missioniList .card');
        cards.forEach(card => {
            card.addEventListener('click', async function () {
                const missioneId = card.getAttribute('data-id');
                await mostraDettagliMissione(missioneId);
            });
        });

    } catch (error) {
        console.error('❌ Errore caricamento missioni:', error);
        const container = document.getElementById('missioniList');
        container.innerHTML = '<p style="text-align:center; color:#dc3545; padding:2rem;">Errore nel caricamento</p>';
    }
}


// ===== GESTIONE MISSIONI NON POSITIVE =====


async function mostraRichiesteNonPositive() {
    console.log('🔎 Carico richieste non positive...');

    try {
        const richieste = await visualizzaRichiesteNonPositive();
        console.log('✅ Richieste ricevute:', richieste);

        const container = document.getElementById('missioniNonPositiveList');
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
                        <p><strong>Valutazione:</strong> ${richiesta.livello_successo || 'N/D'}/10</p>
                        <p><strong>Data:</strong> ${new Date(richiesta.created_at).toLocaleDateString('it-IT') || 'N/D'}</p>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        // Aggiungi click per aprire dettagli richiesta
        const cards = document.querySelectorAll('#missioniNonPositiveList .card');
        cards.forEach(card => {
            card.addEventListener('click', async function () {
                const richiestaId = card.getAttribute('data-id');
                // Usa la funzione mostraDettagliRichiesta definita in dashboard.js
                if (typeof mostraDettagliRichiesta === 'function') {
                    await mostraDettagliRichiesta(richiestaId);
                }
            });
        });

    } catch (error) {
        console.error('❌ Errore caricamento richieste:', error);
        const container = document.getElementById('missioniNonPositiveList');
        container.innerHTML = '<p style="text-align:center; color:#dc3545; padding:2rem;">Errore nel caricamento</p>';
    }
}

// ===== FUNZIONE DETTAGLI MISSIONE (CONDIVISA) =====

async function mostraDettagliMissione(id) {
    try {
        const dettagli = await dettagliMissione(id);
        console.log('📋 Dettagli missione:', dettagli);

        // Salva dati per modifica
        window.currentMissioneData = dettagli;

        const statoFormattato = formattaStato(dettagli.stato);

        // Popola il modal
        document.getElementById('missioneId').textContent = dettagli.id || 'N/D';
        document.getElementById('missioneStato').textContent = statoFormattato;
        document.getElementById('missioneStato').className = `badge ${dettagli.stato}`;
        document.getElementById('missioneRichiestaId').textContent = dettagli.richiesta_id || 'N/D';
        document.getElementById('missioneNumeroOperatori').textContent = dettagli.numero_operatori || (dettagli.operatori ? dettagli.operatori.length : 0);
        document.getElementById('missioneObiettivo').textContent = dettagli.obiettivo || 'N/D';
        document.getElementById('missionePosizione').textContent = dettagli.posizione || 'N/D';
        document.getElementById('missioneCommenti').textContent = dettagli.commenti_finali || 'Nessun commento';

        // Caposquadra
        if (dettagli.caposquadra) {
            document.getElementById('missioneCaposquadra').textContent =
                `${dettagli.caposquadra.nome} ${dettagli.caposquadra.cognome} (${dettagli.caposquadra.email})`;
        } else {
            document.getElementById('missioneCaposquadra').textContent = 'N/D';
        }

        // Formatta date
        document.getElementById('missioneDataInizio').textContent = dettagli.inizio_at ?
            new Date(dettagli.inizio_at).toLocaleString('it-IT') : 'N/D';
        document.getElementById('missioneDataFine').textContent = dettagli.fine_at ?
            new Date(dettagli.fine_at).toLocaleString('it-IT') : 'In corso';
        document.getElementById('missioneCreatedAt').textContent = dettagli.created_at ?
            new Date(dettagli.created_at).toLocaleString('it-IT') : 'N/D';
        document.getElementById('missioneUpdatedAt').textContent = dettagli.updated_at ?
            new Date(dettagli.updated_at).toLocaleString('it-IT') : 'N/D';

        // Lista operatori
        const operatoriList = document.getElementById('missioneOperatori');
        operatoriList.innerHTML = '';

        if (dettagli.operatori && dettagli.operatori.length > 0) {
            dettagli.operatori.forEach(op => {
                const li = document.createElement('li');
                li.textContent = `${op.nome} ${op.cognome} - ${op.email}`;
                operatoriList.appendChild(li);
            });
        } else {
            operatoriList.innerHTML = '<li>Nessun operatore assegnato</li>';
        }

        // Mappa Leaflet - Rimuovi e ricrea completamente il container
        const oldMapContainer = document.getElementById('missioneMap');
        const parent = oldMapContainer.parentNode;
        const newMapContainer = document.createElement('div');
        newMapContainer.id = 'missioneMap';
        newMapContainer.style.cssText = 'height: 300px; border-radius: 8px; margin-top: 10px;';
        parent.replaceChild(newMapContainer, oldMapContainer);

        if (dettagli.latitudine && dettagli.longitudine) {
            const lat = parseFloat(dettagli.latitudine);
            const lng = parseFloat(dettagli.longitudine);

            // Aspetta che il DOM si aggiorni prima di inizializzare la mappa
            setTimeout(() => {
                const map = L.map('missioneMap').setView([lat, lng], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                L.marker([lat, lng]).addTo(map)
                    .bindPopup(`<b>Missione #${dettagli.id}</b><br>${dettagli.posizione || 'Posizione'}`)
                    .openPopup();

                // Forza il ricalcolo delle dimensioni
                map.invalidateSize();
            }, 100);
        } else {
            newMapContainer.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">Coordinate non disponibili</p>';
        }


        // Gestione bottone chiudi missione
        const btnChiudi = document.getElementById('btnChiudiMissione');
        const nuovoBtn = btnChiudi.cloneNode(true);
        btnChiudi.parentNode.replaceChild(nuovoBtn, btnChiudi);

        nuovoBtn.addEventListener('click', async function () {
            console.log('🔒 Click su chiudi missione #' + id);

            const result = await Swal.fire({
                title: 'Chiudi Missione',
                text: `Sei sicuro di voler chiudere la missione #${id}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sì, chiudi',
                cancelButtonText: 'Annulla'
            });

            if (!result.isConfirmed) return;

            try {
                nuovoBtn.disabled = true;
                nuovoBtn.textContent = 'Chiusura in corso...';

                await chiudiMissione(id);

                await Swal.fire('Chiusa!', 'Missione chiusa con successo!', 'success');
                document.getElementById('missioneModal').classList.remove('active');

                // Ricarica la lista appropriata
                if (typeof caricaTutteLeMissioni === 'function') {
                    caricaTutteLeMissioni();
                }
                if (typeof mostraMissioniNonPositive === 'function') {
                    mostraMissioniNonPositive();
                }

            } catch (error) {
                console.error('❌ Errore chiusura:', error);
                await Swal.fire('Errore', error.message, 'error');
            } finally {
                nuovoBtn.disabled = false;
                nuovoBtn.textContent = 'Chiudi Missione';
            }
        });

        // Mostra modal
        const modal = document.getElementById('missioneModal');
        modal.classList.add('active');

    } catch (error) {
        console.error('❌ Errore dettagli missione:', error);
        await Swal.fire('Errore', 'Errore nel caricamento dei dettagli: ' + error.message, 'error');
    }
}
