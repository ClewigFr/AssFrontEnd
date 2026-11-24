<template>
  <!-- Two rounded bars: a bar chart, and (slightly) a pair of buttocks. Same colours in light and dark mode. -->
  <svg
    class="ass-logo"
    viewBox="0 0 120 120"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      width="120"
      height="120"
      rx="28"
      fill="#5a9e2f"
    />
    <path
      d="M24 96V58a17 17 0 0 1 34 0v38z"
      fill="#ffffff"
    />
    <path
      d="M62 96V50a17 17 0 0 1 34 0v46z"
      fill="#e3f5c9"
    />
  </svg>
</template>

<script>
export default {
  name: 'AssLogo',
  props: {
    size: { type: Number, default: 30 }
  }
}
</script>

<style scoped>
.ass-logo { display: block; flex: none; }
</style>
