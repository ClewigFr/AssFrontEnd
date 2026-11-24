// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { api } from '@/api'
import App from '@/App.vue'
import Login from '@/components/Login.vue'

vi.mock('@/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), postForm: vi.fn(), postJson: vi.fn(), delete: vi.fn(), deleteJson: vi.fn() }
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
      { path: '/account', name: 'account', component: { template: '<p>account</p>' } }
    ]
  })
}

beforeEach(() => vi.resetAllMocks())

describe('Login', () => {
  it('logs in when the form is submitted (Enter key)', async () => {
    api.postForm.mockResolvedValue('Logged')
    const wrapper = mount(Login)
    await wrapper.find('input[name=username]').setValue('alice')
    await wrapper.find('input[name=password]').setValue('secret')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.postForm).toHaveBeenCalledWith('login', { userId: 'alice', password: 'secret' })
    expect(wrapper.emitted('authenticated')).toEqual([[true]])
  })

  it("doesn't call a server error a wrong password", async () => {
    api.postForm.mockRejectedValue(httpError(503))
    const wrapper = mount(Login)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Serveur injoignable')
  })

  it('says when the password is wrong', async () => {
    api.postForm.mockRejectedValue(httpError(401))
    const wrapper = mount(Login)
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
