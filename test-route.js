import fetch from "node-fetch";
async function run() {
  const origin = { lat: -6.8235, lng: 39.2695 }; // Kariakoo
  const dest = { lat: -7.7126, lng: 38.9377 }; // Kibiti
  const payload = {
    zoneId: "00000000-0000-0000-0000-000000000103",
    lang: "sw",
    destination: dest,
    origin,
    cart: [
      {
        productId: "test-heavy",
        quantity: 1,
        product: {
          id: "test-heavy",
          name: "Fridge 158L",
          weightKg: 34,
          lengthCm: 120,
          widthCm: 50,
          heightCm: 50,
          price: 500000,
          deliveryClass: "heavy"
        }
      }
    ],
    applyInsurance: false,
    shippingType: "fast_bus"
  };

  try {
    const res = await fetch("http://127.0.0.1:3000/api/v1/delivery/route-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
