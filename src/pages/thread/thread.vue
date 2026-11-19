<template>
    <nut-config-provider :theme="config.theme" class="thread-page">
        <NavH5 title="帖子详情" />
        <nut-row v-if="!infoLoading && threadInfo">
            <!-- 标题 -->
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #title>
                                <view>【{{ threadInfo.type.name }}】{{ !banUser ? threadInfo.subject : '用户被禁言，该内容已隐藏' }}
                                    <nut-tag class="resolved" v-if="threadResolved" plain color="green">已解决</nut-tag>
                                </view>
                            </template>
                            <template #icon>
                                <img v-if="threadInfo.top && !banUser" style="width:20px;height: 20px;"
                                    :src="TopIcon" />
                            </template>
                        </nut-cell>
                        <nut-cell class="info" desc-text-align="left">
                            <template #icon>
                                <nut-avatar size="large" shape="round"
                                    @click="Taro.navigateTo({ url: `/pages/user/user?id=${threadInfo.post.user.id}` })">
                                    <img :src="threadInfo.post.user.avatar" />
                                </nut-avatar>
                            </template>

                            <template #desc>
                                <div class="info-desc">
                                    <view class="info">
                                        <span class="nickname"> {{ threadInfo.post.user.nickname }} </span>
                                        <img class="level" :src="threadInfo.user.levels.level_icon" />
                                    </view>
                                    <Tags :user-tags="userTags" :group-name="userGroupName" />
                                    <span class="stat">
                                        发帖时间： {{ formatTime(threadInfo.created_at, "YYYY-MM-DD HH:mm") }}
                                    </span>
                                </div>
                            </template>
                        </nut-cell>
                    </nut-cell-group>
                </view>
            </nut-col>
            <!-- 主题 -->
            <nut-col span="22" offset="1">
                <MarkdownContent v-if="!banUser" class="thread-message" :content="threadInfo.post.message"
                    @preview="isChooseImage = true" />
                <view v-else>用户被禁言，该内容已隐藏</view>
            </nut-col>
            <!-- 投票 -->
            <Vote v-if="threadInfo.is_poll" :thread-id="threadInfo.id" :poll-list="threadInfo.poll_list"
                @login="showLoginDialog = true" @voting="threadRefresh++" />
            <!-- 帖子操作栏 -->
            <ThreadOp v-model:thread-info="threadInfo" v-model:thread-resolved="threadResolved"
                v-model:thread-closed="threadClosed" :is-moderator="isModerator" @login="showLoginDialog = true"
                @threadRefresh="threadRefresh++" />
            <!-- 分割线 -->
            <nut-col span="22" offset="1">
                <nut-divider class="post-divider" content-position="left">
                    回帖分割线
                </nut-divider>
            </nut-col>

            <!-- 精选列表 -->
            <template v-if="!winnowLoading && winnowPosts">
                <template v-if="winnowPosts.data.length">
                    <nut-col span="22" offset="1" class="post-title">精选回复</nut-col>
                    <nut-col v-for="(post, index) in winnowPosts.data" span="22" offset="1">
                        <nut-cell-group class="post-main">
                            <nut-cell class="info" desc-text-align="left">
                                <template #icon>
                                    <nut-avatar size="small" shape="round"
                                        @click="Taro.navigateTo({ url: `/pages/user/user?id=${post.user.id}` })">
                                        <img :src="post.user.avatar" />
                                    </nut-avatar>
                                </template>
                                <template #desc>
                                    <view class="post-desc">
                                        <view class="info-desc">
                                            <span class="nickname"> {{ post.user.nickname }}</span>
                                            <span>
                                                {{ (pagination.page - 1) * pagination.limit + index + 1 }}楼
                                                回复时间： {{ formatTime(post.created_at, "YYYY-MM-DD HH:mm") }}
                                            </span>
                                        </view>
                                    </view>
                                </template>
                            </nut-cell>
                            <nut-cell class="content" desc-text-align="left">
                                <template #desc>
                                    <template v-if="post.user.state === 0 || post.user.state === 1">
                                        <MarkdownContent v-if="post.deleted_at === null" class="post-message"
                                            :content="post.message" @preview="isChooseImage = true" />
                                        <view v-else
                                            class="post-message html-message taro_html vditor-reset del-message">
                                            该评论已删除!
                                        </view>
                                    </template>
                                    <template v-else-if="post.user.state === 2">
                                        <view class="post-message html-message taro_html vditor-reset del-message">
                                            用户被禁言，该内容已隐藏
                                        </view>
                                    </template>
                                </template>
                            </nut-cell>
                        </nut-cell-group>
                    </nut-col>
                </template>
            </template>

            <!-- 回帖列表 -->
            <template v-if="!postLoading && threadPosts">
                <template v-if="threadPosts.total_count > 0">
                    <nut-col span="22" offset="1" class="post-title">所有回复</nut-col>
                    <nut-col v-for="(post, index) in threadPosts.data" span="22" offset="1">
                        <view :class="'post-id-' + post.id"></view>
                        <view>
                            <nut-cell-group class="post-main">
                                <nut-cell class="info" desc-text-align="left">
                                    <template #icon>
                                        <nut-avatar size="small" shape="round"
                                            @click="Taro.navigateTo({ url: `/pages/user/user?id=${post.user.id}` })">
                                            <img :src="post.user.avatar" />
                                        </nut-avatar>
                                    </template>
                                    <template #desc>
                                        <view class="post-desc">
                                            <view class="info-desc">
                                                <view class="info">
                                                    <span class="nickname"> {{ post.user.nickname }}</span>
                                                    <img class="level" :src="post.user.levels.level_icon" />
                                                    <Tags :user-tags="getTagsByPostUserId(post.user.id)"
                                                        :group-name="post.user.group_name" />
                                                </view>
                                                <span>
                                                    {{ (pagination.page - 1) * pagination.limit + index + 1 }}楼
                                                    回复时间： {{ formatTime(post.created_at, "YYYY-MM-DD HH:mm") }}
                                                </span>
                                            </view>
                                        </view>
                                    </template>
                                </nut-cell>
                                <!-- 回帖内容 -->
                                <nut-cell class="content" desc-text-align="left">
                                    <template #desc>
                                        <!-- 引用的回复 -->
                                        <view class="son-post" v-if="post.son_post?.id">
                                            <span class="nickname"> {{ post.son_post.user.nickname }}：</span>
                                            <template v-if="post.son_post.user.state !== 2">
                                                <MarkdownContent v-if="post.son_post.deleted_at === null" class="post-message"
                                                    :content="post.son_post.message" @preview="isChooseImage = true" />
                                                <view v-else
                                                    class="post-message html-message taro_html vditor-reset del-message">
                                                    该评论已删除!
                                                </view>
                                            </template>

                                            <view v-else
                                                class="post-message html-message taro_html vditor-reset del-message">
                                                用户被禁言，该内容已隐藏
                                            </view>
                                        </view>
                                        <template v-if="post.user.state === 0 || post.user.state === 1">
                                            <MarkdownContent v-if="post.deleted_at === null" class="post-message"
                                                :content="post.message" @preview="isChooseImage = true" />
                                            <view v-else
                                                class="post-message html-message taro_html vditor-reset del-message">
                                                该评论已删除!
                                            </view>
                                        </template>
                                        <template v-else-if="post.user.state === 2">
                                            <view class="post-message html-message taro_html vditor-reset del-message">
                                                用户被禁言，该内容已隐藏
                                            </view>
                                        </template>
                                    </template>
                                </nut-cell>
                                <PostOp v-model:thread-info="threadInfo" v-model:post="threadPosts.data[index]"
                                    v-model:reply-info="replyInfo" v-model:scrollToPostDivider="scrollToPostDivider"
                                    v-model:winnow-posts="winnowPosts" :is-moderator="isModerator"
                                    :thread-closed="threadClosed" @login="showLoginDialog = true"
                                    @postRefresh="postRefresh++" @winnowPostsRefresh="winnowPostsRefresh++" />
                            </nut-cell-group>
                        </view>
                    </nut-col>
                    <!-- 只在最后一页显示 -->
                    <nut-col
                        v-if="interval && pagination.page === Math.ceil(threadPosts.total_count / pagination.limit) && !threadClosed">
                        <view class="refresh-tips">已开启自动刷新</view>
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
                    <nut-col>
                        <view class="refresh-tips pagination">已开启自动刷新</view>
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
            <SendPost v-if="!threadClosed" v-model="isChooseImage" :info="threadInfo" :reply-info="replyInfo"
                @login="showLoginDialog = true" @cancel-reply="cancelReply">
            </SendPost>
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

        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
    </nut-config-provider>
</template>
<script lang="ts" setup>
import { watch, ref, watchEffect } from 'vue';
import Taro, { useShareAppMessage, useShareTimeline, useUnload, useDidShow, useDidHide } from '@tarojs/taro'
import TopIcon from '@/assets/top.svg'
import { useConfigStore, useAccountStore, usePromptStore } from '@/stores'
import { formatTime } from '@/utils/format';
import SendPost from './send-post.vue'
import Vote from './vote.vue'
import {
    ThreadInfo,
    ThreadPostList,
    ThreadInfoData,
    ThreadUserList,
    GetUserInfo,
    WinnowThreadPostList,
    GetUserTag,
    UserTags
} from '@/api';
import { computedAsync } from "@vueuse/core";
import Tags from '@/widgets/tags.vue';
import ThreadOp from "./thread-op.vue"
import PostOp from "./post-op.vue"
import NavH5 from "@/widgets/navigation-h5.vue";
import MarkdownContent from '@/widgets/markdown-content.vue';

const config = useConfigStore()
const account = useAccountStore()
const prompt = usePromptStore()

// 提示需要进行登陆
const showLoginDialog = ref(false)

// 页面是否隐藏
const hidden = ref(false)
// 选择图片后不刷新页面
const isChooseImage = ref(false)
const instance = Taro.getCurrentInstance()
const threadID = ref(0)
const postId = ref(0)
const infoLoading = ref(true)
// 刷新帖子
const threadRefresh = ref(0)
const postRefresh = ref(0) // 便于手动触发更新
const postLoading = ref(true)
const pagination = ref({ page: 1, limit: 10 })
// 发帖的用户是否被禁言
const banUser = ref(false)
if (instance.router) {
    threadID.value = Number(instance.router.params['id'] || 0)
    postId.value = Number(instance.router.params['postId'] || 0)
    const offset = Number(instance.router.params['offset'] || 0)
    pagination.value.page = offset + 1
}

useUnload(() => {
    if (!instance.router)
        return
    clearInterval(interval.value)
    if (Number(instance.router.params['posting'] || 0)) {
        // 携带这个参数说明是从发帖页面跳转过来
        // 发帖页是 tabBar 页面，返回时只刷新列表。
        config.indexNeedRefresh = true
    }
})

useDidShow(() => {
    if (!isChooseImage.value) {
        // 登录成功后返回到帖子页面,刷新点赞和收藏状态
        threadRefresh.value++
        scrollToPostDivider.value = false
        postRefresh.value++
    }
    isChooseImage.value = false
    hidden.value = false
})

useDidHide(() => {
    hidden.value = true
})

// 获取帖子数据
const threadInfo = ref<ThreadInfoData>()
// 帖子是否以解决
const threadResolved = ref(false)
// 帖子是否已关闭
const threadClosed = ref(false)
// 楼主所属group name
const userGroupName = ref("")
// 楼主标签
const userTags = ref<UserTags[]>([])
computedAsync(async (onCancel) => {
    let cancelled = false
    onCancel(() => { cancelled = true })
    threadRefresh.value
    const { data } = await ThreadInfo(threadID.value)
    const [{ data: userInfo }, { data: tags }] = await Promise.all([
        GetUserInfo(data.data.user_id), GetUserTag(data.data.user_id),
    ])
    if (cancelled) return
    threadInfo.value = data.data
    banUser.value = !userInfo.allow_speak
    userGroupName.value = userInfo.group_name
    userTags.value = tags.filter(tag => tag.lang === 'zh_CN')
    threadResolved.value = threadInfo.value.attrs.some(attr => attr.name === 'Resolved')
    threadClosed.value = !!threadInfo.value.isclosed
}, undefined, { evaluating: infoLoading })

// 当前登陆用户是否为当前帖子所属版块的版主
// 版主管理评论
const winnowLoading = ref(false)
const winnowPostsRefresh = ref(0)

// 精选列表
const winnowPosts = computedAsync(() => {
    winnowPostsRefresh.value
    return WinnowThreadPostList(threadID.value).then(resp => { return resp.data })
}, undefined, { evaluating: winnowLoading })

// 判断当前用户是否为帖子所属版块的版主
const isModerator = computedAsync(async () => {
    if (!account.is_login || !threadInfo.value) {
        return false
    }
    const userId = account.user_info.id
    const { data } = await ThreadUserList(threadInfo.value.forum_id)
    return data.data.some(user => user.id === userId)
}, false)

// 当前是否是在回复别人的评论
const replyInfo = ref({
    isReply: false,
    replyId: 0,
    replyUserId: 0,
    replyNickName: ""
})

// 取消回复
const cancelReply = () => {
    replyInfo.value = {
        isReply: false,
        replyId: 0,
        replyUserId: 0,
        replyNickName: ""
    }
}

// 获取回复数据
// 评论刷新时是否滚动到回帖分割线（在删除评论时不需要滚动）
const scrollToPostDivider = ref(true)
const threadPosts = computedAsync(async () => {
    // 在回复时，需要手动刷新
    postRefresh.value
    const { data } = await ThreadPostList(threadID.value, {
        page: pagination.value.page,
        pageSize: pagination.value.limit,
    })
    return data
}, undefined, { evaluating: postLoading })

const replyUserTags = computedAsync(async () => {
    const ids = [...new Set((threadPosts.value?.data || []).map(post => post.user.id))]
    return Promise.all(ids.map(async id => {
        const { data } = await GetUserTag(id)
        return { id, tags: data.filter(tag => tag.lang === 'zh_CN') }
    }))
}, [] as { id: number, tags: UserTags[] }[])

const getTagsByPostUserId = ((postUserId) => {
    const tags = replyUserTags.value.find(user => user.id === postUserId)?.tags
    return tags || []
})

// 翻页后滚动到回复分割线，如果是发帖后自动翻页则滚动到底部
const sendPostScroll = ref(false)
watch(threadPosts, (_, oldVal) => {
    if (oldVal == undefined) {
        // 如果路由参数中有postId，则滚动到指定位置
        if (postId.value) {
            Taro.nextTick(() => {
                setTimeout(() => {
                    Taro.createSelectorQuery().select(`.post-id-${postId.value}`).boundingClientRect().exec((res) => {
                        if (!res[0]) return
                        Taro.pageScrollTo({
                            scrollTop: res[0].top
                        })
                    })
                }, 1000)
            })
        }
        return
    }

    Taro.nextTick(() => {
        if (intervalRefreshPost.value) {
            intervalRefreshPost.value = false
            return
        }
        if (sendPostScroll.value) {
            Taro.createSelectorQuery().select('.thread-page').boundingClientRect().exec((res) => {
                if (!res[0]) return
                Taro.pageScrollTo({
                    scrollTop: res[0].height
                })
                sendPostScroll.value = false
            })
        } else if (scrollToPostDivider.value) {
            Taro.pageScrollTo({
                selector: ".post-divider",
                offsetTop: -100
            })
        }
        scrollToPostDivider.value = true
    })
})

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
    if (!threadInfo.value || !config.weixinShare.state) {
        return {}
    }
    return {
        title: genShareTitle(threadInfo.value.subject),
        imageUrl: config.weixinShare.state.default_img
    }
})
useShareAppMessage(() => {
    if (!threadInfo.value || !config.weixinShare.state) {
        return {}
    }
    return {
        title: genShareTitle(threadInfo.value.subject),
    }
})

// 在发帖后翻到最后一页
const sendPost = () => {
    // 清空回复状态
    cancelReply()
    if (!threadPosts.value)
        return
    let last = Math.ceil(threadPosts.value.total_count / pagination.value.limit)
    // 如果正好换页，跳转到新页
    if (threadPosts.value.total_count % pagination.value.limit === 0) {
        last++
    }
    sendPostScroll.value = true
    if (pagination.value.page !== last) {
        pagination.value.page = last
    } else {
        postRefresh.value++
    }
}

Taro.eventCenter.on("sendPost", sendPost)

// 定时刷新评论
// 如果当前位于评论的最后一页,每三秒刷新一次
const interval = ref<ReturnType<typeof setTimeout>>()
const intervalRefreshPost = ref(false)
watchEffect((onCleanup) => {
    const posts = threadPosts.value
    const page = pagination.value.page
    const limit = pagination.value.limit
    postRefresh.value
    if (!posts || hidden.value || threadClosed.value ||
        (posts.total_count > 0 && page !== Math.ceil(posts.total_count / limit))) return
    let cancelled = false
    let inFlight = false
    const timer = setInterval(async () => {
        if (inFlight) return
        inFlight = true
        try {
            const { data } = await ThreadPostList(threadID.value, { page, pageSize: limit })
            if (!cancelled && posts.total_count !== data.total_count) {
                intervalRefreshPost.value = true
                threadPosts.value = data
            }
        } catch (error) {
            console.warn('refresh replies', error)
        } finally {
            inFlight = false
        }
        }, 3000)
    interval.value = timer
    onCleanup(() => { cancelled = true; clearInterval(timer); interval.value = undefined })
})
</script>

<style lang="scss">
.thread-page {
    .post-desc {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
    }

    .resolved {
        margin-left: 20rpx;
    }

    .info-desc {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        color: var(--text-desc-color);

        .info {
            display: flex;
            align-items: center;
            height: 22Px;

            .nickname {
                max-width: 60vw;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                vertical-align: bottom;
            }

            .level {
                width: 40rpx;
                height: 40rpx;
                margin-left: 10rpx;
                margin-right: 10rpx;
            }
        }
    }

    .thread-message {
        color: var(--text-color);
    }

    .post-message {
        color: var(--text-desc-color);
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
    }

    .post-title {
        font-size: 18Px;
        color: var(--text-color);
    }

    .del-message {
        color: #97a3b4;
    }

    .content>view {
        max-width: 100%;
    }

    .refresh-tips {
        text-align: center;
        font-size: 20rpx;
        margin-bottom: 20rpx;
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
        background-color: var(--reply-bg-color);
        padding: 12rpx;
    }

    .moderator-del-form {
        margin: 0;

        .nut-cell-group__wrap {
            box-shadow: none;
        }
    }

}
</style>