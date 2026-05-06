import puter from '@heyputer/puter.js';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJUcWJmR1dnUjUyS2E3SlBXbG81YXc9PSIsInV1IjoiVTQ0SkpwZlNUYis0dzh5RTdxcnBkZz09IiwiaWF0IjoxNzc4MDI2MTgwfQ.yQ6moy6Y5IdfY47KiopbronGXX1X2Tm-FaijEQjWnro";
puter.authToken = token;

async function run() {
  try {
    const models = ['claude-3-5-sonnet', 'gpt-4o', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    for (const model of models) {
      try {
        const response = await puter.ai.chat("Say 'Hello' and tell me what model you are.", { model });
        console.log(`[${model}] Success:`, JSON.stringify(response));
      } catch (e) {
        console.log(`[${model}] Failed:`, e.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
