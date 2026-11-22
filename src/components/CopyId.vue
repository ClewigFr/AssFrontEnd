<template>
  <span class="copy-id">
    <code>{{ id }}</code>
    <button
      type="button"
      :title="'Copier ' + id"
      @click="copy"
    >{{ copied ? 'Copié ✓' : 'Copier' }}</button>
  </span>
</template>

<script>
// A UUID with a copy-to-clipboard button
export default {
  name: 'CopyId',
  props: {
    id: { type: String, required: true }
  },
  data () {
    return { copied: false }
  },
  methods: {
    async copy () {
      try {
        await navigator.clipboard.writeText(this.id)
        this.copied = true
        setTimeout(() => { this.copied = false }, 1500)
      } catch {
        // Clipboard unavailable (e.g. insecure context): the id stays selectable
      }
    }
  }
}
</script>

<style scoped>
.copy-id code {
  font-size: 0.85em;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  user-select: all;
}
.copy-id button {
  margin-left: 6px;
  font-size: 0.8em;
}
</style>
