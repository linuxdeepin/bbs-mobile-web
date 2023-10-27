<template>
    <view class="thread-page">
        <nut-row v-if="thread.loaded && thread.item">
            <!-- 标题 -->
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #desc>
                                <span class="module">【{{ thread.item.type.name }}】</span>
                                <span class="title">
                                    {{ thread.item.subject }}
                                </span>
                            </template>
                            <template #icon>
                                <img v-if="thread.item.top" style="width:20px;height: 20px;" :src="TopIcon" />
                            </template>
                            <!-- <template #link>
                                <Star></Star>
                            </template> -->
                        </nut-cell>
                        <nut-cell class="info" desc-text-align="left">
                            <template #icon>
                                <nut-avatar size="large" shape="round">
                                    <img :src="thread.item.post.user.avatar" />
                                </nut-avatar>
                            </template>

                            <template #desc>
                                <div class="info-desc">
                                    <span class="nickname"> {{ thread.item.post.user.nickname }}</span>
                                    <span class="stat">
                                        发帖时间： {{ timeFormat(thread.item.created_at) }}
                                    </span>
                                </div>
                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </view>
            </nut-col>
            <!-- 主题 -->
            <nut-col span="22" offset="1">
                <view class="thread-message html-message taro_html vditor-reset" v-html="thread.item.post.message"></view>
            </nut-col>
            <!-- 分割线 -->
            <nut-col span="22" offset="1">
                <nut-divider class="post-divider" content-position="left">
                    回帖分割线
                </nut-divider>
            </nut-col>

            <!-- 回帖列表 -->
            <template v-if="thread.postLoaded">
                <template v-if="thread.postCount > 0">
                    <nut-col v-for="post in thread.posts" span="22" offset="1">
                        <view :class="'.post-id-' + post.id"></view>
                        <view>
                            <nut-cell-group class="post-main">
                                <nut-cell class="info" desc-text-align="left">
                                    <template #icon>
                                        <nut-avatar size="small" shape="round">
                                            <img :src="post.user.avatar" />
                                        </nut-avatar>
                                    </template>
                                    <template #desc>
                                        <view class="info-desc">
                                            <span class="nickname"> {{ post.user.nickname }}</span>
                                            <span>
                                                回复时间： {{ timeFormat(post.created_at) }}
                                            </span>
                                        </view>
                                    </template>
                                </nut-cell>
                                <nut-cell class="content" desc-text-align="left">
                                    <template #desc>
                                        <view class="son-post" v-if="post.son_post?.id">
                                            <span class="nickname"> {{ post.son_post.user.nickname }}：</span>

                                            <view class="post-message html-message taro_html vditor-reset"
                                                v-html="post.son_post.message">
                                            </view>
                                        </view>
                                        <view class="post-message html-message taro_html vditor-reset"
                                            v-html="post.message">
                                        </view>
                                    </template>
                                </nut-cell>
                            </nut-cell-group>
                        </view>
                    </nut-col>
                    <nut-col>
                        <div class="pagination">
                            <nut-pagination v-if="thread.postCount > thread.postLimit" span="24" v-model="thread.page"
                                :total-items="thread.postCount" :items-per-page="thread.postLimit"
                                @change="thread.pageChange" />
                        </div>
                    </nut-col>
                </template>
                <template v-else>
                    <nut-col span="24">
                        <nut-empty description="暂无回复，快来抢沙发吧"></nut-empty>
                    </nut-col>
                </template>
            </template>
            <template v-else>
                <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
                    <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
                    </nut-skeleton>
                </view>
            </template>
            <!-- 自己回帖 -->
            <nut-col span="20" offset="2">
                <view class="send-post">
                    <nut-form>
                        <!-- 网易易盾验证码，小程序插件引入 -->
                        <ne-captcha :id="postCaptcha.elementID" :captcha-id="postCaptcha.captchaID" width="640rpx"
                            @verify="postCaptcha.verify">
                        </ne-captcha>
                        <nut-form-item>
                            <view class="form-item">
                                <nut-textarea v-model="msg" placeholder="说点什么吧..."
                                    :autosize="{ maxHeight: 200, minHeight: 40 }" :disabled="!account.is_login"
                                    @click="checkLogin()" />
                                <nut-button type="primary" :disabled="msg.length == 0"
                                    @click="postCaptcha.tryVerify(submitPost)">发送</nut-button>
                            </view>
                        </nut-form-item>
                    </nut-form>
                </view>
            </nut-col>
        </nut-row>
        <view v-else>
            <view class="skeleton-container">
                <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="60px" row="10">
                </nut-skeleton>

                <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
                    <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
                    </nut-skeleton>
                </view>
            </view>
        </view>
        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
        <nut-dialog content="请先登录账号" v-model:visible="showLoginDialog" @ok="account.gotoLogin()" />
    </view>
</template>
<script lang="ts" setup>

import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { watch, ref } from 'vue';

import TopIcon from '../../assets/top.svg'
import { useAccountStore, useThreadStore, usePromptStore, useIndexStore } from '../../stores'
import { TaroEvent } from '@tarojs/components';
import { TaroElement } from '@tarojs/runtime';
import dayjs from 'dayjs'

if (process.env.TARO_ENV === 'h5') {
    // 加载vditor样式
    require('vditor/dist/index.css')
} else {
    // 加载html5样式
    require('@tarojs/taro/html.css')
}
const thread = useThreadStore()
const account = useAccountStore()
const prompt = usePromptStore()
const index = useIndexStore()

const imageUrls = [] as string[]

const option = (Taro as any).options

// 处理html渲染，仅在小程序中生效
option.html.transformElement = (el: TaroElement) => {
    switch (el.nodeName) {
        case "image":
            // 图片高度自动缩放
            el.setAttribute('mode', 'widthFix')

            const src = el.getAttribute("src")
            if (!src) {
                break
            }
            // 表情图片拼接服务器地址
            if (src.startsWith("assets")) {
                el.setAttribute('src', thread.server + "/" + src)
                break
            }
            // 小程序图片不会自动显示宽度，在图片加载后设置图片显示真实宽度，超出屏幕的图片有样式中的 max-width 限制
            el.addEventListener("load", (event: TaroEvent<HTMLImageElement>) => {
                el.style.setProperty('width', event.detail.width + "px")
                imageUrls.push(src)
            }, null)
            // 图片点击预览
            el.addEventListener("tap", () => {
                console.log("preview image", imageUrls)
                Taro.previewImage({
                    current: src,
                    urls: imageUrls
                })
            }, null)
            break
    }
    return el
}
const instance = Taro.getCurrentInstance()
const threadID = ref(0)
const postID = ref(0)
// 初始化加载
if (instance.router) {
    threadID.value = Number(instance.router.params['id'] || 0)
    postID.value = Number(instance.router.params['post_id'] || 0)
    thread.load(threadID.value)
    Taro.pageScrollTo({
        scrollTop: 0,
    })
}

function genTitle(title: string) {
    if (!index.weixinShare) {
        return title
    }
    const maxlen = index.weixinShare.title_max_length
    const suffix = index.weixinShare.title_suffix
    // 需要完整显示后缀，对标题做截断
    if (title.length + suffix.length - maxlen > 3) {
        title = title.slice(0, maxlen - suffix.length - 3) + "..." + suffix;
    } else {
        title = title.slice(0, maxlen - suffix.length) + suffix;
    }
    return title
}
// 设置分享标题
useShareTimeline(() => {
    if (!thread.item || !index.weixinShare) {
        return {}
    }
    return {
        title: genTitle(thread.item.subject),
        imageUrl: index.weixinShare.default_img
    }
})
useShareAppMessage(() => {
    if (!thread.item || !index.weixinShare) {
        return {}
    }
    return {
        title: genTitle(thread.item.subject),
    }
})


// 翻页后移动到回复分割线
watch(() => thread.page, () => {
    Taro.nextTick(() => {
        Taro.pageScrollTo({
            selector: ".post-divider",
            duration: 300,
            offsetTop: -20
        })
    })
})
// 跳转到指定的回复
watch(() => thread.posts, () => {
    if (postID.value > 0) {
        setTimeout(() => {
            Taro.pageScrollTo({
                selector: ".post-id-" + postID.value,
                duration: 300,
                offsetTop: 0
            })
            postID.value = 0
        }, 500)
    }
})
// 回复内容
const msg = ref("")
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
        const resp = await thread.createPost({
            validate: captchaCode,
            captcha_id: postCaptcha.captchaID,
            message: `<div data-weapp_version="v1">${msg.value}</div>`,
            thread_id: thread.item.id,
            forum_id: thread.item.forum_id,
            quote_user_id: thread.item.user_id,
        })
        prompt.showToast('success', "发送成功")
        // 清空输入框内容
        msg.value = ''
        // 跳转到发布的评论
        postID.value = resp.data.data.id
        thread.pageChange(Math.ceil(thread.postCount / thread.postLimit))
    } catch (err) {
        console.log("create post", err)
        prompt.showToast('fail', "发送失败，请稍后在试")
    }
}
// 时间格式化
const timeFormat = (timeStr: string) => {
    return dayjs(timeStr).format("YYYY-MM-DD HH:mm")
}

const showLoginDialog = ref(false)
const checkLogin = () => {
    if (!account.is_login) {
        showLoginDialog.value = true
    }
}
</script>
<style lang="scss">
.thread-page {
    .info-desc {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }

    .nickname {
        min-width: 70vw;
        max-width: 70vw;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        vertical-align: bottom;
    }

    .html-message {
        user-select: text;

        img.emoji {
            width: 120rpx;
            height: 120rpx;
            max-width: unset;
        }

        img,
        .h5-img {
            max-width: 100%;
        }
    }

    .content>view {
        max-width: 100%;
    }

    .pagination {
        display: flex;
        justify-content: center;
        padding-bottom: 180px;
    }

    .skeleton-container {
        margin-top: 20px;
        margin-left: 5vw;
        margin-bottom: 50px;
    }

    // 回贴引用
    .son-post {
        border-radius: var(--nut-cell-border-radius, 12rpx);
        background-color: #eee;
        padding: 12rpx;
    }

    .send-post {
        position: fixed;
        bottom: 0;
        width: 90vw;
        left: 5vw;

        .form-item {
            display: flex;
        }
    }

}
</style>