import puter from '@heyputer/puter.js';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJUcWJmR1dnUjUyS2E3SlBXbG81YXc9PSIsInV1IjoiVTQ0SkpwZlNUYis0dzh5RTdxcnBkZz09IiwiaWF0IjoxNzc4MDI2MTgwfQ.yQ6moy6Y5IdfY47KiopbronGXX1X2Tm-FaijEQjWnro";

// Puter allows signing in with token
puter.authToken = token; // Not sure if this is the right way

async function run() {
  try {
    console.log('Testing default chat...');
    const response = await puter.ai.chat("Hello");
    console.log('Response:', response.message ? response.message.content : response);
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
