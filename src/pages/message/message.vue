<template>
  <view>
    <nut-tabs v-model="tabs" auto-height @change="pagination.page = 1">
      <template #titles>
        <view class="tab-list">
          <nut-badge v-for="item in tabList" :key="item.paneKey" class="tab-item" @click="tabs = item.paneKey"
            :class="{ active: tabs === item.paneKey }" :value="msgCount[item.msgCategory]" :max="9"
            :hidden="msgCount[item.msgCategory] === 0" top="10" right="-5"> {{ item.title }}</nut-badge>
        </view>
      </template>
      <nut-tab-pane pane-key="1">
        <message-thread :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count" :category="1"
          :new-msg-count="msgCount.thread_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
      <nut-tab-pane pane-key="2">
        <message-thread :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count" :category="2"
          :new-msg-count="msgCount.post_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
      <nut-tab-pane pane-key="3">
        <message-thread :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count" :category="3"
          :new-msg-count="msgCount.post_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
    </nut-tabs>
    <nut-pagination class="pagination" v-if="!isLoading" v-model="pagination.page" mode="multi"
      :total-items="message?.total_count" :items-per-page="pagination.limit" />
    <Tabbar @tab-change="tabChange"></Tabbar>
  </view>
</template>

<script lang="ts" setup>
import Taro, { useDidShow } from '@tarojs/taro'
import { ref, watch } from 'vue'
import { Message, MessageCount } from '@/api';
import { computedAsync } from '@vueuse/core';
import MessageThread from './message-thread.vue'
import { useTabsStore } from '@/stores';
import Tabbar from '@/widgets/tabbar.vue'

const tabStore = useTabsStore()
const tabs = ref(1)
const tabList = ref([
  { title: '主题', paneKey: 1, msgCategory: "thread_msg_count" },
  { title: '帖子', paneKey: 2, msgCategory: "post_msg_count" },
  { title: '系统消息', paneKey: 3, msgCategory: "sys_msg_count" }
])
const isLoading = ref(true)
const pagination = ref({ page: 1, limit: 20 })
const message = computedAsync(async () => {
  const res = await Message({ page: pagination.value.page, pageSize: pagination.value.limit, category: tabs.value })
  return res.data || []
}, undefined, { evaluating: isLoading })
const msgCount = ref({
  at_msg_count: 0,
  letter_msg_count: 0,
  post_msg_count: 0,
  sys_msg_count: 0,
  thread_msg_count: 0
})

useDidShow(async () => {
  refreshData()
})

// 已读全部消息后刷新页面
const refreshData = async () => {
  const msgCountRes = await MessageCount()
  msgCount.value = msgCountRes.data.data
  const msgRes = await Message({ page: pagination.value.page, pageSize: pagination.value.limit, category: tabs.value })
  message.value = msgRes.data
  tabStore.messageCount = Object.values(msgCountRes.data.data).reduce((acc, cur) => acc + cur, 0)
}

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

const tabChange = () => {
  pagination.value.page = 1
}
</script>

<style lang="scss">
.tab-list {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding: 10px 5px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  .tab-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px 10px 20px 10px;
    font-size: 1.3rem;
    color: black;
    cursor: pointer;
  }

  .tab-item.active {
    color: red;
    border-bottom: 2px solid red;
  }
}


.nut-tab-pane {
  padding: 0;
}


.pagination {
  display: flex;
  justify-content: center;
  padding-bottom: 4rem;
}
</style>