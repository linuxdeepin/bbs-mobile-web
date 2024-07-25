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
                <nut-button type="primary" @click="clickLoginBtn()">登录</nut-button>
            </view>
            <view class="dataset">
                <view class="item" span="6" offset="3" @click="toMyPost(false)">
                    <span class="number">{{ account.user_info.threads_cnt }}</span>
                    <span>帖子</span>
                </view>
                <view class="item" span="6" @click="toMyPost(true)">
                    <span class="number">{{ account.user_info.posts_cnt }}</span>
                    <span>回复</span>
                </view>
                <view class="item" span="6" @click="toFavorite">
                    <span class="number">{{ account.user_info.favourite_cnt }}</span>
                    <span>收藏</span>
                </view>
            </view>
            <view>
                <template v-if="account.is_login">
                    <nut-cell title="我的帖子" is-link @click="toMyPost(false)">
                        <template #desc>
                            我的主题/回复
                        </template>
                    </nut-cell>
                    <nut-cell title="我的收藏" is-link @click="toFavorite"></nut-cell>
                    <nut-cell title="退出登录" is-link @click="account.logout()"></nut-cell>
                    <!-- <nut-cell title="我的消息" desc="暂不可用" is-link></nut-cell> -->
                </template>
                <template v-else>
                    <!-- <nut-cell title="注册账户" is-link @click="account.gotoRegister()"></nut-cell> -->
                </template>
            </view>
            <Tabbar />
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
        <!-- 登录方式选择 -->
        <nut-action-sheet v-model:visible="loginAction.show" :menu-items="(loginAction.items as any)"
            @choose="$event.callback()" />
        <!-- 密码登录 -->
        <nut-popup position="bottom" :close-on-click-overlay="true" :style="{ height: '220px' }"
            v-model:visible="loginByPassword.show" safe-area-inset-bottom>
            <view class="login-by-password">
                <nut-input v-model="loginByPassword.username" :readonly="loginByPassword.usernameReadonly"
                    placeholder="请输入手机号或用户名" />
                <nut-input v-model="loginByPassword.password" placeholder="请输入密码" type="password" />
                <ne-captcha :id="captcha.elementID" :captcha-id="captcha.captchaID" width="640rpx"
                    @verify="captcha.verify">
                </ne-captcha>
                <view class="reset-password">
                    <span @click="resetPassword()">忘记密码</span>
                </view>
                <view class="btn-group">
                    <nut-button type="primary"
                        @click="captcha.tryVerify((code) => loginByPassword.login(code))">登录</nut-button>
                    <nut-button type="default" @click="loginByPassword.show = false">取消</nut-button>
                </view>
            </view>
        </nut-popup>

        <nut-dialog no-cancel-btn :title="bindDialog.title" :content="bindDialog.content"
            v-model:visible="bindDialog.visible" />
    </view>
</template>
<script lang="ts" setup>

import { ref } from 'vue';
import Taro, { useDidShow } from '@tarojs/taro'
import { useTabsStore, useAccountStore, usePromptStore, } from '@/stores'
import Tabbar from '@/widgets/tabbar.vue'

const tabs = useTabsStore()
const account = useAccountStore()
const prompt = usePromptStore()
const captcha = account.useForceCaptcha()
const instance = Taro.getCurrentInstance()
const isH5 = process.env.TARO_ENV === "h5";

useDidShow(() => {
    tabs.change({ name: 'account' })
})

if (account.is_login) {
    account.refreshInfo()
}

const bindDialog = ref({ visible: false, title: '', content: '' })

const loginByPassword = ref({
    show: false,
    username: '',
    password: '',
    usernameReadonly: false,
    login: async (captchaCode: string) => {
        try {
            const value = loginByPassword.value
            prompt.showToast('loading', "登录中", 0)
            const resp = await account.loginByPassword(captcha.captchaID, captchaCode, value.username, value.password)
            prompt.hideToast()
            value.show = false
            switch (resp.code) {
                case 1000:
                    prompt.showToast("success", "已绑定微信，下次可使用微信登陆", 4000)
                    break
                case 1002: // 账号已绑定其他微信号
                    bindDialog.value = { visible: true, title: '无法绑定微信号', content: '此账号已绑定其他微信号，如需绑定当前微信号，请在电脑端登录论坛打开账号中心进行解绑操作。' }
                    break
                case 1003: // 微信号已被其他账号绑定
                    bindDialog.value = { visible: true, title: '无法绑定微信号', content: '此微信号已绑定其他账号，可以使用微信号直接登录，如需解绑请在电脑端登录论坛打开账号中心进行解绑操作。' }
                    break
            }
        } catch (err) {
            prompt.showToast('fail', "登录失败，请检查用户名和密码", 2000)
        }
    }
})

const loginAction = ref({
    show: false,
    items: [{
        name: '使用微信登录',
        subname: "使用微信免密登录账号",
        color: "#1890ff",
        callback: () => {
            prompt.showToast('loading', "登录中", 0)
            account.login().then(() => {
                prompt.hideToast()
            }).catch((err) => {

                console.log("weapp login", { err });
                // 如果登录失败，并且账户未注册过deepinid，跳转到账户注册页面
                if (err?.response.status === 403) {
                    console.log("go to register");
                    prompt.showToast('loading', "微信未绑定深度账号，正前往注册页面", 3000)
                    setTimeout(() => {
                        prompt.hideToast()
                        account.gotoRegister();
                    }, 3000)
                    return
                }
                prompt.showToast('fail', "登录失败，请稍后再试", 2000)
            })
        }
    },
    {
        name: '使用密码登录',
        subname: '使用密码登录深度账号',
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
            loginByPassword.value.usernameReadonly = false
            loginAction.value.show = false
        }
    }]
})

const clickLoginBtn = () => {
    if (isH5) {
        account.login()
        return
    }
    loginAction.value.show = true
}

const resetPassword = () => {
    console.log("reset password")
    Taro.setClipboardData({
        data: "https://account.deepin.org/edit-password", success: () => {
            setTimeout(() => {
                prompt.showToast("text", "请打开浏览器粘贴链接来找回密码", 5000)
            }, 1500)
        }
    },)
}


if (instance.router && !isH5) {
    if (instance.router.params["username"]) {
        loginByPassword.value.usernameReadonly = true
        loginByPassword.value.username = instance.router.params["username"]
        loginByPassword.value.show = true
    } else if (instance.router.params["show-action"]) {
        loginAction.value.show = true
    }
}

const toMyPost = (isPost = false) => {
    Taro.navigateTo({ url: `/pages/mypost/mypost?tab=${isPost ? 'mypost' : 'mythread'}` })
}

const toFavorite = () => {
    Taro.navigateTo({ url: '/pages/favorite/favorite' })
}

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
        gap: 15px;

        .btn-group {
            display: flex;
            justify-content: space-between;

            button {
                margin-right: 10px;
                width: 40%;
            }
        }

        .reset-password {
            font-size: 25rpx;
            text-align: right;
            color: #1890ff;
        }
    }
}
</style>