// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { api } from '@/api'
import App from '@/App.vue'
import Login from '@/components/Login.vue'
import HomePage from '@/components/HomePage.vue'

vi.mock('@/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), postForm: vi.fn(), postJson: vi.fn(), patchJson: vi.fn(), delete: vi.fn(), deleteJson: vi.fn() }
}))

function httpError (status) {
  return Object.assign(new Error(`HTTP ${status}`), { status })
}

function makeRouter () {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: Login },
      { path: '/apps', name: 'apps', component: { template: '<p>apps</p>' } },
      { path: '/account', name: 'account', component: { template: '<p>account</p>' } },
      { path: '/forgot', name: 'forgot', component: { template: '<p>forgot</p>' } },
      { path: '/register', name: 'register', component: { template: '<p>register</p>' } },
      ...['legal', 'privacy', 'terms'].map(name => ({ path: '/' + name, name, component: { template: '<p />' } }))
    ]
  })
}

beforeEach(() => vi.resetAllMocks())

describe('Login', () => {
  it('logs in when the form is submitted (Enter key)', async () => {
    api.postForm.mockResolvedValue('Logged')
    const wrapper = mount(Login, { global: { stubs: ['router-link'] } })
    await wrapper.find('input[name=username]').setValue('alice')
    await wrapper.find('input[name=password]').setValue('secret')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.postForm).toHaveBeenCalledWith('login', { userId: 'alice', password: 'secret' })
    expect(wrapper.emitted('authenticated')).toEqual([[true]])
  })

  it("doesn't call a server error a wrong password", async () => {
    api.postForm.mockRejectedValue(httpError(503))
    const wrapper = mount(Login, { global: { stubs: ['router-link'] } })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Serveur injoignable')
  })

  it('says when the password is wrong', async () => {
    api.postForm.mockRejectedValue(httpError(401))
    const wrapper = mount(Login, { global: { stubs: ['router-link'] } })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Identifiant ou mot de passe incorrect')
  })
})

describe('App', () => {
  async function mountApp (path) {
    const router = makeRouter()
    router.push(path)
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()
    return { wrapper, router }
  }

  it('stays logged in and says so when the logout fails', async () => {
    api.get.mockResolvedValue('Logged')
    api.post.mockRejectedValue(httpError(503))
    const { wrapper, router } = await mountApp('/apps')
    await wrapper.find('#nav a.logout').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('La déconnexion a échoué')
    expect(wrapper.find('#nav a.logout').exists()).toBe(true)
    expect(router.currentRoute.value.name).toBe('apps')
  })

  it('goes back to login once the logout succeeded', async () => {
    api.get.mockResolvedValue('Logged')
    api.post.mockResolvedValue('Logout')
    const { wrapper, router } = await mountApp('/apps')
    await wrapper.find('#nav a.logout').trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('logout')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it("doesn't let a slow startup check undo a login", async () => {
    let answerCheck
    api.get.mockReturnValue(new Promise((resolve, reject) => { answerCheck = reject }))
    api.postForm.mockResolvedValue('Logged')
    const { wrapper, router } = await mountApp('/login')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('apps')
    // The check started before the login answers last, with the old "not logged in"
    answerCheck(httpError(401))
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('apps')
  })
})

describe('AccountPage', () => {
  const account = {
    email: 'a@x.io',
    displayName: 'Alice',
    quotas: { maxApps: 5, maxPagesPerApp: 30, maxMonthlyViews: 100000 },
    usage: { apps: 2, monthViews: 120000, monthStart: Date.UTC(2026, 10, 1) }
  }

  async function mountAccount () {
    const { default: AccountPage } = await import('@/components/AccountPage.vue')
    api.get.mockResolvedValue(account)
    const wrapper = mount(AccountPage)
    await flushPromises()
    return wrapper
  }

  it('shows the usage and the monthly alert', async () => {
    const wrapper = await mountAccount()
    expect(wrapper.text()).toContain('2 / 5')
    expect(wrapper.text()).toContain('1er novembre')
    expect(wrapper.text()).toContain('quota mensuel est dépassé')
  })

  it('changes the password only when both new ones match', async () => {
    const wrapper = await mountAccount()
    await wrapper.find('input[name=current]').setValue('secret123')
    await wrapper.find('input[name=new]').setValue('newsecret1')
    await wrapper.find('input[name=confirm]').setValue('other-one')
    await wrapper.findAll('form')[0].trigger('submit')
    expect(api.postJson).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('différents')

    api.postJson.mockRejectedValue(httpError(403))
    await wrapper.find('input[name=confirm]').setValue('newsecret1')
    await wrapper.findAll('form')[0].trigger('submit')
    await flushPromises()
    expect(api.postJson).toHaveBeenCalledWith('account/password', { current: 'secret123', new: 'newsecret1' })
    expect(wrapper.text()).toContain('Mot de passe actuel incorrect')
  })

  it('saves the monthly summary setting', async () => {
    const wrapper = await mountAccount()
    api.patchJson.mockResolvedValue(null)
    await wrapper.find('input[name=monthlyReport]').setValue(true)
    await flushPromises()
    expect(api.patchJson).toHaveBeenCalledWith('account', { monthlyReport: true })
  })

  it('logs out once the account is deleted', async () => {
    const wrapper = await mountAccount()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.deleteJson.mockResolvedValue(null)
    await wrapper.find('input[name=deletePassword]').setValue('secret123')
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()
    expect(api.deleteJson).toHaveBeenCalledWith('account', { password: 'secret123' })
    expect(wrapper.emitted('authenticated')).toEqual([[false]])
  })
})

describe('ResetPassword', () => {
  async function mountReset (query) {
    const { default: ResetPassword } = await import('@/components/ResetPassword.vue')
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/reset', name: 'reset', component: ResetPassword },
        { path: '/forgot', name: 'forgot', component: { template: '<p />' } },
        { path: '/login', name: 'login', component: { template: '<p />' } }
      ]
    })
    router.push({ path: '/reset', query })
    await router.isReady()
    const wrapper = mount(ResetPassword, { global: { plugins: [router] } })
    return { wrapper, router }
  }

  async function submit (wrapper, password, confirmation = password) {
    await wrapper.find('input[name=new]').setValue(password)
    await wrapper.find('input[name=confirm]').setValue(confirmation)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('sends the token of the link with the new password', async () => {
    api.postJson.mockResolvedValue(null)
    const { wrapper, router } = await mountReset({ token: 'abc123' })
    await submit(wrapper, 'newsecret1', 'other')
    expect(api.postJson).not.toHaveBeenCalled()
    await submit(wrapper, 'newsecret1')
    expect(api.postJson).toHaveBeenCalledWith('password/reset', { token: 'abc123', new: 'newsecret1' })
    expect(wrapper.text()).toContain('Mot de passe changé')
    expect(router.currentRoute.value.query.token).toBeUndefined()
  })

  it('says when the link is no longer valid', async () => {
    api.postJson.mockRejectedValue(Object.assign(httpError(400), { body: 'invalid or expired link' }))
    const { wrapper } = await mountReset({ token: 'old' })
    await submit(wrapper, 'newsecret1')
    expect(wrapper.text()).toContain('plus valable')
  })

  it('needs the token', async () => {
    const { wrapper } = await mountReset({})
    expect(wrapper.text()).toContain('lien est incomplet')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})

describe('Register', async () => {
  const { default: Register } = await import('@/components/Register.vue')

  it('sends the form token and the empty honeypot, then asks to check the email', async () => {
    api.get.mockResolvedValue({ formToken: 't.sig', emailVerification: true })
    api.postForm.mockResolvedValue('Check your email')
    const wrapper = mount(Register, { global: { stubs: ['router-link'] } })
    await flushPromises()
    await wrapper.find('input[name=email]').setValue('a@x.io')
    await wrapper.find('input[name=password]').setValue('secret123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.postForm).toHaveBeenCalledWith('register', { email: 'a@x.io', displayName: '', password: 'secret123', website: '', formToken: 't.sig' })
    expect(wrapper.text()).toContain('lien valable 24 heures')
    expect(wrapper.emitted('authenticated')).toBeUndefined()
  })

  it('reloads an expired form', async () => {
    api.get.mockResolvedValue({ formToken: 'old', emailVerification: true })
    api.postForm.mockRejectedValue(Object.assign(httpError(400), { body: 'Form expired, reload it' }))
    const wrapper = mount(Register, { global: { stubs: ['router-link'] } })
    await flushPromises()
    await wrapper.find('input[name=email]').setValue('a@x.io')
    await wrapper.find('input[name=password]').setValue('secret123')
    api.get.mockResolvedValue({ formToken: 'new', emailVerification: true })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('expiré')
  })
})

describe('HomePage', () => {
  it('shows the Android integration first, then iOS on demand', async () => {
    api.get.mockRejectedValue(httpError(401))
    const wrapper = mount(HomePage, { global: { stubs: ['router-link'] } })
    await flushPromises()
    expect(wrapper.text()).toContain('com.github.ClewigFr.AssAndroid:assLib:0.5.0')
    expect(wrapper.find('.ai a').attributes('href')).toContain('AssAndroid')

    const ios = wrapper.findAll('[role=tab]').find(tab => tab.text() === 'iOS')
    await ios.trigger('click')
    expect(ios.attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('https://github.com/ClewigFr/AssIOS')
    expect(wrapper.text()).toContain('.trackScreen(stats, "<UUID de la page>")')
    expect(wrapper.text()).not.toContain('assLib')
    expect(wrapper.find('.ai a').attributes('href')).toBe('https://github.com/ClewigFr/AssIOS/blob/master/AI_INTEGRATION.md')
  })
})
