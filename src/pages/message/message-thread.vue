<template>
  <view class="message-thread-page">
    <!-- 顶部标题和全部已读按钮 -->
    <view class="topbar">
      <view class="title">消息列表</view>
      <nut-button plain size="small" :disabled="newMsgCount === 0" @click="readAllMsg">全部已读</nut-button>
    </view>
    <!-- 主题列表 -->
    <view v-if="!props.isLoading" class="message-list">
      <template v-for="item in props.data">
        <nut-cell-group @click="clickMessage(item)">
          <!-- 用户头像,昵称，时间 -->
          <nut-cell class="user-info" desc-text-align="left">
            <template #icon>
              <nut-badge :dot="!item.is_new">
                <nut-avatar size="40" shape="round">
                  <img v-if="item.category !== 3" :src="item.send_user_avatar" />
                  <Notice v-else />
                </nut-avatar>
              </nut-badge>
            </template>
            <template #desc>
              <view class="info-desc">
                <view class="info">
                  <span class="nickname"> {{ item.category === 3 ? item.type : item.send_user_nickname }}</span>
                  <span class="time">{{ item.created_at.replace("T", " ").slice(0, -1) }}</span>
                </view>
                <view class="del-btn">
                  <Del @click.stop="deleteMessage" />
                </view>
              </view>
            </template>
          </nut-cell>
          <!-- 回复和帖子标题 -->
          <nut-cell>
            <template #default>
              <view v-if="item.category !== 3" class="message-content">
                <view class="reply-info">
                  <span class="title">{{ item.category === 6 ? "@我的" : "回复" }}:&nbsp;</span>
                  <span class="content">{{ item.message_fmt }}</span>
                </view>
                <view class="post-info" v-if="item.category === 2">
                  <span class="nickname">{{ item.receive_user_nickname }}:&nbsp;</span>
                  <span class="content">{{ item.send_message_fmt }}</span>
                </view>
                <view class="thread-title">
                  {{ item.subject }}
                </view>
              </view>
              <view v-else class="message-content">
                <view class="content">
                  {{ item.note }}
                </view>
              </view>
            </template>
          </nut-cell>
        </nut-cell-group>
      </template>
    </view>
    <!-- 主题消息列表骨架屏 -->
    <view v-else class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7, 8, 9]">
      <nut-skeleton width="90vw" height="20px" title animated avatarSize="40px" row="2">
      </nut-skeleton>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { Datum, MessageRead, MessageReadAll } from '@/api';
import Taro from '@tarojs/taro'
import { Del, Notice } from "@nutui/icons-vue-taro";

const emit = defineEmits<{
  pageTurning: [number],
  refresh: [],
}>()

const props = defineProps<{
  data: Datum[],
  isLoading: Boolean,
  totalCount: number,
  newMsgCount: number,
  category: number,
}>()

const clickMessage = (datum: Datum) => {
  // 已读当前消息
  MessageRead({ id: datum.id })
  if (datum.category === 3) {
    Taro.navigateTo({
      url: `/pages/notify/notify?title=${datum.type}&content=${datum.note}&time=${datum.created_at}`,
    })
    return
  }
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${datum.thread_id}`,
  })
}

const readAllMsg = async () => {
  const res = await MessageReadAll({ category: props.category })
  if (res.data.code === 0) {
    emit('refresh')
  }
}

const deleteMessage = () => {
  console.log('删除消息')
  // TODO: 删除消息
}
</script>

<style lang="scss">
.message-thread-page {
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 5vw;
    background: rgb(245, 246, 248);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);

    .title {
      font-size: 1.2rem;
      color: #333;
    }
  }

  .message-list {
    .info-desc {
      margin-left: 10px;
      width: 100%;
      display: flex;
      justify-content: space-between;

      .nickname {
        color: #333;
      }
    }

    .message-content {
      display: block;
      width: 100%;
      font-size: 1.2rem;

      .content {
        padding: 5px 0;
        color: #333;
        /** 最多显示两行，超出显示省略号 **/
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .reply-info {
        display: flex;

        .title {
          color: #999;
          white-space: nowrap;
        }
      }

      .post-info {
        margin: 10px 0;
        display: flex;

        .nickname {
          color: #333;
          white-space: nowrap;
        }
      }

      .thread-title {
        display: block;
        background-color: #f8f8f8;
        color: #333;
        border-radius: 4px;
        padding: 10px 10px;
        margin-top: 10px;
      }
    }

  }

  .skeleton-container {
    margin-top: 2rem;
    margin-left: 5vw;
  }
}
</style>