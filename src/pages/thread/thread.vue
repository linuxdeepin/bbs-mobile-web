<template>
    <view class="thread-page">
        <nut-row v-if="!infoLoading">
            <!-- 标题 -->
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #desc>
                                <span class="module">【{{ threadInfo.type.name }}】</span>
                                <span class="title">
                                    {{ threadInfo.subject }}
                                </span>
                            </template>
                            <template #icon>
                                <img v-if="threadInfo.top" style="width:20px;height: 20px;" :src="TopIcon" />
                            </template>
                            <!-- <template #link>
                                <Star></Star>
                            </template> -->
                        </nut-cell>
                        <nut-cell class="info" desc-text-align="left">
                            <template #icon>
                                <nut-avatar size="large" shape="round">
                                    <img :src="threadInfo.post.user.avatar" />
                                </nut-avatar>
                            </template>

                            <template #desc>
                                <div class="info-desc">
                                    <span class="nickname"> {{ threadInfo.post.user.nickname }}</span>
                                    <span class="stat">
                                        发帖时间： {{ timeFormat(threadInfo.created_at) }}
                                    </span>
                                </div>
                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </view>
            </nut-col>
            <!-- 主题 -->
            <nut-col span="22" offset="1">
                <view class="thread-message html-message taro_html vditor-reset" @click="htmlClick($event)"
                    v-html="threadInfo.post.message"></view>
            </nut-col>
            <!-- 投票 -->
            <Vote v-if="threadInfo.is_poll" :thread-id="threadInfo.id"
                :is-poll-expired="threadInfo.poll_list.poll_expire" :is-multiple="threadInfo.poll_list.multiple"
                :max-choices="threadInfo.poll_list.maxchoices" :voter-number="threadInfo.poll_list.voters_number"
                :poll-option-ids="threadInfo.poll_list.polloptionids"
                :forum-polloption="threadInfo.poll_list.forum_polloption" @login="showLoginDialog = true"
                @voting="threadRefresh++" />
            <!-- 分割线 -->
            <nut-col span="22" offset="1">
                <nut-divider class="post-divider" content-position="left">
                    回帖分割线
                </nut-divider>
            </nut-col>

            <!-- 回帖列表 -->
            <template v-if="!postLoading">
                <template v-if="threadPosts.total_count > 0">
                    <nut-col v-for="(post, index) in threadPosts.data" span="22" offset="1">
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
                                        <view class="post-desc">
                                            <view class="info-desc">
                                                <span class="nickname"> {{ post.user.nickname }}</span>
                                                <span>
                                                    {{ (pagination.page - 1) * pagination.limit + index + 1 }}楼
                                                    回复时间： {{ timeFormat(post.created_at) }}
                                                </span>
                                            </view>
                                        </view>
                                    </template>
                                </nut-cell>
                                <nut-cell class="content" desc-text-align="left">
                                    <template #desc>
                                        <view class="son-post" v-if="post.son_post?.id">
                                            <span class="nickname"> {{ post.son_post.user.nickname }}：</span>

                                            <view class="post-message html-message taro_html vditor-reset"
                                                @click="htmlClick($event)" v-html="post.son_post.message">
                                            </view>
                                        </view>
                                        <view class="post-message html-message taro_html vditor-reset"
                                            @click="htmlClick($event)" v-html="post.message">
                                        </view>
                                    </template>
                                </nut-cell>
                            </nut-cell-group>
                        </view>
                    </nut-col>
                    <nut-col>
                        <div class="pagination">
                            <nut-pagination v-if="threadPosts.total_count > pagination.limit" span="24"
                                v-model="pagination.page" :total-items="threadPosts.total_count"
                                :items-per-page="pagination.limit" />
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
            <SendPost :info="threadInfo" @login="showLoginDialog = true" @send="sendPost"></SendPost>
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
        <nut-dialog content="请先登录账号" v-model:visible="showLoginDialog" @ok="account.gotoLogin()" />
    </view>
</template>
<script lang="ts" setup>

import { watch, ref } from 'vue';
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import TopIcon from '@/assets/top.svg'
import { useConfigStore, useAccountStore } from '@/stores'
import { TaroEvent } from '@tarojs/components';
import { TaroElement } from '@tarojs/runtime';
import dayjs from 'dayjs'
import { Element } from '@tarojs/runtime/dist/dom-external/inner-html/parser';
import SendPost from './send-post.vue'
import Vote from './vote.vue'
import { apiServer, ThreadInfo, ThreadPostList } from '@/api';
import { computedAsync } from "@vueuse/core";

if (process.env.TARO_ENV === 'h5') {
    // 加载vditor样式
    require('vditor/dist/index.css')
} else {
    // 加载html5样式
    require('@tarojs/taro/html.css')
}
const config = useConfigStore()
const account = useAccountStore()

const imageUrls = [] as string[]

const option = (Taro as any).options

// 提示需要进行登陆
const showLoginDialog = ref(false)

// 处理html渲染，仅在小程序中生效
option.html.transformElement = (el: TaroElement, h5el: Element) => {
    el.setAttribute('data-tag', h5el.tagName)
    switch (el.nodeName) {
        case "text":
            if (h5el.tagName === "a") {
                // attributes 格式有些奇怪，像这样["href=\"https://xxxx"\"]，所以要进行预处理 
                h5el.attributes.forEach(attr => {
                    const arr = attr.split("=")
                    const key = arr[0]
                    const value = arr.slice(1).join("=").slice(1, -1)
                    el.setAttribute('data-' + key, value)
                })
            }
        case "image":
            // 图片高度自动缩放
            el.setAttribute('mode', 'widthFix')

            const src = el.getAttribute("src")
            if (!src) {
                break
            }
            // 表情图片拼接服务器地址
            if (src.startsWith("assets")) {
                el.setAttribute('src', apiServer + "/" + src)
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
if (instance.router) {
    threadID.value = Number(instance.router.params['id'] || 0)
}

// 获取帖子数据
const infoLoading = ref(true)
// 刷新帖子
const threadRefresh = ref(0)
const threadInfo = computedAsync(() => {
    threadRefresh.value
    return ThreadInfo(threadID.value).then(resp => resp.data.data)
}, undefined, { evaluating: infoLoading })

// 获取回复数据
const postRefresh = ref(0) // 便于手动触发更新
const postLoading = ref(true)
const pagination = ref({ page: 1, limit: 10 })
const threadPosts = computedAsync(() => {
    // 在回复时，需要手动刷新
    postRefresh.value
    return ThreadPostList(threadID.value, {
        page: pagination.value.page,
        pageSize: pagination.value.limit,
    }).then(resp => resp.data)
}, undefined, { evaluating: postLoading })

// 翻页后滚动到回复分割线，如果是发帖后自动翻页则滚动到底部
const sendPostScroll = ref(false)
watch(threadPosts, (_, old) => {
    // 初始化时不滚动
    if (old == undefined) {
        return
    }
    Taro.nextTick(() => {
        if (sendPostScroll.value) {
            Taro.createSelectorQuery().select('.thread-page').boundingClientRect().exec((res) => {
                Taro.pageScrollTo({
                    scrollTop: res[0].height
                })
                sendPostScroll.value = false
            })
        } else {
            Taro.pageScrollTo({
                selector: ".post-divider",
                offsetTop: -100
            })
        }
    })
})

// 渲染内容点击，在小程序中处理超链接
function htmlClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const dataset = target.dataset
    console.log("html click", { event, dataset })
    // 是html超链接被点击
    if (dataset["tag"] === "a") {
        const href = target.dataset["href"] || ''
        // 如果是点击的帖子链接，在小程序跳转，否则就复制链接
        if (href.includes("deepin.org")) {
            const result = href.match(/\/post\/(\d+)$/)
            if (result?.length == 2) {
                Taro.navigateTo({
                    url: `/pages/thread/thread?id=${result[1]}`,
                })
                return
            }
        }
        Taro.setClipboardData({ data: href })
    }
}
// 生成分享标题
function genShareTitle(title: string) {
    if (!config.weixinShare.state) {
        return title
    }
    const maxlen = config.weixinShare.state.title_max_length
    const suffix = config.weixinShare.state.title_suffix
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
    if (!threadInfo || !config.weixinShare.state) {
        return {}
    }
    return {
        title: genShareTitle(threadInfo.value.subject),
        imageUrl: config.weixinShare.state.default_img
    }
})
useShareAppMessage(() => {
    if (!threadInfo || !config.weixinShare.state) {
        return {}
    }
    return {
        title: genShareTitle(threadInfo.value.subject),
    }
})

// 时间格式化
const timeFormat = (timeStr: string) => {
    return dayjs(timeStr).format("YYYY-MM-DD HH:mm")
}

// 在发帖后翻到最后一页
const sendPost = () => {
    let last = Math.ceil(threadPosts.value.total_count / pagination.value.limit)
    // 如果正好换页，跳转到新页
    if (threadPosts.value.total_count % pagination.value.limit === 0) {
        last++
    }
    sendPostScroll.value = true
    postRefresh.value++
    pagination.value.page = last
}
</script>

<style lang="scss">
.thread-page {
    .post-desc {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
    }

    .info-desc {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }

    .nickname {
        min-width: 40vw;
        max-width: 60vw;
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

        .h5-a {
            color: #1890ff;
        }

        .h5-code {
            white-space: pre-wrap;
        }

        // 等待补丁合并 https://github.com/NervJS/taro/pull/14927
        .h5-h1 {
            line-height: 2em;
        }

        .h5-h2 {
            line-height: 1.5em;
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

    // 添加边距，避免空回复列表被回帖输入框遮挡
    .nut-empty {
        padding-bottom: 200rpx;
    }
}
</style>