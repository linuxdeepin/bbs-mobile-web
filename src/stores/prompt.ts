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

  const dialog = () => {
    const title = ref("");
    const content = ref("");
    const visible = ref(false);
    const show = (titleVal: string, contentVal: string) => {
      title.value = titleVal;
      content.value = contentVal;
      visible.value = true;
    };
    const hide = () => {
      visible.value = false;
    };
    return { show, hide, title, content, visible };
  };

  return { toast, dialog, showToast, hideToast };
});
