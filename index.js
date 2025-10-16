const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ====================================
// 🧠 Memoria temporal de usuarios
// ====================================
const usuarios = {};

// ====================================
// 📩 Ruta principal del bot de WhatsApp
// ====================================
app.post("/whatsapp", (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const msg = req.body.Body ? req.body.Body.trim().toLowerCase() : "";
  const numero = req.body.From || "desconocido";

  // Log de entrada del mensaje
  console.log("==========================================");
  console.log(`📩 Mensaje recibido de: ${numero}`);
  console.log(`💬 Contenido: "${msg}"`);

  // Crear usuario si no existe
  if (!usuarios[numero]) {
    usuarios[numero] = { estado: "inicio", data: {} };
    console.log("🆕 Nuevo usuario registrado, iniciando conversación.");
  }

  const user = usuarios[numero];
  let respuesta = "";

  // Log del estado actual
  console.log(`🔁 Estado actual: ${user.estado}`);

  // ====================================
  // 🚦 Lógica del flujo de conversación
  // ====================================
  switch (user.estado) {
    // ---------- INICIO ----------
    case "inicio":
      respuesta = `👋 ¡Hola! ¿En qué puedo ayudarte hoy?
1️⃣ Hacer un pedido  
2️⃣ Hablar con un agente`;
      user.estado = "menu_principal";
      break;

    // ---------- MENÚ PRINCIPAL ----------
    case "menu_principal":
      if (msg === "1") {
        respuesta = `Perfecto 👍  
¿Qué tipo de pedido deseas?
1️⃣ Prestación de servicios  
2️⃣ Venta de materiales  
3️⃣ Volver atrás`;
        user.estado = "pedido_tipo";
      } else if (msg === "2") {
        respuesta = `👨‍💼 Te contactaremos con un asesor.  
📞 *Contacto ESIAD:* +51 910262022  
Puede comunicarse directamente.`;
        user.estado = "inicio";
      } else {
        respuesta = "Por favor elige una opción válida (1 o 2).";
      }
      break;

    // ---------- PEDIDO: TIPO ----------
    case "pedido_tipo":
      if (msg === "1") {
        respuesta = `Has elegido *Prestación de servicios*.  
¿Qué tipo de servicio necesitas?
1️⃣ Corte láser  
2️⃣ Ploteo e impresión de planos  
3️⃣ Impresión 3D  
4️⃣ Maquetado arquitectónico (requiere asesoría)  
5️⃣ Trabajo personalizado  
6️⃣ Volver atrás`;
        user.estado = "servicio_tipo";
      } else if (msg === "2") {
        respuesta = `Has elegido *Venta de materiales*.  
¿Qué producto te interesa?
1️⃣ Cartones  
2️⃣ Acrílicos  
3️⃣ MDF  
4️⃣ Cartulinas  
5️⃣ Pegamentos  
6️⃣ Volver atrás`;
        user.estado = "material_tipo";
      } else if (msg === "3") {
        respuesta = `Volviendo al menú principal...
👋 ¡Hola! ¿En qué puedo ayudarte hoy?
1️⃣ Hacer un pedido  
2️⃣ Hablar con un agente`;
        user.estado = "menu_principal";
      } else {
        respuesta = "Por favor elige una opción válida (1, 2 o 3).";
      }
      break;

    // ---------- SERVICIO: TIPO ----------
    case "servicio_tipo":
      if (msg === "1") {
        respuesta = `🪚 Has elegido *Corte láser*.  
Por favor, ingresa el material, espesor necesario y la escala del archivo (puedes subir tu archivo modelo de Autocad).`;
        user.estado = "corte_laser_datos";
      } else if (msg === "2") {
        respuesta = `📐 Has elegido *Ploteo e impresión de planos*.  
Por favor, sube los archivos en formato PDF.`;
        user.estado = "ploteo_pdf";
      } else if (msg === "3") {
        respuesta = `🧱 Has elegido *Impresión 3D*.  
Por favor, adjunta el archivo en formato SKP o STL (en milímetros).`;
        user.estado = "impresion3d_archivo";
      } else if (msg === "4") {
        respuesta = `👷‍♂️ Este servicio requiere asesoría.  
📞 Contacto ESIAD: +51 910262022`;
        user.estado = "inicio";
      } else if (msg === "5") {
        respuesta = `Has elegido *Trabajo personalizado*.  
1️⃣ Letras en 3D  
2️⃣ Recuerdos  
3️⃣ Volver atrás`;
        user.estado = "trabajo_personalizado";
      } else if (msg === "6") {
        respuesta = "Volviendo atrás...";
        user.estado = "pedido_tipo";
      } else {
        respuesta = "Por favor elige una opción válida (1-6).";
      }
      break;

    // ---------- CORTE LÁSER ----------
    case "corte_laser_datos":
      user.data.detalles = msg;
      respuesta = `Resumen del pedido:
🪚 Servicio: Corte láser  
📄 Detalles: ${msg}

¿Deseas confirmar tu pedido?
1️⃣ Confirmar  
2️⃣ Rechazar`;
      user.estado = "corte_laser_confirmar";
      break;

    case "corte_laser_confirmar":
      if (msg === "1") {
        respuesta = "✅ Gracias por su envío, lo revisaremos en unos instantes.";
        user.estado = "inicio";
      } else if (msg === "2") {
        respuesta = "❌ Lamentamos su decisión. ¡Hasta la próxima!";
        user.estado = "inicio";
      } else {
        respuesta = "Por favor elige una opción válida (1 o 2).";
      }
      break;

    // ---------- PLOTEO ----------
    case "ploteo_pdf":
      respuesta = `¿En qué tamaño deseas imprimir?
1️⃣ A0  
2️⃣ A1  
3️⃣ A2  
4️⃣ A3  
5️⃣ A4`;
      user.estado = "ploteo_tamano";
      break;

    case "ploteo_tamano":
      user.data.tamano = msg;
      respuesta = `¿En qué color deseas imprimir?
1️⃣ Blanco y negro  
2️⃣ Colores`;
      user.estado = "ploteo_color";
      break;

    case "ploteo_color":
      user.data.color = msg;
      respuesta = "¿Cuántos juegos deseas imprimir? (Ejemplo: 5)";
      user.estado = "ploteo_cantidad";
      break;

    case "ploteo_cantidad":
      user.data.cantidad = msg;
      respuesta = `Resumen del pedido:
📐 Servicio: Ploteo e impresión de planos  
📏 Tamaño: ${user.data.tamano}  
🎨 Color: ${user.data.color}  
📦 Cantidad: ${user.data.cantidad}

¿Confirmas tu pedido?
1️⃣ Confirmar  
2️⃣ Rechazar`;
      user.estado = "ploteo_confirmar";
      break;

    case "ploteo_confirmar":
      if (msg === "1") {
        respuesta = "✅ Gracias por su envío, lo revisaremos en unos instantes.";
        user.estado = "inicio";
      } else if (msg === "2") {
        respuesta = "❌ Pedido cancelado. ¡Hasta la próxima!";
        user.estado = "inicio";
      } else {
        respuesta = "Por favor elige una opción válida (1 o 2).";
      }
      break;

    // ---------- IMPRESIÓN 3D ----------
    case "impresion3d_archivo":
      respuesta = `¿En qué color deseas imprimir?
1️⃣ Blanco y negro  
2️⃣ Colores`;
      user.estado = "impresion3d_color";
      break;

    case "impresion3d_color":
      user.data.color = msg;
      respuesta = `Resumen del pedido:
🧱 Servicio: Impresión 3D  
🎨 Color: ${user.data.color}

¿Confirmas tu pedido?
1️⃣ Confirmar  
2️⃣ Rechazar`;
      user.estado = "impresion3d_confirmar";
      break;

    case "impresion3d_confirmar":
      if (msg === "1") {
        respuesta = "✅ Gracias por su envío, lo revisaremos en unos instantes.";
        user.estado = "inicio";
      } else if (msg === "2") {
        respuesta = "❌ Pedido cancelado. ¡Hasta la próxima!";
        user.estado = "inicio";
      } else {
        respuesta = "Por favor elige una opción válida (1 o 2).";
      }
      break;

    // ---------- DEFAULT ----------
    default:
      respuesta = "No entendí tu mensaje. Por favor elige una opción válida del menú.";
      break;
  }

  // Log del resultado
  console.log(`🧠 Nuevo estado: ${user.estado}`);
  console.log(`📤 Respuesta enviada: "${respuesta}"`);
  console.log("==========================================");

  // Enviar respuesta al usuario
  twiml.message(respuesta);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// ====================================
// 🚀 Iniciar servidor
// ====================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Chatbot ESIAD activo en puerto ${PORT}`)
);
