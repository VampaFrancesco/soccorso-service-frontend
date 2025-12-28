// Gestione form richiesta soccorso (index.html)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('richiestaForm');
    const messageDiv = document.getElementById('message');

    if(form){
        form.addEventListener('submit', async function(e){
            e.preventDefault();
            const richiesta = {
                nome_segnalante: document.getElementById('nome_segnalante').value,
                email_segnalante: document.getElementById('email_segnalante').value,
                telefono_segnalante: document.getElementById('telefono_segnalante').value,
                indirizzo: document.getElementById('indirizzo').value,
                descrizione: document.getElementById('descrizione').value
            };
            try{
                const response = await inserisciRichiestaSoccorso(richiesta);
                
                messageDiv.className = 'success';
                messageDiv.textContent = 'Richiesta inviata, controlla la tua casella mail per convalidare la richiesta!';
                
                //RESET DEL FORM

                form.reset();
            }catch(error){
                //PER DEBUG MOSTRO ERRORE
                messageDiv.className = 'error';
                messageDiv.textContent = 'Richiesta non inserita, vedi log!\n' + error.message;

            }
        });
    }
});
