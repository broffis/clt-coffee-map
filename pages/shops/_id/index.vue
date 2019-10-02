<template>
  <ShopPage :shop="singleShop" />
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ShopPage from '@/components/ShopPage'

export default {
  name: 'SingleShop',

  components: {
    ShopPage
  },

  data () {
    return {
      win: null,
      d: null
    }
  },

  computed: {
    ...mapGetters({
      singleShopId: 'shops/getSingleShopId',
      singleShop: 'shops/getSingleShop'
    })
  },

  beforeMount () {
    this.win = window
    this.d = document

    const shopId = parseInt(this.win.location.pathname.replace('/shops/', ''))
    console.log('Shop Id: ', shopId)

    this.setSingleShopId(shopId)
  },

  methods: {
    ...mapActions({
      setSingleShopId: 'shops/setSingleShopId'
    })
  }
}
</script>
