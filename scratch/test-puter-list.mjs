import puter from '@heyputer/puter.js';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJUcWJmR1dnUjUyS2E3SlBXbG81YXc9PSIsInV1IjoiVTQ0SkpwZlNUYis0dzh5RTdxcnBkZz09IiwiaWF0IjoxNzc4MDI2MTgwfQ.yQ6moy6Y5IdfY47KiopbronGXX1X2Tm-FaijEQjWnro";
puter.authToken = token;

async function run() {
  try {
    const models = await puter.ai.listModels();
    console.log('Available models:', JSON.stringify(models.slice(0, 10), null, 2)); // Print first 10
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
