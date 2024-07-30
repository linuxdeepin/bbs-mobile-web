<template>
  <view class="module-page">

    <!-- 按分类渲染版块 -->
    <template v-for="forum in forumList" :key="forum.name">
      <nut-cell-group :title="forum.name">
        <template #title>
          <view class="forum-title">{{ forum.name }}</view>
        </template>
        <!-- 外层遍历forumList -->
        <nut-grid :column-num="3" center clickable>
          <template v-for="subForum in forum.forum">
            <nut-grid-item @click="toModuleDetail(subForum.id)">
              <template #default>
                <view class="forum-item">
                  <img :src="subForum.icon" />
                  <view>{{ subForum.name }}</view>
                </view>
              </template>
            </nut-grid-item>
          </template>
        </nut-grid>
      </nut-cell-group>
    </template>
    <Tabbar />
  </view>
</template>

<script lang="ts" setup>
import { GetForum } from '@/api'
import { computedAsync } from '@vueuse/core';
import Tabbar from '@/widgets/tabbar.vue';
import Taro from '@tarojs/taro';

const forumList = computedAsync(async () => {
  const { data } = await GetForum()
  return data
})

const toModuleDetail = (forumId: number) => {
  // 跳转到版块详情页
  Taro.navigateTo({
    url: `/pages/module-detail/module-detail?id=${forumId}`
  })
}
</script>

<style lang="scss">
.module-page {
  padding: 0 20rpx 4rem;


  .forum-title {
    padding: 20rpx 20rpx 10rpx 20rpx;
    font-weight: 700;
    font-size: 5vw;
  }

  .forum-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
      width: 100rpx;
      height: 100rpx;
      border-radius: 12rpx;
    }

    view {
      margin-top: 5rpx;
      font-size: 28rpx;
    }
  }
}
</style>