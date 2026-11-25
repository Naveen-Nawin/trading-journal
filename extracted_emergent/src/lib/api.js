import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 30000 });
export const fileUrl = (path) => `${API}/files/${path}`;
export default API;
