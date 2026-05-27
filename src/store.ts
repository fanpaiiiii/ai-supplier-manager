import { ref, computed, watch } from 'vue'

export interface Supplier {
  id: string
  name: string
  icon: string
  baseUrl: string
  apiKey: string
  models: string[]
  status: 'online' | 'offline' | 'testing'
  latency: number
  contextLength: number
  createdAt: number
}

const STORAGE_KEY = 'ai-suppliers'

function load(): Supplier[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function save(list: Supplier[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const suppliers = ref<Supplier[]>(load())

watch(suppliers, () => save(suppliers.value), { deep: true })

export function useStore() {
  const onlineCount = computed(() => suppliers.value.filter(s => s.status === 'online').length)
  const offlineCount = computed(() => suppliers.value.filter(s => s.status === 'offline').length)
  const avgLatency = computed(() => {
    const online = suppliers.value.filter(s => s.status === 'online')
    if (!online.length) return 0
    return Math.round(online.reduce((a, s) => a + s.latency, 0) / online.length)
  })
  const totalModels = computed(() => suppliers.value.reduce((a, s) => a + s.models.length, 0))

  function addSupplier(s: Omit<Supplier, 'id' | 'createdAt' | 'status' | 'latency'>) {
    suppliers.value.push({
      ...s,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
      status: 'offline',
      latency: 0,
    })
  }

  function updateSupplier(id: string, data: Partial<Supplier>) {
    const idx = suppliers.value.findIndex(s => s.id === id)
    if (idx >= 0) Object.assign(suppliers.value[idx], data)
  }

  function removeSupplier(id: string) {
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  function getSupplier(id: string) {
    return suppliers.value.find(s => s.id === id)
  }

  async function testSupplier(id: string) {
    const s = getSupplier(id)
    if (!s) return
    s.status = 'testing'
    try {
      const resp = await fetch(`/api/test?url=${encodeURIComponent(s.baseUrl)}&key=${encodeURIComponent(s.apiKey)}`)
      const data = await resp.json()
      s.latency = data.latency || 0
      if (data.ok) {
        s.status = 'online'
        if (data.models?.length) s.models = data.models
        if (data.maxContext && !s.contextLength) s.contextLength = data.maxContext
      } else {
        s.status = 'offline'
      }
    } catch {
      s.status = 'offline'
    }
  }

  function testAll() {
    suppliers.value.forEach(s => testSupplier(s.id))
  }

  function clearAll() {
    suppliers.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return { suppliers, onlineCount, offlineCount, avgLatency, totalModels, addSupplier, updateSupplier, removeSupplier, getSupplier, testSupplier, testAll, clearAll }
}
