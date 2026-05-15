import http from 'http';

function get(path: string) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  try {
    console.log("universities:", await get("/api/v1/universities"));
    console.log("academic-years:", await get("/api/v1/academic-years"));
    console.log("semesters:", await get("/api/v1/semesters"));
    console.log("faculties:", await get("/api/v1/faculties"));
  } catch (e) {
    console.error(e);
  }
}
test();
