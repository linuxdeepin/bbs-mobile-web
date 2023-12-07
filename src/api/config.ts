import { http } from "./http";

// 获取原始配置
function getRawConfig<T>(field: "carousel" | "weixin_share") {
  return http
    .get<RawConfig>("/api/v2/public/config/" + field)
    .then((resp) => JSON.parse(resp.data.value) as T);
}

// 获取轮播图配置
export async function CarouselConfig() {
  const config = await getRawConfig<CarouselConfig>("carousel");
  config.cards = config.cards.filter(
    (item) => item.device === "all" || item.device === "weapp"
  );
  return config;
}
// 获取微信分享配置
export async function WeixinShareConfig() {
  return getRawConfig<WeixinShareConfig>("weixin_share");
}

interface RawConfig {
  id: number;
  field: string;
  value: string;
}

interface CarouselConfig {
  cards: Card[];
}

interface Card {
  link: string;
  title: string;
  language: string;
  device: "phone" | "pc" | "weapp" | "all";
  img: {
    url: string;
  };
}

interface WeixinShareConfig {
  debug: boolean;
  title_max_length: number;
  title_suffix: string;
  daemon: string;
  default_img: string;
}
