document.addEventListener('DOMContentLoaded', () => {
  const menuContent = document.querySelector('.menu-content');
  const orderList = document.getElementById('orderList');
  const orderTotal = document.getElementById('orderTotal');
  const modalOrderButton = document.querySelector('.modal-footer .btn-order');
  const order = []; // Array para almacenar el pedido

  // Cargar combos desde el servidor
  fetch("http://localhost:3000/api/combos")
    .then(response => response.json())
    .then(combos => {
      combos.forEach(combo => {
        const price = parseFloat(combo.price); 
        if (isNaN(price)) return;

        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <img src="${combo.image_url}" alt="${combo.combo_name}" class="menu-image">
          <div class="item-info">
            <p class="item-name">${combo.combo_name}</p>
            <p class="description">${combo.descrip}</p>
          </div>
          <p class="price"><strong>$${price.toFixed(2)}</strong></p>
          <button data-id="${combo.id}" data-name="${combo.combo_name}" data-price="${price}" data-image="${combo.image_url}">
            Add
          </button>
        `;
        menuContent.appendChild(listItem);
      });
    })
    .catch(error => console.error("Error cargando los combos:", error));

  // Evento para manejar el botón "Add"
  menuContent.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const button = e.target;
      const comboId = parseInt(button.dataset.id, 10);
      const comboName = button.dataset.name;
      const comboPrice = parseFloat(button.dataset.price);
      const comboImage = button.dataset.image;

      addToOrder(comboId, comboImage, comboName, comboPrice);
    }
  });

  // Función para agregar un combo al pedido
  function addToOrder(comboId, comboImage, comboName, comboPrice) {
    const existingCombo = order.find(item => item.id === comboId);

    if (existingCombo) {
      existingCombo.quantity++;
      existingCombo.totalPrice += comboPrice;
    } else {
      order.push({
        id: comboId,
        image: comboImage,
        name: comboName,
        price: comboPrice,
        quantity: 1,
        totalPrice: comboPrice,
      });
    }

    updateOrderSummary();
  }

  // Función para actualizar el resumen del pedido
  function updateOrderSummary() {
    orderList.innerHTML = ''; // Limpiar la lista actual
    let total = 0;

    order.forEach(item => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="img-order">
        <span>${item.name} - $${item.price.toFixed(2)} x ${item.quantity}</span>
        <button class="add-item" data-action="add" data-id="${item.id}" data-price="${item.price}">+</button>
        <strong>$${item.totalPrice.toFixed(2)}</strong>
        <button class="add-item less-item" data-action="less" data-id="${item.id}" data-price="${item.price}">-</button>
      `;
      orderList.appendChild(listItem);
      total += item.totalPrice;
    });

    orderTotal.textContent = total.toFixed(2); // Actualizar total
  }

  // Evento para manejar "+" y "-" en el resumen del pedido
  orderList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const button = e.target;
      const action = button.dataset.action;
      const comboId = parseInt(button.dataset.id, 10);
      const comboPrice = parseFloat(button.dataset.price);

      if (action === 'add') {
        const existingCombo = order.find(item => item.id === comboId);
        if (existingCombo) {
          existingCombo.quantity++;
          existingCombo.totalPrice += comboPrice;
        }
      } else if (action === 'less') {
        const existingCombo = order.find(item => item.id === comboId);
        if (existingCombo) {
          existingCombo.quantity--;
          existingCombo.totalPrice -= comboPrice;

          if (existingCombo.quantity <= 0) {
            const index = order.indexOf(existingCombo);
            order.splice(index, 1);
          }
        }
      }

      updateOrderSummary();
    }
  });

  // Manejar el envío del pedido desde el modal
  modalOrderButton.addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    if (!name || !phone || !address || order.length === 0) {
      alert("Por favor, completa todos los campos y añade al menos un combo.");
      return;
    }

    const orderData = {
      name,
      phone,
      address,
      combos: order.map(item => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
      .then(response => {
        if (response.ok) {
          alert("¡Pedido realizado con éxito!");
          order.length = 0;
          updateOrderSummary();
          const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
          modal.hide();
        } else {
          alert("Hubo un error al realizar el pedido.");
        }
      })
      .catch(error => console.error("Error al enviar el pedido:", error));
  });
});
