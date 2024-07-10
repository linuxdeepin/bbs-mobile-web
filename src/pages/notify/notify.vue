<template>
  <view class="notify-page">
    <view class="notify-header">
      <nut-avatar size="50" shape="round">
        <Notice />
      </nut-avatar>
      <view class="notify-title">{{ title }}</view>
      <view class="notify-time">{{ time.replace("T", " ").slice(0, -1) }}</view>
    </view>
    <nut-divider />
    <view class="notify-content">
      {{ content }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { Notice } from "@nutui/icons-vue-taro";
import { getCurrentInstance } from "@tarojs/taro";

const instance = getCurrentInstance();
const title = ref("");
const content = ref("");
const time = ref("");
if (instance.router) {
  title.value = instance.router.params.title || "";
  content.value = instance.router.params.content || "";
  time.value = instance.router.params.time || "";
}

</script>

<style lang="scss">
.notify-page {
  padding: 30rpx;

  .notify-header {
    display: flex;
    align-items: center;
    height: 100rpx;

    .notify-title {
      margin-left: 10rpx;
      flex: 1;
      font-size: 1.3rem;
    }

    .notify-time {
      color: #999;
    }
  }

  .notify-content {
    font-size: 1.2rem;
  }
}
</style>