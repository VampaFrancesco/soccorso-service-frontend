document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    if(form){
        form.addEventListener('submit', async function(e){
            e.preventDefault();
            
            const data = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            try{
                const response = await login(data);
                
                console.log('📦 Risposta login completa:', response);
                
                // Salva token e email
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('userEmail', response.email);
                
                // Estrai e salva i ruoli
                if(response.roles && response.roles.length > 0) {
                    let roleNames;
                    
                    // Se è array di oggetti con .name
                    if(typeof response.roles[0] === 'object' && response.roles[0].name) {
                        roleNames = response.roles.map(r => r.name);
                    }
                    // Se è array di oggetti con .authority
                    else if(typeof response.roles[0] === 'object' && response.roles[0].authority) {
                        roleNames = response.roles.map(r => r.authority);
                    }
                    // Se è già array di stringhe
                    else {
                        roleNames = response.roles;
                    }
                    
                    console.log('🔑 Ruoli salvati:', roleNames);
                    localStorage.setItem('userRoles', JSON.stringify(roleNames));
                } else {
                    // Fallback
                    localStorage.setItem('userRoles', JSON.stringify(['ROLE_OPERATORE']));
                }
                
                messageDiv.className = 'success';
                messageDiv.textContent = 'Login effettuato! Reindirizzamento...';
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                
            } catch(error) {
                console.error('❌ Errore login:', error);
                messageDiv.className = 'error';
                messageDiv.textContent = 'Login non effettuato: ' + error.message;
            }
        });
    }
});
