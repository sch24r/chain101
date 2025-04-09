export function showAlert(message, type = "default") {
    const alert = document.getElementById('alert');
    alert.innerText = message;

    alert.className = 'alert-card';
    alert.classList.add(type);

    alert.style.display = 'block';
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}