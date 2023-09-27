<template>
  <view>
    <view v-if="index.loaded">
      <view class="index">
        <view class="carousel">
          <nut-swiper v-if="index.loaded" :init-page="0" :pagination-visible="true" pagination-color="#426543"
            auto-play="3000">
            <nut-swiper-item v-for="item  in  index.carousel.cards ">
              <img :src="index.server + item.img.url" :alt="item.title" />
            </nut-swiper-item>
          </nut-swiper>
        </view>
        <view class="thread-list">
          <template v-for="item in index.threads">
            <template v-if="item.user.id">
              <nut-cell-group>
                <nut-cell class="thread" desc-text-align="left" is-link @click="goThread(item.id)">
                  <template #desc>
                    <span class="module">【软件开发】</span>
                    <span class="title">
                      {{ item.subject }}
                    </span>
                  </template>
                  <template #icon>
                    <img v-if="item.top" style="width:20px;height: 20px;" :src="TopIcon" />
                  </template>
                </nut-cell>
                <nut-cell class="info" desc-text-align="left">
                  <template #icon>
                    <nut-avatar size="20" shape="round">
                      <img :src="item.user.avatar" />
                    </nut-avatar>
                  </template>
                  <template #desc>
                    <span class="nickname"> {{ item.user.nickname }}</span>
                    <span>
                      发帖时间： {{ item.created_at.slice(0, 16) }}
                    </span>
                  </template>
                </nut-cell>
              </nut-cell-group>
            </template>
          </template>
        </view>

      </view>
      <view class="pagination">
        <nut-pagination v-model="index.page" mode="simple" :total-items="index.threadCount" :items-per-page="20"
          @change="index.pageChange" />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>

import Taro from '@tarojs/taro'
import { watch } from 'vue';

import TopIcon from '../../assets/top.svg'
import { useIndexStore } from '../../stores'

const index = useIndexStore()
watch(() => index.page, () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
})
const goThread = (id: number) => {
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${id}`,
  })
}
</script>

<style lang="scss">
.carousel {
  img {
    width: 100%;
    height: 42vw;
  }
}

.thread-list {
  .thread span {
    display: inline;
  }

  .info span {
    display: inline-block;
  }

  .nickname {
    min-width: 30vw;
    max-width: 30vw;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  padding-bottom: 10px;
}

.index {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
