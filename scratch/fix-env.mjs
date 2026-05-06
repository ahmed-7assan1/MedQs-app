import fs from 'fs';
let c = fs.readFileSync('.env');
let str = c.toString('utf8');
str = str.replace(/P\0U\0T\0E\0R\0_.*/g, '');
str = str.replace(/PUTER_AUTH_TOKEN.*/g, ''); // in case
fs.writeFileSync('.env', str + '\nPUTER_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJUcWJmR1dnUjUyS2E3SlBXbG81YXc9PSIsInV1IjoiVTQ0SkpwZlNUYis0dzh5RTdxcnBkZz09IiwiaWF0IjoxNzc4MDI2MTgwfQ.yQ6moy6Y5IdfY47KiopbronGXX1X2Tm-FaijEQjWnro"\n');
console.log('Fixed .env');
