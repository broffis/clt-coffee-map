<template>
  <div class="shop-page">
    <div class="header">
      <h1 class="title">
        Charlotte Coffee Map
      </h1>
      <Filters />
    </div><!-- /.header -->
    <div class="cards">
      <shop-card
        v-for="shop in shops"
        :key="shop.id"
        :shop="shop"
      />
    </div>
    <div class="shops-soon">
      <shop-coming-soon
        v-for="shop in comingSoon"
        :key="shop.id"
        :shop="shop"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ShopCard from '@/components/ShopCard'
import ShopComingSoon from '@/components/ShopComingSoon'
import Filters from '@/components/Filters'

export default {
  components: {
    ShopCard,
    ShopComingSoon,
    Filters
  },

  computed: {
    ...mapGetters({
      shops: 'shops/getFilteredShops',
      comingSoon: 'shops/getShopsComingSoon'
    })
  }
}
</script>
