import { ref, computed } from 'vue'

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

export interface LogEntry {
  id: string
  type: string
  supplier: string
  url?: string
  status?: number
  latency?: number
  models?: number
  ok?: boolean
  detail: string
  timestamp: string
}

const suppliers = ref<Supplier[]>([])
const logs = ref<LogEntry[]>([])

// Load from backend
async function loadSuppliers() {
  try {
    const resp = await fetch('/api/suppliers')
    if (resp.ok) suppliers.value = await resp.json()
  } catch {}
}

async function loadLogs(limit = 200) {
  try {
    const resp = await fetch(`/api/logs?limit=${limit}`)
    if (resp.ok) logs.value = (await resp.json()).reverse()
  } catch {}
}

// Init
loadSuppliers()

export function useStore() {
  const onlineCount = computed(() => suppliers.value.filter(s => s.status === 'online').length)
  const offlineCount = computed(() => suppliers.value.filter(s => s.status === 'offline').length)
  const avgLatency = computed(() => {
    const online = suppliers.value.filter(s => s.status === 'online')
    if (!online.length) return 0
    return Math.round(online.reduce((a, s) => a + s.latency, 0) / online.length)
  })
  const totalModels = computed(() => suppliers.value.reduce((a, s) => a + s.models.length, 0))

  async function addSupplier(s: Omit<Supplier, 'id' | 'createdAt' | 'status' | 'latency'>) {
    try {
      const resp = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      if (resp.ok) {
        const newSupplier = await resp.json()
        suppliers.value.push(newSupplier)
      }
    } catch {}
  }

  async function updateSupplier(id: string, data: Partial<Supplier>) {
    const idx = suppliers.value.findIndex(s => s.id === id)
    if (idx < 0) return
    // Optimistic update
    Object.assign(suppliers.value[idx], data)
    try {
      await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {}
  }

  async function removeSupplier(id: string) {
    suppliers.value = suppliers.value.filter(s => s.id !== id)
    try {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
    } catch {}
  }

  function getSupplier(id: string) {
    return suppliers.value.find(s => s.id === id)
  }

  async function testSupplier(id: string) {
    const s = getSupplier(id)
    if (!s) return
    s.status = 'testing'
    try {
      const resp = await fetch(`/api/test?url=${encodeURIComponent(s.baseUrl)}&key=${encodeURIComponent(s.apiKey)}&name=${encodeURIComponent(s.name)}`)
      const data = await resp.json()
      s.latency = data.latency || 0
      if (data.ok) {
        s.status = 'online'
        if (data.models?.length) s.models = data.models
        if (data.maxContext && !s.contextLength) s.contextLength = data.maxContext
      } else {
        s.status = 'offline'
      }
      // Persist status update
      await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s.status, latency: s.latency, models: s.models, contextLength: s.contextLength }),
      })
    } catch {
      s.status = 'offline'
    }
  }

  function testAll() {
    suppliers.value.forEach(s => testSupplier(s.id))
  }

  async function clearAll() {
    suppliers.value = []
    // Delete each supplier from backend
    try {
      const resp = await fetch('/api/suppliers')
      if (resp.ok) {
        const list = await resp.json()
        for (const s of list) {
          await fetch(`/api/suppliers/${s.id}`, { method: 'DELETE' })
        }
      }
    } catch {}
  }

  async function clearLogs() {
    try {
      await fetch('/api/logs', { method: 'DELETE' })
      logs.value = []
    } catch {}
  }

  return {
    suppliers, logs, onlineCount, offlineCount, avgLatency, totalModels,
    addSupplier, updateSupplier, removeSupplier, getSupplier,
    testSupplier, testAll, clearAll, loadLogs, clearLogs,
  }
}
