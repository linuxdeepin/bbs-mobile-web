<template>
  <view class="notify-page">
    <NavH5 title="系统通知" />
    <view class="notify-header">
      <nut-avatar size="50" shape="round">
        <Notice />
      </nut-avatar>
      <view class="notify-title">{{ title }}</view>
      <view class="notify-time">{{ time }}</view>
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
import NavH5 from "@/widgets/navigation-h5.vue";

const instance = getCurrentInstance();
const title = ref("");
const content = ref("");
const time = ref("");
if (instance.router) {
  title.value = decodeURIComponent(instance.router.params.title || "");
  content.value = decodeURIComponent(instance.router.params.content || "");
  time.value = decodeURIComponent(instance.router.params.time || "");
}

</script>

<style lang="scss">
.notify-page {
  padding: 30rpx;

  .notify-header {
    display: flex;
    align-items: center;
    height: 100rpx;
    font-size: 18Px;

    .notify-title {
      margin-left: 10rpx;
      flex: 1;
    }

    .notify-time {
      color: #999;
    }
  }

  .notify-content {
    font-size: 16Px;
  }
}
</style>