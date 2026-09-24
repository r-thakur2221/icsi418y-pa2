import axios from "axios";
const BaseURL = process.env.REACT_APP_BASEURL;

const httpClient = axios.create({
  baseURL: BaseURL,    
  headers: { "Content-Type": "application/json" },
});

console.log("HTTP BASE URL >>>", httpClient.defaults.baseURL);

export default httpClient;