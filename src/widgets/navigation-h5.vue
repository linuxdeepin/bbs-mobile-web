<template>
  <nut-navbar v-if="isH5" :title="title" left-show fixed placeholder @click-back="back"></nut-navbar>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Taro from "@tarojs/taro"

defineProps({
  title: String
})

const isH5 = ref(false)
if (process.env.TARO_ENV === 'h5') {
  isH5.value = true
}
// 判断是否可以返回
const canBack = ref(false)
if (Taro.getCurrentPages().length > 1) {
  canBack.value = true
}

const back = () => {
  if (canBack.value) {
    Taro.navigateBack()
  }
}

</script>