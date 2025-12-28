// convalida.js - Gestione convalida richiesta da email

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🔍 Pagina convalida caricata');

    // Estrai token dalla URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token_convalida');

    console.log('Token ricevuto:', token);

    if (!token) {
        mostraErrore('Token di convalida mancante nella URL.');
        return;
    }

    try {
        // Chiama API di convalida
        const risultato = await convalidaRichiesta(token);
        console.log('✅ Convalida riuscita:', risultato);

        mostraSuccesso();

        // Countdown e redirect
        let secondi = 5;
        const countdownEl = document.getElementById('countdown');

        const interval = setInterval(() => {
            secondi--;
            if (countdownEl) {
                countdownEl.textContent = secondi;
            }

            if (secondi <= 0) {
                clearInterval(interval);
                window.location.href = 'index.html';
            }
        }, 1000);

    } catch (error) {
        console.error('❌ Errore convalida:', error);
        mostraErrore(error.message || 'Errore durante la convalida della richiesta.');
    }
});

function mostraSuccesso() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('successState').style.display = 'block';
}

function mostraErrore(messaggio) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('successState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = messaggio;
}
