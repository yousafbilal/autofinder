import axios from 'axios';

// const authToken = 'your_auth_token'; 

// Create a new instance of Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_ADDRESS || 'http://localhost:8001', // Prioritize .env, fallback to local
  timeout: 5000, // Set the request timeout if needed
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${authToken}`,
  },
});

export default api;
