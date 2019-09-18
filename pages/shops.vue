<template>
  <div class="container">
    <div>
      <h1 class="title">
        Charlotte Coffee Map
      </h1>
      <Filters />
      <shop-card
        v-for="shop in shops"
        :key="shop.id"
        :name="shop.name"
        :roaster="shop.roaster"
        :logo="shop.logo"
        :street-address="shop.address"
        :city="shop.city"
        :state="shop.state"
        :zip-code="shop.zipCode"
        :review="shop.review"
        :social-media-links="{
          websiteUrl: shop.websiteUrl,
          facebookLink: shop.facebookLink,
          twitterLink: shop.twitterLink,
          instagramLink: shop.instagramLink
        }"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ShopCard from '@/components/ShopCard'
import Filters from '@/components/Filters'

export default {
  components: {
    ShopCard,
    Filters
  },

  computed: {
    ...mapGetters({
      shops: 'shops/getFilteredShops'
    })
  }
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 4rem;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
