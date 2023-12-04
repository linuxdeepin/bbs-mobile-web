<template>
  <NavComponent show-search></NavComponent>
  <view class="index-page">
    <!-- 轮播图 -->
    <view class="carousel" v-if="index.loaded">
      <nut-swiper :init-page="0" :pagination-visible="true" pagination-color="#426543" auto-play="3000">
        <nut-swiper-item v-for="item in index.carousel.cards" @click="goLike(item.link)">
          <img :src="index.server + item.img.url" :alt="item.title" />
        </nut-swiper-item>
      </nut-swiper>
    </view>
    <!-- 轮播图的骨架图 -->
    <nut-skeleton v-else width="100vw" height="200px" :title="false" animated row="1">
    </nut-skeleton>
    <!-- 帖子列表 -->
    <view class="thread-list" v-if="index.loaded && index.threadLoaded">
      <template v-for="item in index.threads">
        <template v-if="item.user.id">
          <nut-cell-group>
            <!-- 帖子标题 -->
            <nut-cell class="thread-title" desc-text-align="left" is-link @click="goThread(item)">
              <template #desc>
                <span class="module">【{{ item.type.name }}】</span>
                <span class="title">
                  {{ item.subject }}
                </span>
              </template>
              <template #icon>
                <img v-if="item.top" style="width:20px;height: 20px;" :src="TopIcon" />
              </template>
            </nut-cell>
            <!-- 帖子信息 -->
            <nut-cell class="info" desc-text-align="left">
              <template #icon>
                <nut-avatar size="20" shape="round">
                  <img :src="item.user.avatar" />
                </nut-avatar>
              </template>
              <template #desc>
                <div class="info-desc">
                  <span class="nickname"> {{ item.user.nickname }}</span>
                  <span class="stat">
                    <span>
                      <Eye size="10"></Eye> {{ item.views_cnt }}
                    </span>
                    <span>
                      <Comment size="10"></Comment> {{ item.posts_cnt }}
                    </span>
                  </span>
                </div>
              </template>
            </nut-cell>
          </nut-cell-group>
        </template>
      </template>
    </view>
    <!-- 帖子列表的骨架图 -->
    <view v-else>
      <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
        <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
        </nut-skeleton>
      </view>
    </view>
    <!-- 分页组件 -->
    <view class="pagination">
      <nut-pagination v-model="index.page" mode="multi" :total-items="index.threadCount"
        :items-per-page="index.threadLimit" @change="index.pageChange($event)" />
    </view>
    <!-- 底部标签切换 -->
    <nut-tabbar v-model="tabs.active" bottom @tab-switch="tabChange">
      <nut-tabbar-item tab-title="首页" name="index">
        <template #icon>
          <Home></Home>
        </template>
      </nut-tabbar-item>
      <nut-tabbar-item tab-title="我的" name="account">
        <template #icon>
          <My2></My2>
        </template>
      </nut-tabbar-item>
    </nut-tabbar>
  </view>
</template>

<script lang="ts" setup>

import TopIcon from '@/assets/top.svg'

import Taro, { useDidShow, useShareTimeline } from '@tarojs/taro'
import { Home, My2, Comment, Eye } from "@nutui/icons-vue-taro";
import { useIndexStore, useTabsStore } from '@/stores'
import { watch } from 'vue';
import NavComponent from "@/widgets/navigation.vue";

const tabs = useTabsStore()
const index = useIndexStore()

useDidShow(() => {
  tabs.change({ name: 'index' })
})

// 如果点击了首页导航，跳转返回到第一页
const tabChange = (item: Parameters<typeof tabs.change>[0]) => {
  if (item.name === 'index') {
    index.pageChange(1)
  } else {
    tabs.change(item)
  }
}

watch(() => index.threads, () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
})

// 跳转到帖子详情
const goThread = (item: typeof index.threads[0]) => {
  // 预览数量增加
  item.views_cnt++
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${item.id}`,
  })
}
// 跳转到链接
const goLike = (page: string) => {
  // 小程序无法跳转到网页
  if (page.startsWith("https://")) {
    return
  }
  Taro.navigateTo({
    url: page,
  })
}
useShareTimeline(() => {
  return {
    title: "论坛首页-深度科技",
    imageUrl: index.weixinShare?.default_img
  }
})
</script>

<style lang="scss">
.index-page {
  .carousel {
    img {
      width: 100%;
      height: 42vw;
    }
  }

  .thread-list {
    .thread-title {
      .h5-span {
        display: inline;
      }
    }

    .nickname {
      display: inline-block;
      min-width: 30vw;
      max-width: 30vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      vertical-align: bottom;
    }

    .info-desc {
      display: flex;
      justify-content: space-between;

      .stat {
        display: inline;

        span {
          display: inline;
          margin-left: 1rem;
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 4rem;
  }

  .skeleton-container {
    margin-top: 1rem;
    margin-left: 5vw;
  }

}
</style>
