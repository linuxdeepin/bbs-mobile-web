<template>
    <nut-col span="20" offset="2">
        <view class="markdown-composer-entry" @click="openEditor">
            <text class="markdown-composer-entry-text">{{ msg.trim() || (chooseImgList.length ? '已添加图片，点击继续编辑' : '说点什么吧…') }}</text>
            <nut-button size="small" type="primary" :disabled="submitting" @click.stop="openEditor">写回复</nut-button>
        </view>
        <MarkdownComposer v-model:visible="editorVisible" title="写回复" :busy="submitting">
        <view class="send-post">
            <nut-form>
                <!-- 网易易盾验证码，小程序插件引入 -->
                <ne-captcha :id="postCaptcha.elementID" :captcha-id="postCaptcha.captchaID" width="640rpx"
                    @verify="postCaptcha.verify">
                </ne-captcha>
                <nut-form-item class="markdown-editor-form">
                    <view class="reply-info" v-if="replyInfo.isReply">
                        <text class="title">回复:</text>
                        <text class="nickname">{{ replyInfo.replyNickName }}</text>
                        <CircleClose class="cancel-btn" size="18" @click="cancelReply" />
                    </view>
                    <view v-if="chooseImgList.length" class="choose-img">
                        <text class="title">图片:</text>
                        <view class="image-list">
                            <view class="image-item" v-for="(img, index) in chooseImgList" :key="index">
                                <img :src="img" alt="" />
                                <view class="del-btn">
                                    <img :src="DeleteIcon" alt="" @click="!submitting && chooseImgList.splice(index, 1)" />
                                </view>
                            </view>
                        </view>
                    </view>
                    <MarkdownEditor ref="editor" v-model="msg" :max-length="REPLY_MAX_LENGTH"
                            :disabled="!account.is_login || submitting" :focus="editorVisible" />
                    <view class="form-item">
                        <img class="emoji-btn" :src="showEmojiList ? KeyboardIcon : SmileIcon"
                            @click="!submitting && (showEmojiList = !showEmojiList)" />
                        <img class="picture-btn" :src="Picture" @click="chooseImage" />
                        <nut-button class="send-btn" type="primary" size="normal"
                            :loading="submitting" :disabled="submitting || cooldownSeconds > 0 || (!msg.trim() && !chooseImgList.length)"
                            @click="requestPost">{{ cooldownSeconds ? `${cooldownSeconds}秒后发送` : '发送' }}</nut-button>
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
                            <view class="emoji-item" v-for=" emoji of unicodeEmoji " @click="!submitting && editor?.insertText(emoji)">
                                {{ emoji }}
                            </view>
                            <view class="emoji-item" v-for=" _ of Array(10).fill(0) "></view>
                        </view>
                    </nut-tab-pane>
                </nut-tabs>
                <view></view>
            </view>
        </view>
        </MarkdownComposer>

        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
    </nut-col>
</template>



<script lang="ts" setup>

import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useTimestamp } from '@vueuse/core';
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
import MarkdownEditor from '@/widgets/markdown-editor.vue';
import MarkdownComposer from '@/widgets/markdown-composer.vue';
import { createMessage } from '@/utils/markdown';
import { uploadImage, MAX_IMAGE_SIZE } from '@/utils/upload';
import { submissionGuard, submissionFingerprint, REPLY_MAX_LENGTH } from '@/utils/submission';
import { requestErrorMessage } from '@/utils/errors';

const prompt = usePromptStore()
const account = useAccountStore()

const emit = defineEmits<{
    login: [],
    cancelReply: [],
    sent: [replyId: number]
}>()
const props = defineProps<{
    info: { id: number, forum_id: number, user_id: number },
    replyInfo: { isReply: boolean, replyId: number, replyUserId: number, replyNickName: string }
}>()

const isChooseImage = defineModel()

// 回复内容
const msg = ref("")
const editorVisible = ref(false)
const editorSession = ref(0)
watch(editorVisible, visible => {
    if (!visible) editorSession.value++
}, { flush: 'sync' })
const openEditor = () => {
    if (!account.is_login) { emit('login'); return }
    editorVisible.value = true
}
watch(() => props.replyInfo, value => {
    if (value.isReply) openEditor()
}, { immediate: true })
onBeforeUnmount(() => { editorVisible.value = false })
const chooseImgList = ref<string[]>([])
const editor = ref<{ insertText(text: string): void }>()
const submitting = ref(false)
const clock = useTimestamp({ interval: 1000 })
const cooldownSeconds = computed(() => submissionGuard.remainingSeconds(account.user_info.id, clock.value))
const postCaptcha = account.useSmartCaptcha()
const clickImage = (imgName: string) => {
    if (!submitting.value) editor.value?.insertText(` :${imgName}: `)
}

const snapshot = () => ({
    session: editorSession.value,
    text: msg.value,
    images: [...chooseImgList.value],
    threadId: props.info.id,
    forumId: props.info.forum_id,
    authorId: props.info.user_id,
    userId: account.user_info.id,
    reply: { ...props.replyInfo },
})
type Draft = ReturnType<typeof snapshot>
const fingerprint = (draft: Draft) => submissionFingerprint(`reply:${draft.threadId}`, draft.text, draft.images)
const validate = (draft: Draft) => {
    if (!draft.text.trim() && !draft.images.length) throw new Error('回复内容不能为空')
    if (Array.from(draft.text).length > REPLY_MAX_LENGTH) throw new Error(`回复不能超过${REPLY_MAX_LENGTH}字`)
    if (draft.images.length > 5) throw new Error('最多添加5张图片')
    }
const requestPost = async () => {
    if (!account.is_login) { emit('login'); return }
    if (submitting.value) return
    const draft = snapshot()
    try {
        validate(draft)
        submissionGuard.check(draft.userId, fingerprint(draft))
        await postCaptcha.tryVerify(code => submitPost(code, draft))
    } catch (error) {
        prompt.showToast('warn', error instanceof Error ? error.message : '验证失败，请重试')
    }
    }

// Snapshot the draft and recipient so editing during a captcha cannot change the submitted reply.
const submitPost = async (captchaCode: string, draft: Draft) => {
    if (submitting.value || !editorVisible.value || draft.session !== editorSession.value) return
    let finish: ((success: boolean) => void) | undefined
    try {
        if (!account.is_login || draft.userId !== account.user_info.id) throw new Error('请重新登录后发送')
        validate(draft)
        finish = submissionGuard.begin(draft.userId, fingerprint(draft))
        submitting.value = true
        prompt.showToast('loading', draft.images.length ? '图片上传中…' : '发送中…', 0)
        const urls: string[] = []
        for (const file of draft.images) urls.push(await uploadImage(file))
        await CreateThreadPost({
            message: createMessage(draft.text, urls),
            validate: captchaCode,
            captcha_id: postCaptcha.captchaID,
            thread_id: draft.threadId,
            forum_id: draft.forumId,
            quote_user_id: draft.reply.isReply ? draft.reply.replyUserId : draft.authorId,
            ...(draft.reply.isReply ? { quote_post_id: draft.reply.replyId } : {}),
        })
        finish(true)
        if (msg.value === draft.text) msg.value = ''
        chooseImgList.value = chooseImgList.value.filter(file => !draft.images.includes(file))
        if (!msg.value.trim() && !chooseImgList.value.length) editorVisible.value = false
        showEmojiList.value = false
        prompt.showToast('success', '发送成功')
        emit('sent', draft.reply.isReply ? draft.reply.replyId : 0)
    } catch (error) {
        prompt.showToast('fail', requestErrorMessage(error, '发送失败，请稍后再试'))
    } finally {
        finish?.(false)
        submitting.value = false
    }
}

const chooseImage = async () => {
    if (submitting.value) return
    const remaining = 5 - chooseImgList.value.length
    if (remaining <= 0) { prompt.showToast('warn', '最多添加5张图片'); return }
    isChooseImage.value = true
    try {
        const result = await Taro.chooseImage({ count: remaining, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
        if (result.tempFiles.some(file => file.size > MAX_IMAGE_SIZE)) {
            prompt.showToast('fail', '每张图片不能超过2M')
        return
    }
        chooseImgList.value = [...new Set([...chooseImgList.value, ...result.tempFilePaths])].slice(0, 5)
    } catch (error) {
        if (!String(error?.errMsg || '').includes('cancel')) prompt.showToast('fail', '选择图片失败，请重试')
                }
            }

const cancelReply = () => {
    if (submitting.value) return
    emit("cancelReply")
}

const showEmojiList = ref(false)
const tabEmojiValue = ref(0)
</script>

<style lang="scss">
// 发帖
.send-post {
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
        padding-top: 6px;

        .send-btn { margin-left: auto; }

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