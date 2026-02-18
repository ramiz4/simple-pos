import axios from 'axios';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ?? '3000';
axios.defaults.baseURL = `http://${host}:${port}`;

export default async function () {
  // Configure axios for tests to use.
}
