// Array para almacenar el pedido
const order = [];

// Ejecutar una vez que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  // Referencias al DOM
  const menuContent = document.querySelector('.menu-content');
  const orderList = document.getElementById('orderList');
  const orderTotal = document.getElementById('orderTotal');
  const modalOrderButton = document.querySelector('.modal-footer .btn-order');

  // Cargar combos desde el servidor
  fetch("http://localhost:3000/api/combos")
    .then(response => response.json())
    .then(combos => {
      combos.forEach(combo => {
        const price = parseFloat(combo.price);
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <img src="${combo.image_url}" alt="${combo.combo_name}" class="menu-image">
          <div class="item-info">
            <p class="item-name">${combo.combo_name}</p>
            <p class="description">${combo.descrip}</p>
          </div>
          <p class="price"><strong>$${price.toFixed(2)}</strong></p>
          <button data-image="${combo.image_url}" data-action="add" data-name="${combo.combo_name}" data-price="${combo.price}">
            Add
          </button>
        `;
        menuContent.appendChild(listItem);
      });
    })
    .catch(error => console.error("Error cargando los combos:", error));

  // Agregar evento para añadir combos al pedido
  menuContent.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.action === 'add') {
      const button = e.target;
      const comboName = button.dataset.name;
      const comboPrice = parseFloat(button.dataset.price);
      const comboImage = button.dataset.image;

      addToOrder(comboImage, comboName, comboPrice);
    }
  });

  // Función para agregar un combo al pedido
  function addToOrder(comboId, comboImage, comboName, comboPrice) {
    // Convertir comboId a número
    const comboIdNumber = parseInt(comboId, 10);
    //const existingCombo = order.find(item => item.name === comboName);
    const price = parseFloat(comboPrice);
    
    const existingCombo = order.find(item => item.id === comboId);
    
    if (existingCombo) {
      existingCombo.quantity++;
      existingCombo.totalPrice += price;
    } else {
      order.push({
        id: comboIdNumber, 
        image: comboImage,
        name: comboName,
        price: price,
        quantity: 1,
        totalPrice: price
      });
    }

    updateOrderSummary();
  }

  // Función para actualizar el resumen del pedido
  function updateOrderSummary() {
    orderList.innerHTML = '';
    let total = 0;

    order.forEach(item => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="img-order">
        <span>${item.name} - $${item.price.toFixed(2)} x ${item.quantity}</span>
        <button class="add-item" data-action="add" data-name="${item.name}" data-price="${item.price}">+</button>
        <strong>$${item.totalPrice.toFixed(2)}</strong>
        <button class="add-item less-item" data-action="less" data-name="${item.name}" data-price="${item.price}">-</button>
        
      `;
      orderList.appendChild(listItem);

      total += item.totalPrice;
    });

    orderTotal.textContent = total.toFixed(2);
  }

  // Manejar eventos de añadir o quitar combos desde el resumen del pedido
  orderList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const button = e.target;
      const action = button.dataset.action;
      const comboName = button.dataset.name;
      const comboPrice = parseFloat(button.dataset.price);

      if (action === 'add') {
        addToOrder(null, comboName, comboPrice);
      } else if (action === 'less') {
        removeFromOrder(comboName, comboPrice);
      }
    }
  });

  // Función para eliminar un combo del pedido
  function removeFromOrder(comboName, comboPrice) {
    const existingCombo = order.find(item => item.name === comboName);

    if (existingCombo) {
      existingCombo.quantity--;
      existingCombo.totalPrice -= comboPrice;

      if (existingCombo.quantity <= 0) {
        const index = order.indexOf(existingCombo);
        order.splice(index, 1);
      }

      updateOrderSummary();
    }
  }

  // Enviar el pedido al servidor desde el modal
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
        price: parseFloat(item.price), 
        quantity: parseInt(item.quantity, 10)
      }))
    };

    fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    })
      .then(response => {
        if (response.ok) {
          alert("¡Pedido realizado con éxito!");
          order.length = 0;
          updateOrderSummary();
          document.getElementById('name').value = '';
          document.getElementById('phone').value = '';
          document.getElementById('address').value = '';
          const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
          modal.hide();
        } else {
          alert("Hubo un error al realizar el pedido.");
        }
      })
      .catch(error => console.error("Error al enviar el pedido:", error));
  });
});
