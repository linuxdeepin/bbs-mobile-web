<template>
    <view class="account-page">
        <view v-if="account.loaded">
            <view class="info" v-if="account.is_login">
                <nut-row>
                    <nut-col span="5" offset="1">
                        <nut-avatar size="large" shape="round">
                            <img :src="account.user_info.avatar" />
                        </nut-avatar>
                    </nut-col>
                    <nut-col span="18">
                        <view class="info-desc">
                            <span class="nickname"> {{ account.user_info.nickname }} </span>
                            <span class="desc">
                                {{ account.user_info.desc }}
                            </span>
                        </view>
                    </nut-col>
                </nut-row>
            </view>
            <view class="login" v-else>
                <nut-button type="primary" @click="loginAction.show = true">登录</nut-button>
            </view>
            <view class="dataset">
                <view class="item" span="6" offset="3">
                    <span class="number">{{ account.user_info.threads_cnt }}</span>
                    <span>帖子</span>
                </view>
                <view class="item" span="6">
                    <span class="number">{{ account.user_info.posts_cnt }}</span>
                    <span>回复</span>
                </view>
                <view class="item" span="6">
                    <span class="number">{{ account.user_info.favourite_cnt }}</span>
                    <span>收藏</span>
                </view>
            </view>
            <view>
                <template v-if="account.is_login">
                    <nut-cell title="退出登录" is-link @click="account.logout()"></nut-cell>
                    <!-- <nut-cell title="我的帖子" desc="暂不可用" is-link></nut-cell> -->
                    <!-- <nut-cell title="我的回复" desc="暂不可用" is-link></nut-cell> -->
                    <!-- <nut-cell title="我的收藏" desc="暂不可用" is-link></nut-cell> -->
                    <!-- <nut-cell title="我的消息" desc="暂不可用" is-link></nut-cell> -->
                </template>
                <template v-else>
                    <nut-cell title="注册账户" is-link @click="account.gotoRegister()"></nut-cell>
                </template>
            </view>
            <nut-tabbar v-model="tabActive" bottom @tab-switch="tabChange">
                <nut-tabbar-item tab-title="首页" name="index">
                    <template #icon>
                        <Home></Home>
                    </template>
                </nut-tabbar-item>
                <nut-tabbar-item tab-title="我的" name="account">
                    <template #icon>
                        <My2></My2>
                    </template>
                </nut-tabbar-item>
            </nut-tabbar>
        </view>
        <view v-else>
            <nut-skeleton width="60vw" height="20px" title avatar row="3">
            </nut-skeleton>

            <nut-skeleton class="menu-skeleton" width="90vw" height="40px" title animated row="5">
            </nut-skeleton>
        </view>
        <!-- 提示信息 -->
        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
        <!-- 登陆方式选择 -->
        <nut-action-sheet v-model:visible="loginAction.show" :menu-items="(loginAction.items as any)"
            @choose="$event.callback()" />
        <!-- 密码登陆 -->
        <nut-popup position="bottom" :close-on-click-overlay="false" :style="{ height: '200px' }"
            v-model:visible="loginByPassword.show">
            <view class="login-by-password">
                <nut-input v-model="loginByPassword.username" placeholder="请输入手机号或用户名" />
                <nut-input v-model="loginByPassword.password" placeholder="请输入密码" type="password" />
                <ne-captcha :id="captcha.elementID" :captcha-id="captcha.captchaID" width="640rpx" @verify="captcha.verify">
                </ne-captcha>
                <view>
                    <nut-button type="primary"
                        @click="captcha.tryVerify((code) => loginByPassword.login(code))">登陆</nut-button>
                    <nut-button type="default" @click="loginByPassword.show = false">取消</nut-button>
                </view>
            </view>
        </nut-popup>
    </view>
</template>
<script lang="ts" setup>

import { ref } from 'vue';
import { useTabsStore, useAccountStore, usePromptStore, } from '../../stores'
import { Home, My2 } from "@nutui/icons-vue-taro";

const tabs = useTabsStore()
const account = useAccountStore()
const prompt = usePromptStore()
const captcha = account.useForceCaptcha()

const { tabActive, tabChange } = tabs.usePageTabs('account')

const loginByPassword = ref({
    show: false,
    username: '',
    password: '',
    login: (captchaCode: string) => {
        const value = loginByPassword.value
        prompt.showToast('loading', "登录中", 0)
        account.loginByPassword(captcha.captchaID, captchaCode, value.username, value.password).then(() => {
            prompt.hideToast()
            value.show = false
        }).catch(() => {
            prompt.showToast('fail', "登录失败，请检查用户名和密码", 2000)
        })
    }
})

const loginAction = ref({
    show: false,
    items: [{
        name: '微信快速登录',
        subname: '登陆已绑定微信的深度账号',
        color: "#1890ff",
        callback: () => {
            prompt.showToast('loading', "登录中", 0)
            account.login().then(() => {
                prompt.hideToast()
            }).catch(() => {
                prompt.showToast('fail', "登录失败，请稍后再试", 2000)
            })
        }
    },
    {
        name: '使用密码登陆',
        subname: '登陆未绑定微信的深度账号',
        callback: () => {
            loginByPassword.value.username = ''
            loginByPassword.value.password = ''
            loginByPassword.value.show = true
            console.log("login by password")
        }
    },
    {
        name: '取消',
        callback: () => {
            loginAction.value.show = false
        }
    }]
})

</script>

<style lang="scss">
.account-page {
    padding: 1rem;
    min-height: 90vh;
    background: linear-gradient(to bottom, #1890ff 10rem, whitesmoke 10rem);

    .info {
        margin-top: 1rem;
        margin-bottom: 3rem;
    }

    .login {
        margin-top: 2rem;
        margin-bottom: 2rem;
        text-align: center;
    }

    .info-desc {
        color: white;
        margin-left: 1rem;
        display: flex;
        flex-direction: column;

        .nickname {
            font-size: large;
        }

        .desc {
            font-size: small;
        }
    }

    .dataset {
        display: flex;
        width: 100%;
        background-color: white;
        justify-content: space-around;
        border-radius: 4px;

        .item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 30%;
            height: 4rem;
            font-size: small;
            color: gray;

            .number {
                color: black;
                font-size: large;
            }
        }
    }

    .menu-skeleton {
        margin-top: 10vh;
    }

    .login-by-password {
        width: 80vw;
        margin: 20px auto;
        display: flex;
        flex-direction: column;
        gap: 10px;

        button {
            margin-right: 10px;
        }
    }
}
</style>