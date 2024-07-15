import dayjs from "dayjs";

export function formatTime(time: string) {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}