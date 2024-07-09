<template>
  <nut-tabs v-model="tabs">
    <nut-tab-pane title="主题" pane-key="1">
      <message-thread :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count"
        :pagination="pagination" @page-turning="onPageTurning" />
    </nut-tab-pane>
  </nut-tabs>
</template>

<script lang="ts" setup>
import Taro from '@tarojs/taro'
import { ref, watch } from 'vue'
import { Message } from '@/api';
import { computedAsync } from '@vueuse/core';
import MessageThread from './message-thread.vue'

const tabs = ref(1)
const isLoading = ref(true)
const pagination = ref({ page: 1, limit: 20 })
const message = computedAsync(async () => {
  const res = await Message({ page: pagination.value.page, pageSize: pagination.value.limit, category: 1 })
  console.log(res);
  return res.data || []
}, undefined, { evaluating: isLoading })

// 翻页后跳转到顶部
watch(isLoading, () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
})

const onPageTurning = (page: number) => {
  pagination.value.page = page
}
</script>

<style>
.nut-tab-pane {
  padding: 0 16px;
}
</style>