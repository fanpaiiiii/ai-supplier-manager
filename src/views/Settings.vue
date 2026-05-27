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

    <!-- 测试配置 -->
    <div class="section-title">测试配置</div>
    <div class="card">
      <div class="input-group">
        <label class="input-label">测试超时 (ms)</label>
        <input class="input" type="number" v-model.number="settings.timeout" placeholder="10000" />
      </div>
      <div class="input-group">
        <label class="input-label">并发测试数</label>
        <input class="input" type="number" v-model.number="settings.concurrency" placeholder="3" />
      </div>
      <div class="switch-row" style="border-bottom:none;">
        <span class="switch-label">自动测试 (每小时)</span>
        <div class="toggle" :class="{ on: settings.autoTest }" @click="settings.autoTest = !settings.autoTest"></div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="section-title">数据管理</div>
    <div class="card">
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">供应商总数</div>
          <div class="list-item-sub">本地存储的所有供应商</div>
        </div>
        <span style="font-size:20px;font-weight:700;color:var(--primary);">{{ suppliers.length }}</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button class="btn btn-outline btn-sm" style="flex:1" @click="exportData">📤 导出数据</button>
        <button class="btn btn-outline btn-sm" style="flex:1" @click="importData">📥 导入数据</button>
      </div>
      <button class="btn btn-danger btn-sm btn-full" style="margin-top:12px;" @click="clearData">🗑️ 清除所有数据</button>
    </div>

    <!-- 关于 -->
    <div class="section-title">关于</div>
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🤖</div>
      <div style="font-size:16px;font-weight:700;">AI 供应商管理器</div>
      <div style="font-size:13px;color:var(--text-secondary);margin:4px 0;">v1.0.0 PWA</div>
      <div style="font-size:12px;color:var(--text-secondary);">管理、测试、监控你的 AI 模型供应商</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useStore } from '../store'

const { suppliers, clearAll } = useStore()

const darkMode = ref(false)
const settings = reactive({
  timeout: 10000,
  concurrency: 3,
  autoTest: false,
})

onMounted(() => {
  darkMode.value = localStorage.getItem('darkMode') === 'true'
  const saved = localStorage.getItem('supplier-settings')
  if (saved) Object.assign(settings, JSON.parse(saved))
})

function toggleDark() {
  darkMode.value = !darkMode.value
  localStorage.setItem('darkMode', String(darkMode.value))
  window.dispatchEvent(new Event('storage'))
}

function exportData() {
  const blob = new Blob([JSON.stringify(suppliers.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'ai-suppliers-backup.json'
  a.click()
}

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
        localStorage.setItem('ai-suppliers', JSON.stringify(data))
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
