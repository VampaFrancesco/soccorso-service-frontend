// ===== GESTIONE TAB OPERATORI =====

async function caricaOperatoriLiberi() {
    console.log('🔎 Carico operatori disponibili...');

    try {
        const operatori = await operatoriDisponibili(true);
        console.log('✅ Operatori ricevuti:', operatori);

        const tbody = document.querySelector('#operatoriTable tbody');
        tbody.innerHTML = '';

        if (!operatori || operatori.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Nessun operatore disponibile</td></tr>';
            return;
        }

        operatori.forEach(operatore => {
            const row = `
                <tr>
                    <td>${operatore.id}</td>
                    <td>${operatore.nome} ${operatore.cognome}</td>
                    <td>${operatore.email}</td>
                    <td>${operatore.telefono || 'N/D'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="mostraDettagliOperatore(${operatore.id})">
                            Dettagli
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error('❌ Errore caricamento operatori:', error);
        const tbody = document.querySelector('#operatoriTable tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc3545;">Errore nel caricamento</td></tr>';
    }
}

async function mostraDettagliOperatore(id) {
    try {
        const dettagli = await infoOperatore(id);
        console.log('👤 Dettagli operatore:', dettagli);

        // Controlla se i dettagli sono nulli (risposta vuota)
        if (!dettagli) {
            alert(`Operatore #${id} non trovato o dati non disponibili`);
            return;
        }

        // Popola il modal
        document.getElementById('operatoreId').textContent = dettagli.id || 'N/D';
        document.getElementById('operatoreNome').textContent = `${dettagli.nome} ${dettagli.cognome}` || 'N/D';
        document.getElementById('operatoreEmail').textContent = dettagli.email || 'N/D';
        document.getElementById('operatoreTelefono').textContent = dettagli.telefono || 'N/D';
        document.getElementById('operatoreDisponibile').textContent = dettagli.disponibile ? 'Sì' : 'No';

        // Carica missioni dell'operatore
        const missioni = await operatoInMissioni(id);
        const missioniList = document.getElementById('operatoreMissioni');
        missioniList.innerHTML = '';

        if (missioni && missioni.length > 0) {
            missioni.forEach(missione => {
                const li = document.createElement('li');
                li.textContent = `Missione #${missione.id} - Stato: ${formattaStato(missione.stato)}`;
                missioniList.appendChild(li);
            });
        } else {
            missioniList.innerHTML = '<li>Nessuna missione assegnata</li>';
        }

        // Mostra modal
        const modal = document.getElementById('operatoreModal');
        modal.classList.add('active');

    } catch (error) {
        console.error('❌ Errore dettagli operatore:', error);
        alert('Errore nel caricamento dei dettagli: ' + error.message);
    }
}

// Bottone aggiorna operatori
document.getElementById('btnAggiornaOperatori')?.addEventListener('click', function () {
    caricaOperatoriLiberi();
});
