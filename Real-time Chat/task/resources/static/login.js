function connectUser() {
    const username = document.getElementById('input-username').value.trim();
    fetch('/user/connect?username=' + encodeURIComponent(username), {
        method: 'POST'
    })
        .then(response => {
            if (response.redirected) {
                sessionStorage.setItem('username', username);
                window.location.href = response.url;
            } else {
                return response.text();
            }
        })
        .catch(error => {
            console.error('Error connecting user:', error);
        });
}