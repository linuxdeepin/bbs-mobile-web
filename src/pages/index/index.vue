<template>
  <nut-config-provider :theme='config.theme'>
    <NavComponent show-search></NavComponent>
    <view class="index-page">
      <!-- 轮播图 -->
      <view class="carousel" v-if="!config.carouselState.isLoading">
        <nut-swiper :init-page="0" :pagination-visible="true" pagination-color="#426543" auto-play="3000">
          <nut-swiper-item v-for="item in config.carouselState.state?.cards" @click="goLike(item.link)">
            <img :src="apiServer + item.img.url" :alt="item.title" />
          </nut-swiper-item>
        </nut-swiper>
      </view>
      <!-- 轮播图的骨架图 -->
      <nut-skeleton v-else width="100vw" height="200px" :title="false" animated row="1">
      </nut-skeleton>
      <!-- 帖子列表 -->
      <view class="thread-list" v-if="!isLoading">
        <template v-for="item in threadIndexResponse.ThreadIndex">
          <template v-if="item.user.id">
            <nut-cell-group>
              <!-- 帖子标题 -->
              <nut-cell class="thread-title" desc-text-align="left" is-link @click="goThread(item)">
                <template #title>
                  <view>
                    【{{ item.type.name }}】{{ item.subject }}
                    <nut-tag class="resolved" color="green" plain
                      v-if="item.attrs.some(attr => attr.name === 'Resolved')">已解决</nut-tag>
                  </view>
                </template>
                <template #icon>
                  <img v-if="item.top" style="width:20px;height: 20px;" :src="TopIcon" />
                </template>
              </nut-cell>
              <!-- 帖子信息 -->
              <nut-cell class="info" desc-text-align="left">
                <template #icon>
                  <nut-avatar size="16" shape="round">
                    <img :src="item.user.avatar" />
                  </nut-avatar>
                </template>
                <template #desc>
                  <view class="info-desc">
                    <view class="nickname"> {{ item.user.nickname }}</view>
                    <view class="stat">
                      <view>
                        <Eye size="10"></Eye> {{ item.views_cnt }}
                      </view>
                      <view>
                        <Comment size="10"></Comment> {{ item.posts_cnt }}
                      </view>
                    </view>
                  </view>
                </template>
              </nut-cell>
            </nut-cell-group>
          </template>
        </template>

        <view class="pagination" v-if="threadIndexResponse">
          <nut-pagination v-model="pagination.page" mode="multi" :total-items="threadIndexResponse.total_count"
            :items-per-page="pagination.limit" />
        </view>
      </view>
      <!-- 帖子列表的骨架图 -->
      <view v-else>
        <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
          <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
          </nut-skeleton>
        </view>
      </view>
      <!-- 分页组件 -->
      <!-- 底部标签切换 -->
      <Tabbar @tabChange="tabChange"></Tabbar>
    </view>
  </nut-config-provider>
</template>

<script lang="ts" setup>

import TopIcon from '@/assets/top.svg'

import { computedAsync } from "@vueuse/core";
import { apiServer, IndexThread, ThreadIndexResponse, MessageCount } from '@/api'
import Taro, { useDidShow, useShareTimeline, usePullDownRefresh } from '@tarojs/taro'
import { Comment, Eye } from "@nutui/icons-vue-taro";
import { useConfigStore, useTabsStore } from '@/stores'
import { watch, ref } from 'vue';
import NavComponent from "@/widgets/navigation.vue";
import Tabbar from "@/widgets/tabbar.vue";

const tabs = useTabsStore()
const config = useConfigStore()
// 恢复tab
useDidShow(() => {
  tabs.change({ name: 'index' })
})
// 加载帖子数据
const isLoading = ref(true)
const pagination = ref({ page: 1, limit: 20 })
const threadIndexRefresh = ref(0)
const threadIndexResponse = ref<ThreadIndexResponse>({ ThreadIndex: [], total_count: 0 })
computedAsync(async () => {
  threadIndexRefresh.value
  const resp = await IndexThread({ page: pagination.value.page, pageSize: pagination.value.limit });
  threadIndexResponse.value = resp.data || [];
  Taro.stopPullDownRefresh()
}, undefined, { evaluating: isLoading })
// 加载消息数量
useDidShow(async () => {
  if (config.indexNeedRefresh) {
    threadIndexRefresh.value++
    config.indexNeedRefresh = false
  }
  const res = await MessageCount()
  const { at_msg_count, letter_msg_count, post_msg_count, sys_msg_count, thread_msg_count } = res.data.data
  tabs.messageCount = at_msg_count + letter_msg_count + post_msg_count + sys_msg_count + thread_msg_count
})
// 首页下拉刷新
usePullDownRefresh(async () => {
  threadIndexRefresh.value++
})
// 翻页后跳转到顶部
watch(isLoading, () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
})
// 如果点击了首页导航，跳转返回到第一页
const tabChange = () => {
  pagination.value.page = 1
}
// 跳转到帖子详情
const goThread = (item: ThreadIndexResponse["ThreadIndex"][0]) => {
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
// 设置分享内容
useShareTimeline(() => {
  return {
    title: "论坛首页-深度科技",
    imageUrl: config.weixinShare.state?.default_img
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
      font-size: 16Px;

      .resolved {
        margin-left: 15rpx;
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
      font-size: 14Px;
      color: var(--text-desc-color);

      .stat {
        display: inline;

        view {
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
