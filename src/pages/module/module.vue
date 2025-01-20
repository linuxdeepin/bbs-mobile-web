<template>
  <nut-config-provider :theme="config.theme" class="module-page">
    <template v-if="account.is_login && favoriteForumList && favoriteForumList.length">
      <nut-cell-group>
        <template #title>
          <view class="forum-title">已收藏版块</view>
        </template>
        <!-- 外层遍历forumList -->
        <nut-grid :column-num="3" center clickable>
          <template v-for="forum in favoriteForumList">
            <nut-grid-item @click="toModuleDetail(forum.id)">
              <template #default>
                <view class="forum-item">
                  <img :src="forum.icon" />
                  <view>{{ forum.name }}</view>
                </view>
              </template>
            </nut-grid-item>
          </template>
        </nut-grid>
      </nut-cell-group>
    </template>
    <!-- 按分类渲染版块 -->
    <template v-for="forum in forumList" :key="forum.name">
      <nut-cell-group v-if="forum.forum.length">
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
  </nut-config-provider>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { GetForum, UserForumFavoriteList } from '@/api'
import { computedAsync } from '@vueuse/core';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAccountStore, useConfigStore } from "@/stores";
import { setMessageCount } from '@/utils/message';

const account = useAccountStore()
const config = useConfigStore()

const forumList = computedAsync(async () => {
  const { data } = await GetForum()
  return data
})

const favoriteForumRefresh = ref(0)
const favoriteForumList = computedAsync(async () => {
  if (!account.is_login) {
    return []
  }
  favoriteForumRefresh.value
  const { data } = await UserForumFavoriteList()
  return data.data
})

// 返回到当前页面时刷新已收藏版块
useDidShow(() => {
  favoriteForumRefresh.value++
  setMessageCount()
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
  padding: 0 10Px 0.5rem;

  .forum-title {
    padding: 20rpx 20rpx 10rpx 20rpx;
    font-weight: 700;
    font-size: 5vw;
    color: var(--text-color)
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