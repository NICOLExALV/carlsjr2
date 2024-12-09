const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const {port, dbhost,dbuser, dbpassword, name, portdb} = require("./config.js");

const app = express();
const PORT = 3000;

// Configurar base de datos
const db = mysql.createConnection({
    host: dbhost,
    user: dbuser, 
    password: dbpassword,
    database: name,
    port: portdb
});

db.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        return;
    }
    console.log("Conectado a la base de datos MySQL.");
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Middleware para servir archivos estáticos (CSS, imágenes, etc.)
app.use('/public', express.static(path.join(__dirname, 'public'))); // Para css, img, js
app.use("/views",express.static(path.join(__dirname, "views"))); //para paginas

// Rutas
// ruta pagina principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/order.html"));
});

// Obtener combos
app.get("/api/combos", (req, res) => {
    const query = "SELECT * FROM combos";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error obteniendo combos:", err);
        res.status(500).json({ error: "Error obteniendo combos" });
        return;
      }
      res.json(results);
    });
});

// Crear pedido
app.post("/api/orders", (req, res) => {
  const { name, phone, address, combos } = req.body;

  console.log("Datos recibidos para crear el pedido:", { name, phone, address, combos });

  // Validar datos del cliente
  if (!name || !phone || !address || !Array.isArray(combos) || combos.length === 0) {
      console.error("Datos inválidos recibidos:", req.body);
      return res.status(400).json({ error: "Datos inválidos" });
  }

  // Validar y convertir combos
  const validCombos = combos.map(combo => ({
      id: parseInt(combo.id, 10), // Convierte el ID a entero
      quantity: parseInt(combo.quantity, 10) // Convierte la cantidad a entero
  }));

  // Verificar que todos los combos sean válidos
  if (validCombos.some(combo => isNaN(combo.id) || isNaN(combo.quantity) || combo.quantity <= 0)) {
      console.error("Combos inválidos:", validCombos);
      return res.status(400).json({ error: "Combos inválidos" });
  }

  // Calcular el precio total
  const priceQuery = `
      SELECT id, price 
      FROM combos 
      WHERE id IN (${validCombos.map(combo => combo.id).join(",")})
  `;

  db.query(priceQuery, (err, comboPrices) => {
      if (err) {
          console.error("Error obteniendo precios de combos:", err);
          return res.status(500).json({ error: "Error obteniendo precios de combos" });
      }

      // Crear un mapa de precios por ID para calcular total_price
      const priceMap = comboPrices.reduce((map, combo) => {
          map[combo.id] = parseFloat(combo.price);
          return map;
      }, {});

      const totalPrice = validCombos.reduce((sum, combo) => {
          const price = priceMap[combo.id] || 0; // Usar 0 si no se encuentra el ID
          return sum + price * combo.quantity;
      }, 0);

      if (isNaN(totalPrice) || totalPrice <= 0) {
          console.error("Error al calcular el precio total:", totalPrice);
          return res.status(400).json({ error: "Error al calcular el precio total" });
      }

      // Insertar pedido
      const orderQuery = `
          INSERT INTO orders (c_name, total_price, address, tel)
          VALUES (?, ?, ?, ?)
      `;

      db.query(orderQuery, [name, totalPrice, address, phone], (err, result) => {
          if (err) {
              console.error("Error creando pedido:", err);
              return res.status(500).json({ error: "Error creando pedido" });
          }

          const orderId = result.insertId;

          // Insertar combos del pedido
          const comboQueries = validCombos.map(combo => {
              return new Promise((resolve, reject) => {
                  const comboQuery = `
                      INSERT INTO order_combos (order_id, combo_id, quantity)
                      VALUES (?, ?, ?)
                  `;
                  db.query(comboQuery, [orderId, combo.id, combo.quantity], (err) => {
                      if (err) reject(err);
                      else resolve();
                  });
              });
          });

          Promise.all(comboQueries)
              .then(() => res.status(201).json({ message: "Pedido creado exitosamente" }))
              .catch(err => {
                  console.error("Error guardando combos del pedido:", err);
                  res.status(500).json({ error: "Error guardando combos del pedido" });
              });
      });
  });
});

// Obtener todos los pedidos con sus combos
app.get("/api/ordersAdmin", (req, res) => {
  const query = `
      SELECT 
          o.id AS order_id, 
          o.c_name AS customer, 
          o.address, 
          o.tel AS phone, 
          o.total_price, 
          o.order_date, 
          o.order_status, 
          oc.combo_id, 
          oc.quantity, 
          c.combo_name 
      FROM orders o
      LEFT JOIN order_combos oc ON o.id = oc.order_id
      LEFT JOIN combos c ON oc.combo_id = c.id
      ORDER BY o.order_date DESC
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error("Error obteniendo pedidos:", err);
          return res.status(500).json({ error: "Error obteniendo pedidos" });
      }

      // Agrupar por ID de pedido
      const orders = results.reduce((acc, row) => {
          const order = acc[row.order_id] || {
              order_id: row.order_id,
              customer: row.customer,
              address: row.address,
              phone: row.phone,
              total_price: row.total_price,
              order_date: row.order_date,
              order_status: row.order_status,
              items: [],
          };
          if (row.combo_id) {
              order.items.push({
                  combo_id: row.combo_id,
                  combo_name: row.combo_name,
                  quantity: row.quantity,
              });
          }
          acc[row.order_id] = order;
          return acc;
      }, {});

      res.json(Object.values(orders));
  });
});
// Actualizar estado del pedido
app.put("/api/ordersAdmin/:id/status", (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!orderId || !['pending', 'confirmed', 'preparing', 'shipped', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Datos inválidos" });
  }

  const query = `UPDATE orders SET order_status = ? WHERE id = ?`;

  db.query(query, [status, orderId], (err) => {
      if (err) {
          console.error("Error actualizando estado del pedido:", err);
          return res.status(500).json({ error: "Error actualizando estado del pedido" });
      }

      res.json({ message: "Estado actualizado exitosamente" });
  });
});



// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });

  