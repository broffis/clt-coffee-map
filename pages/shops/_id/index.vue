<template>
  <div class="single-shop">
    <div class="single-shop__upper">
      <div class="single-shop__upper--header">
        <img
          v-if="logo"
          class="logo"
          :src="logo"
        ><!-- /.logo -->
        <div
          v-else
          class="title"
        >
          {{ name }}
        </div><!-- /.title -->
      </div><!-- /.single-shop__upper--header -->
    </div><!-- /.single-shop__upper -->
  </div><!-- /.single-shop -->
</template>

<script>
export default {
  name: 'SingleShop'
}
</script>
