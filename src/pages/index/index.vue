<template>
  <view class="index">
    <view class="carousel">
      <nut-swiper v-if="index.loaded" :init-page="0" :pagination-visible="true" pagination-color="#426543"
        auto-play="3000">
        <nut-swiper-item v-for="item  in  index.carousel.cards ">
          <img :src="'https://storage.deepin.org' + item.img.url" :alt="item.title" />
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
                <img style="width:20px;height: 20px;" :src="item.user.avatar" />
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
</template>

<script lang="ts">

import TopIcon from '../../assets/top.svg'

import Taro from '@tarojs/taro'
import { defineComponent, watch } from 'vue';

import { useIndexStore } from '../../stores'

export default defineComponent({
  name: 'Index',

  setup() {
    const index = useIndexStore()
    index.load()
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
    return {
      TopIcon,
      index, goThread,
    }
  }
})


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
}

.index {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
