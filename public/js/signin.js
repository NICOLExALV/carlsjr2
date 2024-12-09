document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('signInForm');

  form.addEventListener('submit', (e) => {
    let valid = true;

    // Name Validation
    const name = document.getElementById('name');
    const nameError = document.getElementById('nameError');
    if (name.value.trim().length < 3) {
      valid = false;
      nameError.textContent = "El nombre debe tener al menos 3 caracteres.";
    } else {
      nameError.textContent = "";
    }

    // Phone Validation
    const phone = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    const phoneRegex = /^[0-9]{10,12}$/;
    if (!phoneRegex.test(phone.value.trim())) {
      valid = false;
      phoneError.textContent = "Introduce un número de teléfono válido (10-12 dígitos).";
    } else {
      phoneError.textContent = "";
    }

    // Password Validation
    const password = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    if (password.value.trim().length < 8) {
      valid = false;
      passwordError.textContent = "La contraseña debe tener al menos 8 caracteres.";
    } else {
      passwordError.textContent = "";
    }

    if (!valid) {
      e.preventDefault(); // Evita el envío del formulario si la validación falla
    }
  });
});
