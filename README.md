[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Ks7Ywtwc)
# payments

Aplicación **Payments** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `<!-- completar -->`.

Esta app corresponde al módulo de pagos en los proyectos de tipo **A (Transporte)**, **B (Delivery)** y **C (Marketplace)**.

---

Enunciado completo: <https://iaw-2026.github.io/proyecto/>

---
## Descripción de la aplicación
Esta aplicación se encarga de gestionar el flujo de datos del sistema. Permite simular y procesar los cobros de las compras realizadas y mantener un registro del historial de transacciones (aprobadas, pendiente, reembolsado y cancelado).

## Link al deploy
[Entrar a la Aplicación en Vercel](https://proyecto-c-payments-mateandoando.vercel.app)

## Tecnologías utilizadas
* *Framework:* Next.js (App Router)
* *Autenticación:* Clerk
* *Base de Datos:* PostgreSQL con Prisma ORM
* *Estilos:* Tailwind CSS

  ## Datos de prueba
Al ingresar, se ve un carrito ficticio con productos agregados y sus valores. Va a haber un boton que dice Pagar con Mercado Pago que te redirige a la url de pago donde se deberán ingresar como el usuario de tester:

Usuario: TESTUSER4567020841982056310
Contraseña: fjemn0O2R8
Codigo de verificacion: 269181

Si se desea procesar una compra nueva, serán necesarios datos de una tarjeta de prueba proporcionada por Mercado Pago: 
Nro de tarjeta: 4002 7686 9439 5619
Fecha de vto: 11/30
Código de seguridad: 123 
DNI: 12345678

En el nombre del titular de la tarjeta deberá colocar APRO u OTHE si desea que el pago sea APROBADO o RECHAZADO, respectivamente. Y para probar la interfaz PENDIENTE se debe intentar pagar con PagoFacil o Rapipago.


##Observación importante
No se pudo incluir un login y un historial de compras y ventas, queda guardado para la tercera entrega.
