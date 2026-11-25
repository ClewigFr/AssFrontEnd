// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { api } from '@/api'
import AppsPage from '@/components/AppsPage.vue'
import AppDetail from '@/components/AppDetail.vue'
import { can, isShared, roleOf, shareError } from '@/roles'

vi.mock('@/api', () => ({
  BACKEND_URL: 'https://api.example.com',
  api: { get: vi.fn(), post: vi.fn(), postForm: vi.fn(), postJson: vi.fn(), patchJson: vi.fn(), delete: vi.fn(), deleteJson: vi.fn() }
}))

const APP_ID = '11111111-1111-1111-1111-111111111111'
const account = { quotas: { maxApps: 2, maxPagesPerApp: 5 } }

function httpError (status) {
  return Object.assign(new Error(`HTTP ${status}`), { status })
}

async function routerAt (path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/apps', name: 'apps', component: { template: '<p>apps</p>' } },
      { path: '/apps/:id', name: 'app', component: { template: '<p />' } }
    ]
  })
  await router.push(path)
  return router
}

// GET answers by path
function serve (routes) {
  api.get.mockImplementation(path => {
    const value = routes[path]
    return value instanceof Error ? Promise.reject(value) : Promise.resolve(value)
  })
}

async function mountDetail (role, extra = {}) {
  serve({
    account,
    [`apps/${APP_ID}`]: { app: { id: APP_ID, name: 'Shop', pages: 1, role }, pages: [{ id: 'p1', name: 'home' }] },
    apps: { apps: [{ id: APP_ID, name: 'Shop', pages: 1, role, owner: role === 'owner' ? undefined : 'alice@x.io' }] },
    [`apps/${APP_ID}/members`]: { members: [{ userId: 7, email: 'bob@x.io', role: 'read' }] },
    ...extra
  })
  const router = await routerAt(`/apps/${APP_ID}?tab=config`)
  const wrapper = mount(AppDetail, {
    props: { id: APP_ID },
    global: { plugins: [router], stubs: { StatsPage: true, CopyId: true } }
  })
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => vi.resetAllMocks())

describe('roles', () => {
  it('orders the roles and defaults to owner', () => {
    expect(roleOf({})).toBe('owner')
    expect(can({ role: 'read' }, 'manage')).toBe(false)
    expect(can({ role: 'manage' }, 'manage')).toBe(true)
    expect(can({ role: 'manage' }, 'owner')).toBe(false)
    expect(can({ role: 'owner' }, 'read')).toBe(true)
    expect(isShared({ role: 'read' })).toBe(true)
    expect(isShared({ role: 'owner' })).toBe(false)
  })

  it('explains a refused share', () => {
    expect(shareError(httpError(404))).toContain('Aucun compte')
    expect(shareError(httpError(500))).toBe('')
  })
})

describe('AppsPage', () => {
  it('marks shared applications and leaves them out of the quota', async () => {
    serve({
      account,
      apps: { apps: [
        { id: 'a', name: 'Mine', pages: 0, role: 'owner' },
        { id: 'b', name: 'Theirs', pages: 2, role: 'read', owner: 'alice@x.io' }
      ] }
    })
    const wrapper = mount(AppsPage, { global: { plugins: [await routerAt('/apps')], stubs: { CopyId: true } } })
    await flushPromises()
    const cards = wrapper.findAll('li')
    expect(cards[0].find('.badge').exists()).toBe(false)
    expect(cards[1].find('.badge').text()).toBe('Partagée · Lecture')
    expect(wrapper.text()).toContain('1 / 2 applications')
    // Not full: the shared application doesn't use this account's quota
    await wrapper.find('input[name=appName]').setValue('Other')
    expect(wrapper.find('button[type=submit]').attributes('disabled')).toBeUndefined()
  })
})

describe('AppDetail roles', () => {
  it('only shows reading to a reader', async () => {
    const { wrapper } = await mountDetail('read')
    expect(wrapper.find('h1 .badge').text()).toBe('Partagée · Lecture')
    expect(wrapper.find('input[name=pageName]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Supprimer des vues')
    expect(wrapper.text()).not.toContain('Zone de danger')
    expect(wrapper.findAll('button').map(b => b.text())).not.toContain('Supprimer')
    expect(wrapper.find('input[name=memberEmail]').exists()).toBe(false)
    expect(wrapper.text()).toContain('alice@x.io partage cette application avec vous (Lecture)')
    expect(api.get).not.toHaveBeenCalledWith(`apps/${APP_ID}/members`)
  })

  it('lets a manager handle pages and views, not the application', async () => {
    const { wrapper } = await mountDetail('manage')
    expect(wrapper.find('input[name=pageName]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Supprimer des vues')
    expect(wrapper.text()).not.toContain('Zone de danger')
    expect(wrapper.find('input[name=memberEmail]').exists()).toBe(false)
  })

  it('lets a member leave', async () => {
    api.delete.mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { wrapper, router } = await mountDetail('read')
    await wrapper.findAll('button').find(b => b.text() === 'Quitter cette application').trigger('click')
    await flushPromises()
    expect(api.delete).toHaveBeenCalledWith(`apps/${APP_ID}/members/me`)
    expect(router.currentRoute.value.name).toBe('apps')
  })

  it('lets the owner share, list and remove', async () => {
    const { wrapper } = await mountDetail('owner')
    expect(wrapper.text()).toContain('Zone de danger')
    expect(wrapper.find('.members').text()).toContain('bob@x.io')

    api.postJson.mockResolvedValue({ members: [
      { userId: 7, email: 'bob@x.io', role: 'read' },
      { userId: 8, email: 'carol@x.io', role: 'manage' }
    ] })
    await wrapper.find('input[name=memberEmail]').setValue(' carol@x.io ')
    await wrapper.find('select[name=memberRole]').setValue('manage')
    await wrapper.findAll('form').find(f => f.find('input[name=memberEmail]').exists()).trigger('submit')
    await flushPromises()
    expect(api.postJson).toHaveBeenCalledWith(`apps/${APP_ID}/members`, { email: 'carol@x.io', role: 'manage' })
    expect(wrapper.findAll('.members li')).toHaveLength(2)

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.delete.mockResolvedValue(null)
    await wrapper.findAll('.members button')[0].trigger('click')
    await flushPromises()
    expect(api.delete).toHaveBeenCalledWith(`apps/${APP_ID}/members/7`)
  })

  it('says when the email has no account', async () => {
    const { wrapper } = await mountDetail('owner')
    api.postJson.mockRejectedValue(httpError(404))
    await wrapper.find('input[name=memberEmail]').setValue('nobody@x.io')
    await wrapper.findAll('form').find(f => f.find('input[name=memberEmail]').exists()).trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role=alert]').text()).toContain('Aucun compte avec cet email')
    // Still on the application, not "introuvable"
    expect(wrapper.find('h1').text()).toContain('Shop')
  })
})
