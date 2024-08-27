<template>
  <nut-cell-group class="message-item" @click="clickMessage">
    <!-- 用户头像,昵称，时间 -->
    <nut-cell desc-text-align="left">
      <template #icon>
        <nut-badge :dot="!message.is_new">
          <nut-avatar size="40" shape="round">
            <img v-if="message.category !== 3" :src="message.send_user_avatar" />
            <Notice v-else />
          </nut-avatar>
        </nut-badge>
      </template>
      <template v-if="message.category !== 5" #desc>
        <view class="info-desc">
          <view class="info">
            <span class="nickname"> {{ message.category === 3 ? message.type : message.send_user_nickname }}</span>
            <span class="time">{{ formatTime(message.created_at) }}</span>
          </view>
          <view class="del-btn">
            <Del @click.stop="delBtnClicked(message.id)" />
          </view>
        </view>
      </template>
      <template v-else #desc>
        <view class="letter-content">
          <view class="top">
            <span class="nickname"> {{ message.send_user_nickname }} </span>
            <span class="time">{{ formatTime(message.created_at) }}</span>
          </view>
          <view class="bottom">
            <view class="content">{{ message.send_message_fmt }}</view>
            <Del @click.stop="delBtnClicked(message.id)" />
          </view>
        </view>
      </template>
    </nut-cell>
    <!-- 回复和帖子标题 -->
    <nut-cell v-if="message.category !== 5">
      <template #default>
        <view v-if="message.category !== 3" class="message-content">
          <view class="reply-info">
            <span class="title">{{ message.category === 6 ? "@我的" : "回复" }}:&nbsp;</span>
            <span class="content">{{ message.message_fmt }}</span>
          </view>
          <view class="post-info" v-if="message.category === 2">
            <span class="nickname">{{ message.receive_user_nickname }}:&nbsp;</span>
            <span class="content">{{ message.send_message_fmt }}</span>
          </view>
          <view class="thread-title">
            {{ message.subject }}
          </view>
        </view>
        <view v-else class="message-content">
          <view class="content">
            {{ message.note }}
          </view>
        </view>
      </template>
    </nut-cell>
  </nut-cell-group>
</template>

<script lang="ts" setup>
import { MessageDatum, MessageRead, PostOffset } from '@/api';
import { formatTime } from '@/utils/format';
import Taro from "@tarojs/taro"
import { Del, Notice } from "@nutui/icons-vue-taro";

const props = defineProps<{
  message: MessageDatum
}>()
// 1: 主题 2: 帖子 3: 系统消息 5: 私信 6: @我的
const clickMessage = async () => {
  // 已读当前消息
  MessageRead({ id: props.message.id })
  if (props.message.category === 3) {
    Taro.navigateTo({
      url: `/pages/notify/notify?title=${encodeURIComponent(props.message.type)}&content=${encodeURIComponent(props.message.note)}&time=${encodeURIComponent(formatTime(props.message.created_at))}`,
    })
    return
  }
  if (props.message.category === 5) {
    Taro.navigateTo({
      url: `/pages/dialog/dialog?uid=${props.message.send_user_id}`,
    })
    return
  }
  const res = await PostOffset({ id: props.message.send_post_id, thread_id: props.message.thread_id, page_size: 10 })
  Taro.navigateTo({
    url: `/pages/thread/thread?id=${props.message.thread_id}&postId=${props.message.send_post_id}&offset=${res.data.offset}`,
  })
}

const delBtnClicked = (id: number) => {
  Taro.eventCenter.trigger("msgDelBtnClicked", id)
}
</script>

<style lang="scss">
.message-item {
  .info-desc {
    margin-left: 10px;
    width: 100%;
    display: flex;
    justify-content: space-between;

    .info {
      display: flex;
      flex-direction: column;
    }

    .nickname {
      color: var(--text-desc-color);
    }

    .time {
      color: var(--text-desc-color);
    }
  }

  .letter-content {
    display: flex;
    flex-direction: column;

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .nickname {
        color: var(--text-desc-color);
      }

      .time {
        color: var(--text-desc-color);
      }
    }

    .bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10rpx;

      .content {
        flex: 1;
        color: var(--text-desc-color);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }
    }
  }

  .message-content {
    display: block;
    width: 100%;

    .content {
      padding: 5px 0;
      color: var(--text-desc-color);
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
        color: var(--text-desc-color);
        white-space: nowrap;
        padding: 5px 0;
      }
    }

    .post-info {
      margin: 10px 0;
      display: flex;

      .nickname {
        padding: 5px 0;
        color: var(--text-desc-color);
        white-space: nowrap;
      }
    }

    .thread-title {
      display: block;
      background-color: var(--reply-bg-color);
      color: var(--text-desc-color);
      border-radius: 4px;
      padding: 10px 10px;
      margin-top: 10px;
    }
  }
}
</style>