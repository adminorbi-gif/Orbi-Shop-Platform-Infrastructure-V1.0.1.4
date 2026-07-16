import fetch from "node-fetch";

async function run() {
  const payload = {
    zoneId: "00000000-0000-0000-0000-000000000103",
    lang: "sw",
    destination: {
      address: "Kibiti",
      lat: -7.7126,
      lng: 38.9377
    },
    cart: [
      {
        productId: "test-heavy",
        quantity: 1,
        product: {
          id: "test-heavy",
          name: "Fridge 158L",
          weight: 34,
          dimensions: "120x50x50",
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
