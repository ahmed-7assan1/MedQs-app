import puter from '@heyputer/puter.js';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJUcWJmR1dnUjUyS2E3SlBXbG81YXc9PSIsInV1IjoiVTQ0SkpwZlNUYis0dzh5RTdxcnBkZz09IiwiaWF0IjoxNzc4MDI2MTgwfQ.yQ6moy6Y5IdfY47KiopbronGXX1X2Tm-FaijEQjWnro";
puter.authToken = token;

async function run() {
  try {
    const models = await puter.ai.listModels();
    const gemini = models.filter(m => m.id.includes('gemini') || m.id.includes('google'));
    console.log('Gemini/Google models:', gemini.map(m => m.id));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
