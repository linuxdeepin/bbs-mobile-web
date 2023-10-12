import { defineStore } from "pinia";
import { ref } from "vue";
import { http } from "./http";

export const useAgreementStore = defineStore("agreement", () => {
  const registerAgreementList = ref([
    { id: "6d61900fd8e94259ac533d26695d363d", name: "深度隐私政策" },
    { id: "f3a185cb59d546309362ac39e795ffbf", name: "深度帐号使用协议" },
  ]);
  return { registerAgreementList, getAgreement };
});

function getAgreement(id: string, lang: "cn" | "en") {
  const api = "https://agreement.uniontech.com/v1/agreement";
  const url = `${api}?openid=${id}&lang=${lang}`;
  return http.get<AgreementResponse>(url);
}

interface AgreementResponse {
  result: boolean;
  code: number;
  data: Data;
}

interface Data {
  container: boolean;
  content: string;
  version: string;
}
