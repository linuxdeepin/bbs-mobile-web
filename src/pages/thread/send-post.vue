<template>
    <nut-col span="20" offset="2">
        <view class="send-post">
            <nut-form>
                <!-- 网易易盾验证码，小程序插件引入 -->
                <ne-captcha :id="postCaptcha.elementID" :captcha-id="postCaptcha.captchaID" width="640rpx"
                    @verify="postCaptcha.verify">
                </ne-captcha>
                <nut-form-item>
                    <view class="form-item">
                        <view class="msg-input">
                            <nut-textarea v-model="msg" :style="{ height: inputHeight + 'rem' }" placeholder="说点什么吧..."
                                :disabled="!account.is_login" />
                        </view>
                        <img class="emoji-btn" :src="showEmojiList ? KeyboardIcon : SmileIcon"
                            @click="showEmojiList = !showEmojiList" />
                        <nut-button class="send-btn" type="primary" size="normal" :disabled="msg.length == 0"
                            @click="postCaptcha.tryVerify(submitPost)">发送</nut-button>
                        <!-- 未登陆时，点击回复提示前往登陆 -->
                        <view class="click-mask" v-if="!account.is_login"
                            @click="showLoginDialog = true; console.log('click')"></view>
                    </view>
                </nut-form-item>
            </nut-form>
            <view v-if="showEmojiList">
                <nut-tabs v-model="tabEmojiValue" swipeable type="smile">
                    <nut-tab-pane title="小浣熊" pane-key="0">
                        <view class="image-list">
                            <view class="image-item" v-for="( emoji, name ) of  customEmoji "
                                @click="msgImg = { alt: name, img: emoji }; postCaptcha.tryVerify(submitPost)">
                                <img :alt="name" :src="thread.server + '/' + emoji">
                            </view>
                            <view class="image-item" v-for=" _  of  Array(10).fill(0) "></view>
                        </view>
                    </nut-tab-pane>
                    <nut-tab-pane title="Emoji" pane-key="1">
                        <view class="emoji-list">
                            <view class="emoji-item" v-for=" emoji  of  unicodeEmoji " @click="msg += emoji">
                                {{ emoji }}
                            </view>
                            <view class="emoji-item" v-for=" _  of  Array(10).fill(0) "></view>
                        </view>
                    </nut-tab-pane>
                </nut-tabs>
                <view></view>
            </view>
        </view>

        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
        <nut-dialog content="请先登录账号" v-model:visible="showLoginDialog" @ok="account.gotoLogin()" />
    </nut-col>
</template>



<script lang="ts" setup>

import { ref, computed } from 'vue';

import SmileIcon from '@/assets/smile.svg'
import KeyboardIcon from '@/assets/keyboard-26.svg'

import { useAccountStore, usePromptStore, useThreadStore } from '@/stores';
import unicodeEmoji from './unicodeEmoji.json'
import customEmoji from './customEmoji.json'

const prompt = usePromptStore()
const thread = useThreadStore()
const account = useAccountStore()

// 回复内容
const msg = ref("")
const inputHeight = computed(() => {
    const lineNumber = msg.value.split("\n").length
    // 初始化1.5rem高度
    if (lineNumber === 1) {
        return 1.5
    }
    // 限制input最大高度，和下面的1.2保持一直
    if (lineNumber > 10) {
        return 12
    }
    // 多行使用(行数*1.2)rem
    // TODO(wurongjie) 如果写了很长的内容，并不使用换行，input高度不会自动调整
    return lineNumber * 1.2
})
// 回复图片，小浣熊表情和上传图片
const msgImg = ref({ alt: '', img: '' })
// 发帖验证码
const postCaptcha = account.useSmartCaptcha()
// 人机校验后发布回复
const submitPost = async (captchaCode: string) => {
    if (!account.is_login) {
        await account.login()
    }
    if (!thread.item) {
        return
    }
    try {
        // 发布评论
        let message = `<div data-weapp_version="v1">${msg.value}</div>`
        if (msgImg.value.img) {
            message = `<div data-weapp_version="v1"> 
                <img class="emoji" title="${msgImg.value.alt}" src="${msgImg.value.img}" alt="${msgImg.value.alt}">
            </div>`
        }
        await thread.createPost({
            message,
            validate: captchaCode,
            captcha_id: postCaptcha.captchaID,
            thread_id: thread.item.id,
            forum_id: thread.item.forum_id,
            quote_user_id: thread.item.user_id,
        })
        prompt.showToast('success', "发送成功")
        // 清空输入框内容
        msg.value = ''
        msgImg.value = { alt: '', img: '' }
        showEmojiList.value = false
        // 跳转到最新的评论页
        let last = Math.ceil(thread.postCount / thread.postLimit)
        // 如果正好换页，跳转到新页
        if (thread.postCount % thread.postLimit === 0) {
            last++
        }
        thread.pageChange(last)
    } catch (err) {
        console.log("create post", err)
        prompt.showToast('fail', "发送失败，请稍后在试")
    }
}
// 提示需要进行登陆
const showLoginDialog = ref(false)
const showEmojiList = ref(false)
const tabEmojiValue = ref(0)
</script>

<style lang="scss">
// 发帖
.send-post {
    position: fixed;
    bottom: 0;
    width: 92vw;
    left: 4vw;

    background-color: white;

    form {
        margin-top: 0;
        margin-bottom: 0;
    }

    .form-item {
        display: flex;
        gap: 20rpx;
        color: black;
        align-items: flex-end;

        .msg-input {
            flex: 1;
        }

        .emoji-btn,
        .image-btn {
            cursor: pointer;
        }

        // 表情按钮图片
        .emoji-btn {
            width: 2rem;
            height: 2rem;
        }

        .send-btn {
            height: 2rem;
        }
    }

    .emoji-list,
    .image-list {
        overflow: auto;
        max-height: 20vh;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    // 标准emoji表情
    .emoji-item {
        font-size: 1.5rem;
        width: 2.5rem;
    }

    // 小浣熊表情
    .image-item {
        width: 3.5rem;

        img {
            width: 3rem;
            height: 3rem;
        }
    }

    // 未登陆前遮挡输入框，提示前往登陆
    .click-mask {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 999;
    }
}
</style>