<template>
    <view class="register-page">
        <NavH5 title="注册" />
        <nut-skeleton width="60vw" height="20px" title avatar row="3">
        </nut-skeleton>
        <nut-skeleton class="menu-skeleton" width="90vw" height="40px" title animated row="5">
        </nut-skeleton>
        <nut-toast :msg="prompt.toast.msg" v-model:visible="prompt.toast.visible" :type="prompt.toast.type"
            :duration="prompt.toast.duration" />
        <nut-popup position="bottom" :close-on-click-overlay="false" :style="{ height: '40%' }"
            v-model:visible="showRegister">
            <view class="register">

                <nut-input v-model="phone" placeholder="手机号" clearable>
                    <template #right>
                        <nut-button type="info" size="small" :disabled="!phoneValid || codeSent"
                            @click="captcha.tryVerify(registerCode)">获取验证码</nut-button>
                    </template>
                </nut-input>
                <nut-input v-model="phoneCode" placeholder="手机验证码" />

                <nut-checkbox v-for="(item, index) in registerAgreementList" v-model="agreeList[index]">
                    我已阅读并同意
                    <span class="link" @tap="showAgree(item.id)">{{ item.name }}</span>
                </nut-checkbox>

                <!-- 网易易盾验证码，小程序插件引入 -->
                <ne-captcha :id="captcha.elementID" :captcha-id="captcha.captchaID" width="640rpx"
                    @verify="captcha.verify">
                </ne-captcha>
                <nut-button :type="btnDisable ? 'default' : 'primary'" @click="captcha.tryVerify(register)"
                    :disabled="btnDisable">
                    注册
                </nut-button>
            </view>
        </nut-popup>
        <nut-popup :style="{ height: '80vh', width: '90vw', padding: '10px' }" v-model:visible="showAgreement">
            <rich-text :nodes="agreementContent"></rich-text>
        </nut-popup>
    </view>
</template>
<script lang="ts" setup>
import Taro from '@tarojs/taro'
import { ref, computed } from 'vue';
import { useAccountStore, usePromptStore } from '@/stores'
import { GetAgreement } from '@/api';
import NavH5 from "@/widgets/navigation-h5.vue";

const account = useAccountStore()
const prompt = usePromptStore()

// 注册验证码
const captcha = account.useForceCaptcha()

const showRegister = ref(true)
const showAgreement = ref(false)
const agreementContent = ref("")
// 需要同意的隐私协议
const registerAgreementList = ref([
    { id: "6d61900fd8e94259ac533d26695d363d", name: "深度隐私政策" },
    { id: "f3a185cb59d546309362ac39e795ffbf", name: "深度帐号使用协议" },
]);
const agreeList = ref(Array(registerAgreementList.value.length).fill(false))

const phoneValid = computed(() => {
    return phone.value.match(/^1[3-9]\d{9}$/)
})

const codeSent = ref(false)

// 注册按钮是否禁用
const btnDisable = computed(() => {
    if (!phoneValid.value) {
        return true
    }
    if (phoneCode.value.length === 0) {
        return true
    }
    if (agreeList.value.filter(v => v).length < agreeList.value.length) {
        return true
    }
})

const phone = ref("")
const phoneCode = ref("")
const phoneExists = ref(false)

// 获取手机号验证码
const registerCode = async (captchaCode: string) => {
    try {
        prompt.showToast('loading', "发送中", 0)
        await account.registerCode(captcha.captchaID, captchaCode, phone.value)
        prompt.showToast('success', "验证码已发送", 3000)
        codeSent.value = true
    } catch (err) {
        if (err?.response.status === 403) {
            phoneExists.value = true
            prompt.showToast('text', "手机号已注册，正前往登陆页面", 3000)
            setTimeout(() => account.gotoPasswordLogin(phone.value), 3000)
            return
        }
        prompt.showToast('fail', "发送失败，请稍后在试", 2000)
    }
}

// 注册账户
const register = async (captchaCode: string) => {
    try {
        prompt.showToast('loading', "注册中", 0)
        await account.register(captcha.captchaID, captchaCode, phone.value, phoneCode.value)
        prompt.showToast("success", "已绑定微信，下次可使用微信登陆", 3000)
        setTimeout(() => Taro.navigateBack(), 3000)
    } catch (err) {
        // 如果返回http code是403，提示手机号已存在
        if (err?.response.status === 403) {
            phoneExists.value = true
            prompt.showToast('fail', "手机号已注册，请使用密码登录或选择其他手机号注册", 5000)
            return
        }
        // 如果返回http code是400，提示验证码错误
        if (err?.response.status === 400) {
            prompt.showToast('fail', "验证码错误", 2000)
            return
        }
        prompt.showToast('fail', "注册失败，请稍后再试", 2000)
    }
}

const showAgree = (id: string) => {
    GetAgreement(id, 'cn').then((resp) => {
        showAgreement.value = true
        agreementContent.value = resp.data.data.content
    })
}

</script>

<style lang="scss">
.register-page {
    padding: 1rem;
    min-height: 90vh;
    background: linear-gradient(to bottom, #1890ff 10rem, whitesmoke 10rem);

    .menu-skeleton {
        margin-top: 10vh;
    }

    .register {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        margin-left: 10vw;
        width: 80vw;

        button {
            width: 100%;
        }

        button[disabled] {
            color: grey;
        }

        .link {
            display: inline;
            color: #1890ff;
        }
    }
}
</style>