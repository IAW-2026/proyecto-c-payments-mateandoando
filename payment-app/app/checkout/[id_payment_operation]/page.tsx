<button 
  className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all shadow-md flex justify-center items-center mt-2"
  onClick={async (e) => {
    // Cambiamos el texto del botón
    const btn = e.currentTarget;
    btn.innerText = "Procesando...";
    btn.disabled = true;

    try {
      // Llamamos directo al POST (el que crea la preferencia en MP)
      const respuesta = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Asegurate de pasar los datos que tu API espera
          id_purchase_order: 'TU_ID_ORDEN', 
          id_buyer: 'ID_COMPRADOR', 
          total_price: 15000 // O el valor que corresponda
        })
      });

      const datos = await respuesta.json();

      if (datos.checkout_url) {
        // REDIRECCIÓN DIRECTA
        window.location.href = datos.checkout_url;
      } else {
        alert("No se pudo obtener el link de pago");
        btn.innerText = "Pagar con Mercado Pago";
        btn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
      btn.innerText = "Pagar con Mercado Pago";
      btn.disabled = false;
    }
  }}
>
  Pagar con Mercado Pago
</button>