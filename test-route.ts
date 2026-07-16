import { getRouteEstimate } from "./server/lib/shippingIntelligence.js";

async function run() {
  const origin = { lat: -6.8235, lng: 39.2695 }; // Kariakoo
  const dest = { lat: -7.7126, lng: 38.9377 }; // Kibiti
  const route = await getRouteEstimate(origin, dest);
  console.log(route);
}
run();
