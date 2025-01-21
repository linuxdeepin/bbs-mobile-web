<template>
  <view class="message-thread-page">
    <!-- 顶部标题和全部已读按钮 -->
    <view class="topbar">
      <view class="title">消息列表</view>
      <view class="right">
        <nut-button v-if="!isH5 && !subscribe.isSubscribe" size="small" style="margin-right: 5px;" type="primary"
          @click="subscribe.subscribeMessage()"> 订阅 </nut-button>
        <nut-button v-if="!isH5 && subscribe.isSubscribe" size="small" style="margin-right: 5px;" type="danger"
          @click="subscribe.cancelSubscribe()"> 取消订阅 </nut-button>
        <nut-button plain size="small" :disabled="newMsgCount === 0" @click="readAllMsg">全部已读</nut-button>
      </view>
    </view>
    <!-- 主题列表 -->
    <view v-if="!props.isLoading" class="message-list">
      <template v-if="totalCount">
        <template v-for="item in props.data">
          <MessageItem :message="item" />
        </template>
      </template>
      <view v-else>
        <nut-empty description="暂无消息"></nut-empty>
      </view>
    </view>
    <!-- 主题消息列表骨架屏 -->
    <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8, 9]">
      <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
      </nut-skeleton>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { MessageDatum, MessageReadAll } from '@/api';
import MessageItem from "./message-item.vue";
import { useSubscriptionStore } from '@/stores';

const isH5 = process.env.TARO_ENV === 'h5';

const emit = defineEmits<{
  pageTurning: [number],
  refresh: [],
}>()

const props = defineProps<{
  data: MessageDatum[],
  isLoading: Boolean,
  totalCount: number,
  newMsgCount: number,
}>()

const subscribe = useSubscriptionStore()

const readAllMsg = async () => {
  const res = await MessageReadAll({ category: props.data[0].category })
  if (res.data.code === 0) {
    emit('refresh')
  }
}
</script>

<style lang="scss">
.message-thread-page {
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 5vw;
    background: var(--msg-pane-topbar-bg-color);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);

    .title {
      color: var(--text-desc-color);
      font-size: 16Px;
    }
  }

  .skeleton-container {
    margin-top: 2rem;
    margin-left: 5vw;
  }
}
</style>