import { defineStore } from "pinia";
import { ref } from "vue";

export const usePromptStore = defineStore("prompt", () => {
  const EmptyToast = {
    msg: "",
    visible: false,
    duration: 0,
    type: "text" as "text" | "success" | "fail" | "warn" | "loading",
  };
  const toast = ref(EmptyToast);
  let interval: ReturnType<typeof setTimeout>;
  const showToast = (
    type: typeof toast.value.type,
    msg: string,
    duration = 2000
  ) => {
    clearInterval(interval);
    if (duration > 0) {
      interval = setTimeout(() => (toast.value.visible = false), duration);
    }
    toast.value = { visible: true, type, msg, duration };
  };
  const hideToast = () => {
    toast.value = EmptyToast;
  };
  return { toast, showToast, hideToast };
});
