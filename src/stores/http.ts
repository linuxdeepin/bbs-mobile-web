import axios from "axios";

const isH5 = process.env.TARO_ENV === "h5";

export const http = axios.create({
  baseURL: isH5 ? "" : process.env.SERVER,
});
