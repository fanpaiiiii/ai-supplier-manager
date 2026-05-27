<template>
  <div class="fade-in">
    <h1 class="page-title" style="margin-bottom:20px;">⚙️ 设置</h1>

    <!-- 通用设置 -->
    <div class="section-title">通用设置</div>
    <div class="card">
      <div class="switch-row" style="border-bottom:none;">
        <span class="switch-label">🌙 深色模式</span>
        <div class="toggle" :class="{ on: darkMode }" @click="toggleDark"></div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="section-title">数据管理</div>
    <div class="card">
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">供应商总数</div>
          <div class="list-item-sub">后端持久化存储</div>
        </div>
        <span style="font-size:20px;font-weight:700;color:var(--primary);">{{ suppliers.length }}</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
        <button class="btn btn-primary btn-sm btn-full" @click="exportPlaintext">📤 一键导出全部（明文密钥）</button>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline btn-sm" style="flex:1" @click="exportData">📦 导出JSON（脱敏）</button>
          <button class="btn btn-outline btn-sm" style="flex:1" @click="importData">📥 导入数据</button>
        </div>
      </div>

      <div v-if="exportMsg" style="margin-top:10px;">
        <div class="tag tag-success" style="font-size:13px;">{{ exportMsg }}</div>
      </div>

      <button class="btn btn-danger btn-sm btn-full" style="margin-top:14px;" @click="clearData">🗑️ 清除所有数据</button>
    </div>

    <!-- 关于 -->
    <div class="section-title">关于</div>
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🤖</div>
      <div style="font-size:16px;font-weight:700;">AI 供应商管理器</div>
      <div style="font-size:13px;color:var(--text-secondary);margin:4px 0;">v1.1.0 PWA</div>
      <div style="font-size:12px;color:var(--text-secondary);">管理、测试、监控你的 AI 模型供应商</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStore } from '../store'

const { suppliers, clearAll } = useStore()

const darkMode = ref(false)
const exportMsg = ref('')

onMounted(() => {
  darkMode.value = localStorage.getItem('darkMode') === 'true'
})

function toggleDark() {
  darkMode.value = !darkMode.value
  localStorage.setItem('darkMode', String(darkMode.value))
  window.dispatchEvent(new Event('storage'))
}

// 一键导出明文密钥
function exportPlaintext() {
  const data = suppliers.value.map(s => ({
    name: s.name,
    icon: s.icon,
    baseUrl: s.baseUrl,
    apiKey: s.apiKey,
    models: s.models,
    contextLength: s.contextLength,
    status: s.status,
    latency: s.latency,
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `ai-suppliers-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  exportMsg.value = `已导出 ${data.length} 个供应商（明文密钥）`
  setTimeout(() => { exportMsg.value = '' }, 3000)
}

// 导出脱敏JSON
function exportData() {
  const data = suppliers.value.map(s => ({
    ...s,
    apiKey: s.apiKey.length > 8 ? s.apiKey.slice(0, 4) + '****' + s.apiKey.slice(-4) : '****',
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `ai-suppliers-masked-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  exportMsg.value = `已导出 ${data.length} 个供应商（密钥已脱敏）`
  setTimeout(() => { exportMsg.value = '' }, 3000)
}

// 导入数据
function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        for (const s of data) {
          if (s.name && s.baseUrl) {
            await fetch('/api/suppliers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(s),
            })
          }
        }
        location.reload()
      }
    } catch { alert('无效的JSON文件') }
  }
  input.click()
}

function clearData() {
  if (confirm('确定清除所有供应商数据？此操作不可恢复。')) {
    clearAll()
  }
}
</script>
