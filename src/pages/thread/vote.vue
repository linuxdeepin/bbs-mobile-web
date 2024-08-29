<template>
  <nut-col class="vote-card" span="22" offset="1">
    <nut-cell-group>
      <nut-cell :title="pollList.poll_expire ? (pollList.multiple ? '多选投票' : '单选投票') : '(该投票已过期，投票结果如下)'"
        :sub-title="pollList.poll_expire && pollList.multiple ? `最多可选${pollList.maxchoices}项` : ''"
        :size="pollList.poll_expire && pollList.multiple ? 'large' : ''" center>
        <template #desc>
          <span style="color: #777">共有
            <span class="voter-number">{{ pollList.voters_number }}</span>
            人参与投票</span>
        </template>
      </nut-cell>
      <!-- 未参与投票时，让用户投票-->
      <template v-if="pollList.polloptionids === null && pollList.poll_expire">
        <!-- 多选投票 -->
        <nut-checkbox-group v-if="pollList.multiple" v-model="voteOptionIds" :max="pollList.maxchoices">
          <nut-cell v-for="(item, index) in pollList.forum_polloption" :key="index" center>
            <nut-checkbox class="vote-content" :icon-size="18" :label="item.polloptionid">
              {{ `${index + 1}. ${item.polloption}` }}</nut-checkbox>
          </nut-cell>
        </nut-checkbox-group>
        <!-- 单选投票 -->
        <nut-radio-group v-else v-model="voteOptionId">
          <nut-cell v-for="(item, index) in pollList.forum_polloption" :key="index" center>
            <nut-radio class="vote-content" :label="item.polloptionid">
              {{ `${index + 1}. ${item.polloption}` }}</nut-radio>
          </nut-cell>
        </nut-radio-group>
        <nut-cell><nut-button block type="primary" @click="voting">投票</nut-button></nut-cell>
      </template>
      <!-- 参与投票后或者投票过期展示投票结果 -->
      <nut-cell v-else v-for="(item, index) in pollList.forum_polloption" :key="index" center>
        <template #title>
          <view>
            <span>{{ `${index + 1}. ${item.polloption}` }}</span>
            <span class="vote-count">{{ `（${item.votes}票）` }}</span>
          </view>
        </template>
        <template #desc>
          <nut-progress :percentage="item.rate" />
        </template>
      </nut-cell>
    </nut-cell-group>
  </nut-col>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useAccountStore, usePromptStore } from "@/stores";
import { Polllist, ThreadPoll } from "@/api";

const emit = defineEmits<{
  login: [],
  voting: []
}>()

const props = defineProps<{
  threadId: number,
  pollList: Polllist
}>()

const account = useAccountStore()
const prompt = usePromptStore()

// 单选投票选中的选项
const voteOptionId = ref(0)
// 多选投票选中的选项
const voteOptionIds = ref([] as number[])

// 提交投票
const voting = () => {
  if (!account.is_login) {
    emit("login")
    return
  }
  // 判断是否选中了选项
  if (!props.pollList.multiple) {
    if (!voteOptionId.value) {
      prompt.showToast('fail', "请选择一个选项")
      return
    }
  } else {
    if (voteOptionIds.value.length === 0) {
      prompt.showToast('fail', "请选择至少一个选项")
      return
    }
  }
  try {
    let options = voteOptionId.value ? [voteOptionId.value] : voteOptionIds.value
    ThreadPoll(props.threadId, options).then(() => {
      prompt.showToast('success', "投票成功")
      emit("voting")
    })
  } catch (err) {
    console.log("voting", err)
    prompt.showToast('fail', "投票失败，请稍后在试")
  }
}
</script>

<style lang="scss">
.vote-card {
  .voter-number {
    color: #1890ff;
  }

  .vote-count {
    margin-left: 10px;
  }

  .vote-content {
    max-width: 100%;
    word-wrap: break-word;
  }

  .nut-radio-group {
    width: 100%;
  }
}
</style>