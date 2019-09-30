<template>
  <div class="single-shop">
    <div class="shop-card__upper--header">
      <img
        v-if="hasLogo"
        class="shop-card__upper--logo"
        :src="singleShop.logo"
      >

      <div
        v-else
        class="title"
      >
        {{ shop.name }}
      </div><!-- /.title -->
    </div>
  </div><!-- /.single-shop -->
</template>

<script>
// import { mapActions } from 'vuex'

export default {
  name: 'SingleShop',

  // data () {
  //   return {
  //     shop: {}
  //   }
  // },

  props: {
    singleShop: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  computed: {
    getShopId () {
      return this.$route.params.id
    },
    hasWebsite () {
      return this.singleShop.websiteUrl && this.singleShop.websiteUrl !== undefined
    },
    hasFacebook () {
      return this.singleShop.facebookLink && this.singleShop.facebookLink !== undefined
    },
    hasTwitter () {
      return this.singleShop.twitterLink && this.singleShop.twitterLink !== undefined
    },
    hasInstagram () {
      return this.singleShop.instagramLink && this.singleShop.instagramLink !== undefined
    },
    hasLogo () {
      console.log(this.singleShop)
      // const logoTitle = this.singleShop.logo.replace('/images/logos/', '')
      // return this.singleShop.logo && logoTitle.length > 0
      return true
    }
  },

  mounted () {
    console.log(this.singleShop)
  }

  // methods: {
  //   ...mapActions({
  //     singleShop: 'shops/getSingleShop'
  //   })
  // }

  // async beforeMount () {
  //   console.log('Shop Id', this.getShopId)
  //   this.shop = await this.singleShop(this.getShopId)
  //   console.log(this.shop)
  // }
}
</script>
