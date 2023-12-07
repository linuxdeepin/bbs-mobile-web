import { http } from "./http";

export function GetAgreement(id: string, lang: "cn" | "en") {
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
