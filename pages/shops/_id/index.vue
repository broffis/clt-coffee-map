<template>
  <div class="single-shop">

  </div><!-- /.single-shop -->
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'SingleShop',

  data () {
    return {
      shop: {}
    }
  },

  computed: {
    getShopId () {
      return this.$route.params.id
    }
  },

  methods: {
    ...mapActions({
      singleShop: 'shops/getSingleShop'
    })
  },

  beforeMount () {
    this.shop = this.singleShop(this.getShopId)
  }
}
</script>
