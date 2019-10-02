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
