document.addEventListener('DOMContentLoaded', () => {
    const ordersTableBody = document.querySelector('.orders-table tbody');

    // Cargar pedidos desde el servidor
    function loadOrders() {
        fetch("https://carlsjr2-production.up.railway.app/api/ordersAdmin")
            .then(response => response.json())
            .then(orders => {
                ordersTableBody.innerHTML = ''; // Limpiar tabla
                orders.forEach(order => {
                    const totalPrice = parseFloat(order.total_price); // Convertir a número
                    if (isNaN(totalPrice)) {
                        console.error(`El precio total del pedido con ID ${order.order_id} no es válido.`);
                        return; // Saltamos este pedido si el precio no es válido
                    }

                    const orderRow = document.createElement('tr');
                    const itemsList = order.items.map(item => `<li>${item.combo_name} - ${item.quantity}x</li>`).join('');

                    orderRow.innerHTML = `
                        <td>${order.order_id}</td>
                        <td>${order.customer}</td>
                        <td>${order.address}</td>
                        <td>${order.phone}</td>
                        <td>$${totalPrice.toFixed(2)}</td>
                        <td>${new Date(order.order_date).toLocaleString()}</td>
                        <td><ul>${itemsList}</ul></td>
                        <td>
                            <select class="order-status" data-order-id="${order.order_id}">
                                ${['pending', 'confirmed', 'preparing', 'shipped', 'completed', 'cancelled']
                                    .map(status => `<option value="${status}" ${status === order.order_status ? 'selected' : ''}>${status}</option>`)
                                    .join('')}
                            </select>
                        </td>
                        <td>
                            <button class="update-status" data-order-id="${order.order_id}">Update</button>
                        </td>
                    `;
                    ordersTableBody.appendChild(orderRow);
                });
            })
            .catch(error => console.error("Error cargando pedidos:", error));
    }

    // Manejar clic en "Update"
    ordersTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('update-status')) {
            const orderId = e.target.dataset.orderId;
            const selectElement = document.querySelector(`.order-status[data-order-id="${orderId}"]`);
            const newStatus = selectElement.value;

            fetch(`https://carlsjr2-production.up.railway.app/api/ordersAdmin/${orderId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
                .then(response => {
                    if (response.ok) {
                        alert("Estado actualizado exitosamente");
                        loadOrders(); // Recargar pedidos
                    } else {
                        alert("Error al actualizar el estado del pedido");
                    }
                })
                .catch(error => console.error("Error al actualizar estado:", error));
        }
    });

    // Cargar pedidos al inicio
    loadOrders();
});
