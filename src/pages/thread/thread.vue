<template>
    <view class="thread-page">
        <nut-row v-if="thread.loaded && thread.item">
            <!-- 标题 -->
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #desc>
                                <span class="module">【软件开发】</span>
                                <span class="title">
                                    {{ thread.item.subject }}
                                </span>
                            </template>
                            <template #icon>
                                <img v-if="thread.item.top" style="width:20px;height: 20px;" :src="TopIcon" />
                            </template>
                            <template #link>
                                <Star></Star>
                            </template>
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
                                        发帖时间： {{ thread.item.created_at.slice(0, 16) }}
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
                                                回复时间： {{ post.created_at.slice(0, 16) }}
                                            </span>
                                        </view>
                                    </template>
                                </nut-cell>
                                <nut-cell class="content" desc-text-align="left">
                                    <template #desc>
                                        <view class="post-message html-message taro_html vditor-reset"
                                            v-html="post.message">
                                        </view>
                                    </template>
                                </nut-cell>
                            </nut-cell-group>
                        </view>
                    </nut-col>
                    <nut-col v-if="thread.postCount > thread.postLimit" span="24">
                        <div class="pagination">
                            <nut-pagination v-model="thread.page" :total-items="thread.postCount"
                                :items-per-page="thread.postLimit" @change="thread.pageChange" />
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

                        <ne-captcha id="captcha" :captcha-id="captchaID" width="640rpx"
                            @verify="handleCaptchaVerify($event)"></ne-captcha>
                        <nut-form-item>
                            <view class="form-item">
                                <nut-textarea v-model="msg" placeholder="说点什么吧..."
                                    :autosize="{ maxHeight: 200, minHeight: 40 }" />
                                <nut-button type="primary" @tap="tryToVerify()">发送</nut-button>
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
    </view>
</template>
<script lang="ts" setup>

import Taro from '@tarojs/taro'
import { watch, ref } from 'vue';
import { Comment, Eye, Star } from "@nutui/icons-vue-taro";

import TopIcon from '../../assets/top.svg'
import { useAccountStore, useThreadStore } from '../../stores'
import { TaroEvent } from '@tarojs/components';
import { TaroElement } from '@tarojs/runtime';

if (process.env.TARO_ENV === 'h5') {
    // 加载vditor样式
    require('vditor/dist/index.css')
} else {
    // 加载html5样式
    require('@tarojs/taro/html.css')
}
const thread = useThreadStore()
const account = useAccountStore()

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
// 网易验证码
const captchaID = ref("8f1fbf7524c54854b28039db8f97e771")
// 点击发送回复后进行人机校验
const tryToVerify = () => {
    const page = instance.page
    if (page && page.selectComponent) {
        const c: any = page.selectComponent('#captcha')
        // 强制验证
        c.popup()

        // 无感知验证
        // c.verify()
    }
}
// 人机校验后发布回复
const handleCaptchaVerify = async (event: { detail: [string, string] }) => {
    const [err, validate] = event.detail
    if (err) {
        return
    }
    if (!thread.item) {
        return
    }
    const resp = await thread.createPost({
        validate,
        captcha_id: captchaID.value,
        message: `<div data-weapp_version="v1">${msg.value}</div>`,
        thread_id: thread.item.id,
        forum_id: thread.item.forum_id,
        quote_user_id: thread.item.user_id,
    })
    msg.value = ''
    postID.value = resp.data.data.id
    thread.pageChange(Math.ceil(thread.postCount / thread.postLimit))
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