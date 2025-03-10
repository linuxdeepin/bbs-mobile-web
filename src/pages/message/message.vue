<template>
  <nut-config-provider :theme="config.theme" class="message-page">
    <nut-tabs v-model="tabs" swipeable auto-height @change="pagination.page = 1">
      <template #titles>
        <view class="tab-list">
          <nut-badge v-for="item in tabList" :key="item.paneKey" class="tab-item" @click="tabs = item.paneKey"
            :class="{ active: tabs == item.paneKey }" :value="msgCount[item.msgCategory]" :max="9"
            :hidden="msgCount[item.msgCategory] === 0" top="10" right="-5"> {{ item.title
            }}</nut-badge>
        </view>
      </template>
      <nut-tab-pane :pane-key="1">
        <MessageTabPane :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count"
          :new-msg-count="msgCount.thread_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
      <nut-tab-pane :pane-key="2">
        <MessageTabPane :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count"
          :new-msg-count="msgCount.post_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
      <nut-tab-pane :pane-key="3">
        <MessageTabPane :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count"
          :new-msg-count="msgCount.sys_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
      <nut-tab-pane :pane-key="5">
        <MessageTabPane :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count"
          :new-msg-count="msgCount.letter_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
      <nut-tab-pane :pane-key="6">
        <MessageTabPane :data="message?.data" :is-loading="isLoading" :total-count="message?.total_count"
          :new-msg-count="msgCount.at_msg_count" @page-turning="onPageTurning" @refresh="refreshData" />
      </nut-tab-pane>
    </nut-tabs>
    <view class="pagination">
      <nut-pagination v-if="!isLoading && message?.total_count > pagination.limit" v-model="pagination.page"
        mode="multi" :total-items="message?.total_count" :items-per-page="pagination.limit" />
    </view>
    <nut-dialog title="提示" content="是否确认删除该条消息" v-model:visible="delDialogShow" @ok="deleteMessage" />
    <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
      :duration="prompt.toast.duration" />
  </nut-config-provider>
</template>

<script lang="ts" setup>
import Taro, { useDidShow } from '@tarojs/taro'
import { ref, watch } from 'vue'
import { Message, MessageCount, MessageDelete } from '@/api';
import { computedAsync } from '@vueuse/core';
import MessageTabPane from './message-tab-pane.vue'
import { usePromptStore, useConfigStore } from '@/stores';

const config = useConfigStore()
const prompt = usePromptStore()
const tabs = ref(1)
const tabList = ref([
  { title: '主题', paneKey: 1, msgCategory: "thread_msg_count" },
  { title: '帖子', paneKey: 2, msgCategory: "post_msg_count" },
  { title: '系统消息', paneKey: 3, msgCategory: "sys_msg_count" },
  { title: '私信', paneKey: 5, msgCategory: "letter_msg_count" },
  { title: '@我的', paneKey: 6, msgCategory: "at_msg_count" }
])
const isLoading = ref(true)
const delDialogShow = ref(false)
const delMsgId = ref(0)
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
  const messageCount = msgCount.value.at_msg_count + msgCount.value.letter_msg_count + msgCount.value.post_msg_count + msgCount.value.sys_msg_count + msgCount.value.thread_msg_count
  if (messageCount > 0) {
    Taro.setTabBarBadge({
      index: 3,
      text: messageCount.toString()
    })
  } else {
    Taro.removeTabBarBadge({
      index: 3
    })
  }
  const msgRes = await Message({ page: pagination.value.page, pageSize: pagination.value.limit, category: tabs.value })
  message.value = msgRes.data
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

// 监听消息删除按钮点击
Taro.eventCenter.on('msgDelBtnClicked', (id: number) => {
  delMsgId.value = id
  delDialogShow.value = true
})

const deleteMessage = async () => {
  delDialogShow.value = false
  try {
    if (delMsgId.value === 0) {
      throw new Error("消息ID错误")
    }
    await MessageDelete({ id: delMsgId.value }).then(res => {
      if (res.data.code === 0) {
        refreshData()
        delMsgId.value = 0
        prompt.showToast("success", "删除成功")
      }
    })
  } catch (error) {
    console.log("delete message: ", error)
    prompt.showToast("fail", "删除失败")
  }
}
</script>

<style lang="scss">
.message-page {
  .tab-list {
    display: flex;
    justify-content: space-around;
    width: 100%;
    padding: 10px 5px;
    background-color: var(--page-bg-color);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

    .tab-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px 10px 20px 10px;
      color: var(--text-color);
      cursor: pointer;
      font-size: 16Px;
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
    padding-bottom: 0.5rem;
  }
}
</style>