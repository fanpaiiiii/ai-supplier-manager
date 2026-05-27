<template>
  <div class="slide-up">
    <div class="page-header">
      <div>
        <div class="page-header-title">设置</div>
        <div class="page-header-sub">Settings</div>
      </div>
    </div>

    <div class="page-pad">
      <div class="section-title" style="margin-bottom:10px;">通用</div>
      <div class="card" style="margin-bottom:18px;">
        <div class="list-item" style="cursor:default;">
          <van-icon name="moon-o" size="20" color="var(--primary)" style="margin-right:12px;" />
          <span class="list-item-title">深色模式</span>
          <van-switch v-model="darkMode" @change="toggleDark" size="22" />
        </div>
      </div>

      <div class="section-title" style="margin-bottom:10px;">数据管理</div>
      <div class="card" style="margin-bottom:18px;">
        <div class="list-item" style="cursor:default;">
          <span class="list-item-title">供应商总数</span>
          <span style="font-size:20px;font-weight:800;color:var(--primary);margin-left:auto;">{{ suppliers.length }}</span>
        </div>
      </div>

      <button class="btn btn-primary btn-full btn-sm" style="margin-bottom:10px;" @click="exportPlaintext">导出全部（明文密钥）</button>
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <button class="btn btn-sm" style="flex:1;" @click="exportData">导出脱敏</button>
        <button class="btn btn-sm" style="flex:1;" @click="importData">导入数据</button>
      </div>

      <div v-if="exportMsg" class="card fade-in" style="border-left:3px solid var(--success);margin-bottom:14px;">
        <div class="card-body" style="padding:10px 14px;font-size:13px;color:var(--success);">{{ exportMsg }}</div>
      </div>

      <button class="btn btn-danger btn-full btn-sm" style="margin-bottom:24px;" @click="clearData">清除所有数据</button>

      <div class="card">
        <div class="card-body" style="text-align:center;padding:28px 20px;">
          <div style="font-size:40px;margin-bottom:8px;">&#129302;</div>
          <div style="font-size:17px;font-weight:800;">AI 供应商管理器</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:4px;">v1.2.0 · Modern Design</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStore } from '../store'
import { showDialog, showToast } from 'vant'

const { suppliers, clearAll } = useStore()
const darkMode = ref(false)
const exportMsg = ref('')
onMounted(() => { darkMode.value = localStorage.getItem('darkMode') === 'true' })
function toggleDark(val: boolean) { localStorage.setItem('darkMode', String(val)); window.dispatchEvent(new Event('storage')) }
function downloadJSON(data: any, filename: string) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click() }
function exportPlaintext() { const data = suppliers.value.map(s => ({ name: s.name, icon: s.icon, baseUrl: s.baseUrl, apiKey: s.apiKey, models: s.models, contextLength: s.contextLength })); downloadJSON(data, `ai-suppliers-${new Date().toISOString().slice(0,10)}.json`); exportMsg.value = `已导出 ${data.length} 个供应商`; setTimeout(() => { exportMsg.value = '' }, 3000) }
function exportData() { const data = suppliers.value.map(s => ({ ...s, apiKey: s.apiKey.length > 8 ? s.apiKey.slice(0,4) + '····' + s.apiKey.slice(-4) : '····' })); downloadJSON(data, `ai-suppliers-masked-${new Date().toISOString().slice(0,10)}.json`); exportMsg.value = `已导出 ${data.length} 个（脱敏）`; setTimeout(() => { exportMsg.value = '' }, 3000) }
function importData() { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = async (e: any) => { const file = e.target.files[0]; if (!file) return; try { const data = JSON.parse(await file.text()); if (Array.isArray(data)) { for (const s of data) { if (s.name && s.baseUrl) await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }) } showToast({ message: `导入 ${data.length} 个`, type: 'success' }); setTimeout(() => location.reload(), 1000) } } catch { showToast({ message: '无效文件', type: 'fail' }) } }; input.click() }
function clearData() { showDialog({ title: '清除数据', message: '确定清除所有数据？不可恢复。' }).then(() => { clearAll(); showToast('已清除') }) }
</script>
