<template>
    <view class="thread-page">
        <nut-row v-if="!infoLoading && threadInfo">
            <!-- 标题 -->
            <nut-col span="22" offset="1">
                <view>
                    <nut-cell-group>
                        <nut-cell class="thread" desc-text-align="left">
                            <template #desc>
                                <span class="module">【{{ threadInfo.type.name }}】</span>
                                <span class="title">
                                    {{ !banUser ? threadInfo.subject : '用户被禁言，该内容已隐藏' }}
                                </span>
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
                <view v-if="!banUser" class="thread-message html-message taro_html vditor-reset"
                    @click="htmlClick($event)" v-html="threadInfo.post.message"></view>
                <view v-else>用户被禁言，该内容已隐藏</view>
            </nut-col>
            <!-- 投票 -->
            <Vote v-if="threadInfo.is_poll" :thread-id="threadInfo.id"
                :is-poll-expired="threadInfo.poll_list.poll_expire" :is-multiple="threadInfo.poll_list.multiple"
                :max-choices="threadInfo.poll_list.maxchoices" :voter-number="threadInfo.poll_list.voters_number"
                :poll-option-ids="threadInfo.poll_list.polloptionids"
                :forum-polloption="threadInfo.poll_list.forum_polloption" @login="showLoginDialog = true"
                @voting="threadRefresh++" />
            <!-- 点赞和收藏 -->
            <nut-col span="22" offset="1">
                <view class="post-op">
                    <view class="post-op-item" hover-class="btn-clicked" hover-stay-time="200" @click="upThread">
                        <img :src="threadInfo.is_up ? UpFillIcon : UpIcon" />
                        <text>{{ `点赞${threadInfo.like_cnt}` }}</text>

                    </view>
                    <view class="post-op-item" hover-class="btn-clicked" hover-stay-time="200" @click="favoriteThread">
                        <img :src="threadInfo.is_favorite ? FavoriteFillIcon : FavoriteIcon" />
                        <text>{{ `收藏${threadInfo.favourite_cnt}` }}</text>
                    </view>
                    <!--  -->
                    <view v-if="account.is_login && account.user_info.id === threadInfo.user_id"
                        hover-class="btn-clicked" hover-stay-time="200" class="post-op-item"
                        @click="showDelDialog = true">
                        <img :src="DeleteIcon" />
                        <text>删除</text>
                    </view>
                    <!-- 版主管理按钮 -->
                    <view v-if="account.is_login && isModerator" hover-class="btn-clicked" hover-stay-time="200"
                        class="post-op-item right" @click="moderatorAction.show = true">
                        <img :src="ManagerIcon" />
                        <text>管理</text>
                    </view>
                </view>
            </nut-col>
            <!-- 分割线 -->
            <nut-col span="22" offset="1">
                <nut-divider class="post-divider" content-position="left">
                    回帖分割线
                </nut-divider>
            </nut-col>

            <!-- 回帖列表 -->
            <template v-if="!postLoading && threadPosts">
                <template v-if="threadPosts.total_count > 0">
                    <nut-col v-for="(post, index) in threadPosts.data" span="22" offset="1">
                        <view :class="'.post-id-' + post.id"></view>
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
                                            <template v-if="post.user.state === 0 || post.user.state === 1">
                                                <view v-if="post.son_post.deleted_at === null"
                                                    class="post-message html-message taro_html vditor-reset"
                                                    @click="htmlClick($event)" v-html="post.son_post.message">
                                                </view>
                                                <view v-else
                                                    class="post-message html-message taro_html vditor-reset del-message">
                                                    该评论已删除!
                                                </view>
                                            </template>

                                            <view v-else-if="post.user.state === 2"
                                                class="post-message html-message taro_html vditor-reset del-message">
                                                用户被禁言，该内容已隐藏
                                            </view>
                                        </view>
                                        <template v-if="post.user.state === 0 || post.user.state === 1">
                                            <view v-if="post.deleted_at === null"
                                                class="post-message html-message taro_html vditor-reset"
                                                @click="htmlClick($event)" v-html="post.message">
                                            </view>
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
                                <nut-cell class="op">
                                    <view class="op-list">
                                        <view class="op-item" hover-class="btn-clicked" hover-stay-time="200"
                                            @click="likeBtnClicked(post)">
                                            <img :src="post.is_up ? UpFillIcon : UpIcon" />
                                            <text class="content">{{ `点赞${post.like_cnt}` }}</text>
                                        </view>
                                        <view class="op-item" hover-class="btn-clicked" hover-stay-time="200"
                                            @click="replyBtnClicked(post.id, post.post_user_id, post.user.nickname)">
                                            <img :src="CommentIcon" />
                                            <text class="content">回复</text>
                                        </view>
                                        <view
                                            v-if="account.is_login && account.user_info.id === post.post_user_id && post.deleted_at === null"
                                            class="op-item" hover-class="btn-clicked" hover-stay-time="200"
                                            @click="showDelDialog = true; deletePostId = post.id">
                                            <img :src="DeleteIcon" />
                                            <text class="content">删除</text>
                                        </view>
                                    </view>
                                </nut-cell>
                            </nut-cell-group>
                        </view>
                    </nut-col>
                    <!-- 只在最后一页显示 -->
                    <nut-col
                        v-if="interval && pagination.page === Math.ceil(threadPosts.total_count / pagination.limit)">
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
                </template>
            </template>
            <template v-else>
                <view class="skeleton-container" v-for=" in [1, 2, 3, 4, 5, 6, 7]">
                    <nut-skeleton width="70vw" height="20px" title animated avatar avatarSize="40px" row="2">
                    </nut-skeleton>
                </view>
            </template>
            <!-- 自己回帖 -->
            <SendPost v-model="isChooseImage" :info="threadInfo" :is-reply="isReply" :reply-id="replyId"
                :reply-user-id="replayUserId" :reply-nick-name="replyNickName" @login="showLoginDialog = true"
                @cancel-reply="cancelReply">
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
        <nut-dialog content="是否确认删除该条帖子" v-model:visible="showDelDialog" @cancel="deletePostId = 0"
            @ok="deleteThread" />
        <!-- 版主管理Popup弹窗 -->
        <nut-action-sheet v-model:visible="moderatorAction.show" :menu-items="(moderatorAction.items as any)"
            @choose="$event.callback()" cancel-txt="取消" />
        <!-- 版主删除对话框 -->
        <nut-dialog v-model:visible="showModeratorDelDialog" title='删除' :before-close="moderatorDelDialogClosed">
            <template #default>
                <nut-form ref="delFormRef" class="moderator-del-form" :model-value="delForm">
                    <nut-form-item prop="reason" required :rules="[{ required: true, message: '请填写说明' }]">
                        <nut-textarea v-model="delForm.reason" style="height: 70px;" placeholder="操作说明" auto-focusd />
                    </nut-form-item>
                    <nut-form-item prop="notify">
                        <nut-checkbox v-model="delForm.notify">通知作者</nut-checkbox>
                    </nut-form-item>
                </nut-form>
            </template>
        </nut-dialog>
        <nut-dialog v-model:visible="showModeratorMoveDialog" title='移动帖子' :before-close="moderatorMoveDialogClosed">
            <template #default>
                <nut-cell title="版块" :desc="selectedForum?.name || '请选择'" is-link
                    @click="showForumSelection = true"></nut-cell>
                <nut-cell title="主题" :desc="selectedThemeType?.name || '请选择'" is-link @click="themeTypeCellClicked">
                </nut-cell>
            </template>
        </nut-dialog>
        <!-- 选择版块弹窗 -->
        <nut-popup v-model:visible="showForumSelection" round position="bottom" :style="{ height: '50%' }"
            safe-area-inset-bottom>
            <nut-tabs v-model="activeForumTab" title-scroll style="height: 100%" direction="vertical"
                @change="console.log(activeForumTab)">
                <!-- 按分类渲染版块 -->
                <template v-for="forum in forumList" :key="forum.name">
                    <nut-tab-pane :title="forum.name" :paneKey="forum.name">
                        <nut-cell-group>
                            <template #title>
                                <view class="cell-group-title">{{ forum.name }}</view>
                            </template>
                            <!-- 内层遍历forum[] -->
                            <template v-for="subForum in forum.forum">
                                <nut-cell :title="subForum.name" center is-link
                                    @click="forumClicked(subForum.id, subForum.name)">
                                    <template #icon>
                                        <nut-avatar shape="square"><img :src="subForum.icon" /></nut-avatar>
                                    </template>
                                    <!-- 取消右侧箭头 -->
                                    <template #link>
                                        <view></view>
                                    </template>
                                </nut-cell>
                            </template>
                        </nut-cell-group>
                    </nut-tab-pane>
                </template>
            </nut-tabs>
        </nut-popup>
        <nut-popup v-model:visible="showThemeTypeSelection" round position="bottom" class="theme-popup"
            :style="{ height: '50%' }" safe-area-inset-bottom>
            <nut-cell-group>
                <template #title>
                    <view class="cell-group-title">请选择主题类型</view>
                </template>
                <!-- 内层遍历forum[] -->
                <template v-for="theme in themeTypeList">
                    <nut-cell :title="theme.name" center is-link @click="themeTypeClicked(theme.id, theme.name)">
                        <!-- 取消右侧箭头 -->
                        <template #link>
                            <view></view>
                        </template>
                    </nut-cell>
                </template>
            </nut-cell-group>
        </nut-popup>
        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
    </view>
</template>
<script lang="ts" setup>
import { watch, ref, watchEffect } from 'vue';
import Taro, { useShareAppMessage, useShareTimeline, useUnload, useDidShow, useDidHide } from '@tarojs/taro'
import TopIcon from '@/assets/top.svg'
import UpIcon from '@/assets/up.svg'
import UpFillIcon from '@/assets/up-fill.svg'
import FavoriteIcon from '@/assets/favorite.svg'
import FavoriteFillIcon from '@/assets/favorite-fill.svg'
import DeleteIcon from '@/assets/delete.svg'
import CommentIcon from '@/assets/comment.svg'
import ManagerIcon from '@/assets/manager.svg'
import { useConfigStore, useAccountStore, usePromptStore } from '@/stores'
import { TaroEvent } from '@tarojs/components';
import { TaroElement } from '@tarojs/runtime';
import dayjs from 'dayjs'
import { Element } from '@tarojs/runtime/dist/dom-external/inner-html/parser';
import SendPost from './send-post.vue'
import Vote from './vote.vue'
import {
    apiServer,
    ThreadInfo,
    ThreadPostList,
    ThreadUP,
    ThreadInfoData,
    ThreadFavorite,
    PostListResponse,
    DeleteThread,
    DeleteThreadPost,
    ThreadUserList,
    ModeratorDeleteThread,
    GetForum,
    GetTheme,
    ThemeResponse,
    ModeratorMoveThread,
    GetUserInfo
} from '@/api';
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
const prompt = usePromptStore()

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
                isChooseImage.value = true
                Taro.previewImage({
                    current: src,
                    urls: imageUrls
                })
            }, null)
            break
    }
    return el
}
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
        // 返回时需要多返回一步
        config.indexNeedRefresh = true
        Taro.navigateBack()
    }
})

useDidShow(() => {
    if (!isChooseImage) {
        // 登录成功后返回到帖子页面,刷新点赞和收藏状态
        threadRefresh.value++
        refreshScroll.value = false
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
computedAsync(async () => {
    threadRefresh.value
    const { data } = await ThreadInfo(threadID.value)
    threadInfo.value = data.data
    const { data: userInfo } = await GetUserInfo(threadInfo.value.user_id)
    banUser.value = !userInfo.allow_speak
}, undefined, { evaluating: infoLoading })

// 当前登陆用户是否为当前帖子所属版块的版主
const isModerator = ref(false)
const moderatorAction = ref({
    show: false,
    items: [
        {
            name: "移动", callback: () => {
                showModeratorMoveDialog.value = true
            }
        },
        {
            name: "删除", callback: () => {
                showModeratorDelDialog.value = true
            }
        }
    ]
})
// 版主删帖对话框
const showModeratorDelDialog = ref(false)
const delFormRef = ref(null)
// 删除表单
const delForm = ref({
    reason: "",
    notify: false
})

const moderatorDelDialogClosed = async (action: string) => {
    if (!threadInfo.value)
        return
    if (action === "ok") {
        const result = await (delFormRef.value as any).validate()
        console.log(result)
        if (result.valid) {
            const { data } = await ModeratorDeleteThread({
                id: threadID.value,
                forum_id: threadInfo.value?.forum_id,
                o_user_id: threadInfo.value?.user_id,
                note: delForm.value.reason,
                is_notify: delForm.value.notify ? 1 : 0
            })
            if (!data.code) {
                prompt.showToast("success", "删除成功")
                config.indexNeedRefresh = true
                Taro.navigateBack()
            }
            return true
        }
        return false
    } else {
        delForm.value.reason = ""
        delForm.value.notify = false
        return true
    }
}

// 版主移动帖子对话框
const activeForumTab = ref('全部')
const showModeratorMoveDialog = ref(false)
const showForumSelection = ref(false)
const showThemeTypeSelection = ref(false)
const themeTypeList = ref<ThemeResponse[]>()
const selectedForum = ref({
    id: 0,
    name: ""
})
const selectedThemeType = ref({
    id: 0,
    name: ""
})

const moderatorMoveDialogClosed = async (action: string) => {
    if (action === "ok") {
        if (!selectedForum.value.id) {
            prompt.showToast('warn', '请选择版块')
            return false
        }
        if (!selectedThemeType.value.id) {
            prompt.showToast('warn', '请选择主题类型')
            return false
        }
        try {
            await ModeratorMoveThread(threadID.value, selectedForum.value.id, selectedThemeType.value.id)
        } catch (e) {
            prompt.showToast('warn', '移动失败')
            return false
        } finally {
            selectedForum.value = { id: 0, name: '' }
            selectedThemeType.value = { id: 0, name: '' }
            prompt.showToast('success', '移动成功')
            threadRefresh.value++
            return true
        }
    }
    return true
}

const forumList = computedAsync(async () => {
    const { data } = await GetForum()
    return data
})

const forumClicked = (id: number, name: string) => {
    selectedForum.value = { id, name }
    showForumSelection.value = false
    selectedThemeType.value = { id: 0, name: '' }
}

// 点击主题类型
const themeTypeCellClicked = () => {
    if (!selectedForum.value.id) {
        prompt.showToast('warn', '请先选择版块')
        return
    }
    showThemeTypeSelection.value = true
}

// 选择主题类型
const themeTypeClicked = (id: number, name: string) => {
    selectedThemeType.value = { id, name }
    showThemeTypeSelection.value = false
}

// 监听selectedForum的变化，获取主题类型
watch(() => selectedForum.value, async (value) => {
    if (!value.id) return;
    const res = await GetTheme({ forum_id: value.id })
    themeTypeList.value = res.data
})

// 判断当前用户是否为帖子所属版块的版主
computedAsync(async () => {
    if (!account.is_login || !threadInfo.value) {
        isModerator.value = false
        return
    }
    const { data } = await ThreadUserList(threadInfo.value.forum_id)
    isModerator.value = data.data.some(user => user.id === account.user_info.id)
})

// 当前是否是在回复别人的评论
const isReply = ref(false)
const replyId = ref(0)
const replayUserId = ref(0)
const replyNickName = ref("")

const replyBtnClicked = (id: number, postUserId: number, nickName: string) => {
    if (!account.is_login) {
        showLoginDialog.value = true
        return
    }
    isReply.value = true
    replyId.value = id
    replayUserId.value = postUserId
    replyNickName.value = nickName
}
// 取消回复
const cancelReply = () => {
    isReply.value = false
    replyId.value = 0
    replayUserId.value = 0
    replyNickName.value = ""
}

// 获取回复数据
const threadPosts = ref<PostListResponse>()
// 刷新时是否滚动到回帖分割线
const refreshScroll = ref(true)
computedAsync(async () => {
    // 在回复时，需要手动刷新
    postRefresh.value
    const { data } = await ThreadPostList(threadID.value, {
        page: pagination.value.page,
        pageSize: pagination.value.limit,
    })
    threadPosts.value = data
}, undefined, { evaluating: postLoading })


// 点赞评论
const likeBtnClicked = async (post: PostListResponse["data"][0]) => {
    if (!account.is_login) {
        showLoginDialog.value = true
        return
    }
    const { data } = await ThreadUP(post.id, "pid")
    if (!data.code) {
        post.is_up = !post.is_up
        post.like_cnt += post.is_up ? 1 : -1
    }
}

// 翻页后滚动到回复分割线，如果是发帖后自动翻页则滚动到底部
const sendPostScroll = ref(false)
watch(threadPosts, (_, oldVal) => {
    if (oldVal == undefined) {
        // 如果路由参数中有postId，则滚动到指定位置
        if (postId.value) {
            Taro.nextTick(() => {
                Taro.createSelectorQuery().select(`.post-id-${postId.value}`).boundingClientRect().exec((res) => {
                    Taro.pageScrollTo({
                        scrollTop: res[0].top
                    })
                })
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
                Taro.pageScrollTo({
                    scrollTop: res[0].height
                })
                sendPostScroll.value = false
            })
        } else if (refreshScroll.value) {
            Taro.pageScrollTo({
                selector: ".post-divider",
                offsetTop: -100
            })
        }
        refreshScroll.value = true
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

// 时间格式化
const timeFormat = (timeStr: string) => {
    return dayjs(timeStr).format("YYYY-MM-DD HH:mm")
}

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

// 点赞和取消点赞帖子
const upThread = async () => {
    if (!account.is_login) {
        showLoginDialog.value = true
        return
    }
    if (!threadInfo.value)
        return
    const { data } = await ThreadUP(threadID.value, "tid")
    if (!data.code) {
        threadInfo.value.is_up = !threadInfo.value.is_up
        threadInfo.value.like_cnt += threadInfo.value.is_up ? 1 : -1
    }
}

// 收藏和取消收藏帖子
const favoriteThread = async () => {
    if (!account.is_login) {
        showLoginDialog.value = true
        return
    }
    if (!threadInfo.value)
        return
    const { data } = await ThreadFavorite(threadID.value)
    if (!data.code) {
        threadInfo.value.is_favorite = !threadInfo.value.is_favorite
        threadInfo.value.favourite_cnt += threadInfo.value.is_favorite ? 1 : -1
    }
}

// 删除帖子确认弹窗
const showDelDialog = ref(false)
const deletePostId = ref(0)
// 删除帖子
const deleteThread = async () => {
    if (!deletePostId.value) {
        // 删除主题帖
        const { data } = await DeleteThread(threadID.value)
        if (!data.code) {
            prompt.showToast("success", "删除成功")
            config.indexNeedRefresh = true
            Taro.navigateBack()
        }
    } else {
        // 删除评论
        const { data } = await DeleteThreadPost(deletePostId.value)
        if (!data.code) {
            prompt.showToast("success", "删除成功")
            refreshScroll.value = false
            postRefresh.value++
        }
        deletePostId.value = 0
    }
}

// 定时刷新评论
// 如果当前位于评论的最后一页,每三秒刷新一次
const interval = ref<NodeJS.Timeout>()
const intervalRefreshPost = ref(false)
watchEffect(() => {
    if (!threadPosts.value)
        return
    if (pagination.value.page === Math.ceil(threadPosts.value.total_count / pagination.value.limit)) {
        clearInterval(interval.value)
        const oldTotalCount = threadPosts.value.total_count
        interval.value = setInterval(async () => {
            if (hidden.value) return
            const { data } = await ThreadPostList(threadID.value, {
                page: pagination.value.page,
                pageSize: pagination.value.limit,
            })
            if (oldTotalCount !== data.total_count) {
                intervalRefreshPost.value = true
                threadPosts.value = data
            }
        }, 3000)
    } else {
        clearInterval(interval.value)
    }
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
    }

    .del-message {
        color: #97a3b4;
    }

    .post-op {
        display: flex;
        padding: 20rpx 0;
        align-items: center;

        .btn-clicked {
            background-color: #f5f5f5;
        }

        .post-op-item {
            display: flex;
            align-items: center;
            color: #97a3b4;
            margin-right: 13rpx;
            padding: 10rpx;
            border-radius: 12rpx;

            img {
                width: 30rpx;
                height: 30rpx;
            }

            text {
                font-size: 28rpx;
            }

            &.right {
                margin-left: auto;
            }
        }
    }

    .post-main {
        .op {
            padding-top: 10rpx;
            padding-bottom: 10rpx;

            .op-list {
                display: flex;
                align-items: center;

                .btn-clicked {
                    background-color: #f5f5f5;
                }

                .op-item {
                    display: flex;
                    align-items: center;
                    padding: 10rpx;
                    margin-right: 13rpx;
                    border-radius: 12rpx;

                    img {
                        width: 30rpx;
                        height: 30rpx;
                    }

                    text {
                        font-size: 28rpx;
                        color: #97a3b4;
                    }
                }
            }
        }
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
        background-color: #eee;
        padding: 12rpx;
    }

    // 添加边距，避免空回复列表被回帖输入框遮挡
    .nut-empty {
        padding-bottom: 200rpx;
    }


    .moderator-del-form {
        margin: 0;

        .nut-cell-group__wrap {
            box-shadow: none;
            margin: 0;
        }

        textarea {
            background: #f5f5f5;
            border-radius: 12rpx;
            padding: 10rpx;
        }
    }

    .theme-popup {
        .nut-popup {
            padding: 20rpx;
        }
    }
}
</style>