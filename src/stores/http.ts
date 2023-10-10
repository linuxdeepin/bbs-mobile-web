import axios from "axios";
import { document, window } from "@tarojs/runtime";
const isH5 = process.env.TARO_ENV === "h5";

export const apiServer = process.env.SERVER;

export const http = axios.create({
  baseURL: isH5 ? "" : process.env.SERVER,
});

console.log({ document, window });
