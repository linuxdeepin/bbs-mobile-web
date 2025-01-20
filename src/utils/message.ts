import { MessageCount } from '@/api'
import Taro from "@tarojs/taro";

export async function setMessageCount() {
  const res = await MessageCount()
  const msgData = res.data.data
  const messageCount = msgData.at_msg_count + msgData.letter_msg_count + msgData.post_msg_count + msgData.sys_msg_count + msgData.thread_msg_count
  if (messageCount > 0) {
    Taro.setTabBarBadge({
      index: 3,
      text: messageCount.toString()
    })
  } else {
    Taro.removeTabBarBadge({
      index: 3
    })
  }
}