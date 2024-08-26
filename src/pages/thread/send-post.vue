<template>
    <nut-col span="20" offset="2">
        <view class="send-post">
            <nut-form>
                <!-- 网易易盾验证码，小程序插件引入 -->
                <ne-captcha :id="postCaptcha.elementID" :captcha-id="postCaptcha.captchaID" width="640rpx"
                    @verify="postCaptcha.verify">
                </ne-captcha>
                <nut-form-item>
                    <view class="reply-info" v-if="isReply">
                        <text class="title">回复:</text>
                        <text class="nickname">{{ replyNickName }}</text>
                        <CircleClose class="cancel-btn" size="18" @click="cancelReply" />
                    </view>
                    <view v-if="chooseImgList.length" class="choose-img">
                        <text class="title">图片:</text>
                        <view class="image-list">
                            <view class="image-item" v-for="(img, index) in chooseImgList" :key="index">
                                <img :src="img" alt="" />
                                <view class="del-btn">
                                    <img :src="DeleteIcon" alt="" @click="chooseImgList.splice(index, 1)" />
                                </view>
                            </view>
                        </view>
                    </view>
                    <view class="form-item">
                        <view class="msg-input" :style="{ height: inputHeight + 0.5 + 'rem' }">
                            <textarea :value="msg" :style="{ marginTop: '0.5rem', height: inputHeight + 'rem' }"
                                placeholder="说点什么吧..." maxlength="1000" :show-confirm-bar="false" :hold-keyboard="true"
                                :cursorSpacing="20" :disabled="!account.is_login" @linechange="lineChange"
                                @input="msg = ($event as any).detail.value" :focus="isReply"
                                @blur="showEmojiList = false" />
                        </view>
                        <img class="emoji-btn" :src="showEmojiList ? KeyboardIcon : SmileIcon"
                            @click="showEmojiList = !showEmojiList" />
                        <img class="picture-btn" :src="Picture" @click="chooseImage" />
                        <nut-button class="send-btn" type="primary" size="normal" :disabled="msg.length == 0"
                            @click="postCaptcha.tryVerify(submitPost)">发送</nut-button>
                        <!-- 未登陆时，点击回复提示前往登陆 -->
                        <view class="click-mask" v-if="!account.is_login" @click="emit('login')"></view>
                    </view>
                </nut-form-item>
            </nut-form>
            <view v-if="showEmojiList">
                <nut-tabs v-model="tabEmojiValue" swipeable type="smile">
                    <nut-tab-pane title="小浣熊" pane-key="0">
                        <view class="image-list">
                            <view class="image-item" v-for="( emoji, name ) of  customEmoji" @click="clickImage(name)">
                                <img :alt="name" :src="apiServer + '/' + emoji">
                            </view>
                            <view class="image-item" v-for=" _ of Array(10).fill(0) "></view>
                        </view>
                    </nut-tab-pane>
                    <nut-tab-pane title="Emoji" pane-key="1">
                        <view class="emoji-list">
                            <view class="emoji-item" v-for=" emoji of unicodeEmoji " @click="msg += emoji">
                                {{ emoji }}
                            </view>
                            <view class="emoji-item" v-for=" _ of Array(10).fill(0) "></view>
                        </view>
                    </nut-tab-pane>
                </nut-tabs>
                <view></view>
            </view>
        </view>

        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
    </nut-col>
</template>



<script lang="ts" setup>

import { ref, computed } from 'vue';
import Taro from '@tarojs/taro';
import SmileIcon from '@/assets/smile.svg'
import KeyboardIcon from '@/assets/keyboard-26.svg'
import Picture from '@/assets/picture.svg'
import DeleteIcon from '@/assets/delete.svg'
import { useAccountStore, usePromptStore } from '@/stores';
import unicodeEmoji from './unicodeEmoji.json'
import customEmoji from './customEmoji.json'
import { apiServer, CreateThreadPost } from '@/api';
import { CircleClose } from '@nutui/icons-vue-taro';

const prompt = usePromptStore()
const account = useAccountStore()

const emit = defineEmits<{
    login: [],
    cancelReply: []
}>()
const props = defineProps<{
    info: { id: number, forum_id: number, user_id: number },
    isReply: boolean,
    replyId: number,
    replyUserId: number,
    replyNickName: string
}>()

const isChooseImage = defineModel()

// 回复内容
const msg = ref("")
const chooseImgList = ref<string[]>([])
const lineCount = ref(1)
const lineChange = (event: { detail: { lineCount: number, lineHeight: number } }) => {
    console.log(event.detail)
    lineCount.value = event.detail.lineCount
}
const inputHeight = computed(() => {
    const lineNumber = lineCount.value
    if (lineNumber <= 1) {
        return 1.5
    }
    if (lineNumber > 10) {
        return 12
    }
    return lineNumber * 1.2
    // 初始化1.5rem高度
    if (lineNumber <= 1) {
        return 1
    }
    // 限制input最大高度，和下面的1.2保持一直
    if (lineNumber > 10) {
        return 12
    }
    // 多行使用(行数*1.2)rem
    // TODO(wurongjie) 如果写了很长的内容，并不使用换行，input高度不会自动调整
    return lineNumber * 1
})
// 发帖验证码
const postCaptcha = account.useSmartCaptcha()
// 点击图片表情
const clickImage = (imgName: string) => {
    msg.value += ` :${imgName}: `
}
// 人机校验后发布回复
const submitPost = async (captchaCode: string) => {
    if (!account.is_login) {
        account.gotoLogin()
        return
    }
    // 发布评论
    try {
        let val = msg.value
        if (val.includes(":")) {
            for (const name of Object.keys(customEmoji)) {
                const reg = new RegExp(`:${name}:`, "g")
                const img = `<img class="emoji" title="${name}" src="${customEmoji[name]}" alt="${name}">`
                val = val.replace(reg, img)
            }
        }
        let message = `<div data-weapp_version="v1"><p>${val}</p>`
        // 如果有选择图片,则上传图片,并追加到评论后面
        if (chooseImgList.value.length) {
            // 上传图片
            let imgUrls: string[] = []
            prompt.showToast("loading", "图片上传中...", 10000)
            for (let i = 0; i < chooseImgList.value.length; i++) {
                const file = chooseImgList.value[i]
                const uploadFileRes = await Taro.uploadFile({
                    url: apiServer + '/api/v1/thread/file',
                    filePath: file,
                    name: 'image',
                    header: {
                        "Cookie": "bbs=" + JSON.parse(Taro.getStorageSync("PAGE_COOKIE"))["taro.com"]["/"]["bbs"]['value']
                    },
                    formData: {
                        "image": file
                    }
                })
                if (uploadFileRes.statusCode !== 200) {
                    prompt.showToast("fail", "上传图片失败")
                    return
                }
                imgUrls.push(JSON.parse(uploadFileRes.data).data[0])
            }
            prompt.hideToast()
            message += imgUrls.map(url => `<p><img src='${url}' style='max-width: 100%' /></p>`).join('')
        }
        message += "</div>"
        if (!props.isReply) {
            await CreateThreadPost({
                message,
                validate: captchaCode,
                captcha_id: postCaptcha.captchaID,
                thread_id: props.info.id,
                forum_id: props.info.forum_id,
                quote_user_id: props.info.user_id,
            })
        } else {
            await CreateThreadPost({
                message,
                validate: captchaCode,
                captcha_id: postCaptcha.captchaID,
                thread_id: props.info.id,
                forum_id: props.info.forum_id,
                quote_user_id: props.replyUserId,
                quote_post_id: props.replyId,
            })
        }

        prompt.showToast('success', "发送成功")
        // 清空输入框内容
        msg.value = ''
        // 清空图片列表
        chooseImgList.value = []
        showEmojiList.value = false
        Taro.eventCenter.trigger('sendPost')
    } catch (err) {
        console.log("create post", err)
        prompt.showToast('fail', "发送失败，请稍后再试")
    }
}

// 选择图片
const chooseImage = async () => {
    // 最多添加5张
    if (chooseImgList.value.length >= 5) {
        prompt.showToast("warn", "最多添加5张图片")
        return
    }
    isChooseImage.value = true
    const chooseImgRes = await Taro.chooseImage({
        count: 5,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
    })
    // 图片大小不能超过2M
    if (chooseImgRes.tempFiles[0].size > 2 * 1024 * 1024) {
        prompt.showToast("fail", "图片大小不能超过2M")
        return
    }
    // 添加图片到列表
    chooseImgList.value = chooseImgList.value.concat(chooseImgRes.tempFilePaths)
}

const cancelReply = () => {
    emit("cancelReply")
    chooseImgList.value = []
}

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

    background: var(--page-bg-color);

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

            textarea,
            .taro-textarea {
                width: 100%;
                background: var(--send-post-textarea-bg-color);
            }
        }

        .emoji-btn,
        .image-btn {
            cursor: pointer;
        }

        // 表情按钮图片
        .emoji-btn,
        .picture-btn {
            width: 2rem;
            height: 2rem;
        }

        .send-btn {
            height: 2rem;
        }
    }

    .reply-info {
        display: flex;
        align-items: center;
        margin-bottom: 10rpx;

        .title {
            color: var(--text-desc-color);
        }

        .nickname {
            color: #007aff;
            min-width: 0;
        }

        .cancel-btn {
            margin-left: 10rpx;
        }
    }

    .choose-img {
        margin: 10rpx 0;

        .title {
            color: var(--text-desc-color);
        }

        .image-list {
            padding: 10rpx 0;
            display: flex;
            justify-content: flex-start;
            flex-wrap: wrap;
        }

        .image-item {
            position: relative;
            width: 3rem;
            height: 3rem;
            margin-right: 10rpx;

            img {
                width: 100%;
                height: 100%;
                border-radius: 12rpx;
            }

            .del-btn {
                position: absolute;
                top: 0;
                right: 0;
                width: 1rem;
                height: 1rem;
                background: rgba(240, 240, 240, 0.8);
                border-radius: 0 12rpx 0 12rpx;
                padding: 2rpx;

                img {
                    width: 100%;
                    height: 100%;
                }
            }
        }
    }

    .nut-tab-pane {
        background: var(--emoji-pane-bg-color);
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