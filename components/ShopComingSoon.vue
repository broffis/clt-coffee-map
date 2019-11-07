<template>
  <div class="shop-coming-soon">
    <img
      class="shop-coming-soon__logo"
      :src="logo"
    >
    <p class="shop-coming-soon__name">
      {{ name }}
    </p>
    <a
      v-if="website !== ''"
      class="shop-coming-soon__website"
      :href="website">
      visit
    </a>
    <p
      v-else
      class="shop-coming-soon__neighborhood">
      {{ neighborhood }}
    </p>
  </div><!-- /.shop-coming-soon -->
</template>

<script>
export default {
  name: 'ShopComingSoon',

  props: {
    shop: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data () {
    return {
      logo: this.shop.logo !== '/images/logos/' ? this.shop.logo : '',
      name: this.shop.name,
      website: this.shop.websiteUrl,
      neighborhood: this.shop.locations[0].neighborhood
    }
  }
}
</script>
