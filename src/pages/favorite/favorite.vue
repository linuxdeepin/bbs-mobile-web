<template>
  <view class="favorite-page">
    <NavH5 title="我的收藏" />
    <template v-if="!loading">
      <template v-if="myFavoriteData?.total_count">
        <view class="favorite-list">
          <view v-for="favorite in myFavoriteData?.data">
            <nut-cell-group class="favorite-item">
              <nut-cell is-link @click="goToThread(favorite.oid)">
                <template #default>
                  <view class="content">
                    <!-- 标题 -->
                    <view class="title">{{ favorite.title }}</view>
                    <!-- 昵称和时间 -->
                    <view class="info">
                      <view class="nickname">{{ favorite.user.nickname }}</view>
                      <view class="time">{{ formatTime(favorite.created_at) }}</view>
                    </view>
                  </view>
                </template>
              </nut-cell>
              <nut-cell>
                <template #default>
                  <!-- 标签和删除按钮 -->
                  <view class="some">
                    <nut-tag plain color="#FA2400"> {{ favorite.forum.name }} </nut-tag>
                    <Del @click="showDelDialog(favorite.oid)" />
                  </view>
                </template>
              </nut-cell>
            </nut-cell-group>
          </view>
        </view>
      </template>
      <view v-else>
        <nut-empty description="暂无收藏"></nut-empty>
      </view>
    </template>
    <template v-else>
      <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8]">
        <nut-skeleton width="90vw" height="20px" :title="false" animated row="3">
        </nut-skeleton>
      </view>
    </template>
    <nut-pagination class="pagination"
      v-if="!loading && myFavoriteData && myFavoriteData.total_count > pagination.limit" v-model="pagination.page"
      mode="multi" :total-items="myFavoriteData?.total_count" :items-per-page="pagination.limit" />
    <nut-dialog title="提示" content="是否删除收藏" v-model:visible="delDialogShow" @ok="delFavorite" />
    <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
      :duration="prompt.toast.duration" />
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Taro from '@tarojs/taro';
import { GetMyFavorite, MyFavoriteResponse, ThreadFavorite } from '@/api';
import { computedAsync } from '@vueuse/core';
import { formatTime } from '@/utils/format';
import { Del } from "@nutui/icons-vue-taro";
import { usePromptStore } from '@/stores';
import NavH5 from '@/widgets/navigation-h5.vue'

const prompt = usePromptStore()
const delDialogShow = ref(false)
const delFavoriteId = ref(0)
const init = ref(true)
const loading = ref(true)
const favoriteRefresh = ref(0)
const pagination = ref({ page: 1, limit: 10 })
const myFavoriteData = ref<MyFavoriteResponse>()
computedAsync(async () => {
  loading.value = true
  favoriteRefresh.value
  const myFavoriteRes = await GetMyFavorite({ offset: pagination.value.page - 1, limit: pagination.value.limit })
  myFavoriteData.value = myFavoriteRes.data
  loading.value = false
  init.value = false
}, undefined, { evaluating: loading })

const goToThread = (threadId: number) => {
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${threadId}`
  })
}
// 显示删除弹窗
const showDelDialog = (threadId: number) => {
  delDialogShow.value = true
  delFavoriteId.value = threadId
}
// 删除收藏
const delFavorite = () => {
  if (!delFavoriteId.value) return
  ThreadFavorite(delFavoriteId.value).then(res => {
    if (res.data.code === 0) {
      prompt.toast = { msg: '删除成功', type: 'success', duration: 1500, visible: true }
      delDialogShow.value = false
      favoriteRefresh.value++
    } else {
      prompt.toast = { msg: '删除失败', type: 'fail', duration: 1500, visible: true }
      delDialogShow.value = false
    }
  })
}

</script>

<style lang="scss">
.favorite-page {
  .favorite-item {
    width: 100%;

    .content {
      .title {
        margin: 10rpx 0;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }

      .info {
        display: flex;
        align-items: center;

        .time {
          margin-left: 10rpx;
          color: #97a3b4;
        }
      }
    }



    .some {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

  }

  .pagination {
    display: flex;
    justify-content: center;
    padding-bottom: 4rem;
  }

  .skeleton-container {
    margin-top: 2rem;
    margin-left: 5vw;
  }
}
</style>