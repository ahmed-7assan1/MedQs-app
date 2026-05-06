import puter from '@heyputer/puter.js';
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log("FETCH URL:", url);
  console.log("FETCH OPTIONS:", JSON.stringify(options, null, 2));
  return originalFetch(url, options);
};
puter.authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJUcWJmR1dnUjUyS2E3SlBXbG81YXc9PSIsInV1IjoiVTQ0SkpwZlNUYis0dzh5RTdxcnBkZz09IiwiaWF0IjoxNzc4MDI2MTgwfQ.yQ6moy6Y5IdfY47KiopbronGXX1X2Tm-FaijEQjWnro";
puter.ai.chat("hello", { model: "gpt-4o" }).catch(()=>{});
