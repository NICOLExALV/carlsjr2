window.onload = function() {
    // Obtener el elemento del video
    var video = document.getElementById("myVideo");
    
    // Obtener el contenedor del botón
    var orderButton = document.getElementById("orderButton");

    // Asegúrate de que ambos elementos existen
    if (video && orderButton) {
        // Detectar cuando el video termine de reproducirse
        video.onended = function () {
            // Mostrar el botón "Order Now"
            orderButton.style.display = "block";
        };
    } else {
        console.error("No se encontró el video o el botón en el DOM.");
    }
};
