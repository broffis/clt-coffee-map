<template>
  <div class="shop-page">
    <div class="header">
      <h1 class="title">
        Charlotte Coffee Map
      </h1>
      <!-- <Filters /> -->
      <div class="filters">
        <filter-drop-down
          sortType="shop"
          label="Filter by Shop:"
          :sortOptions="companies"
          :activeLable="shopFilterLabel"
        />
        <filter-drop-down
          sortType="roaster"
          label="Filter by Roaster:"
          :sortOptions="roasters"
          :activeLabel="roasterFilterLabel"
        />
      </div>

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
import FilterDropDown from '@/components/FilterDropDown'

export default {
  components: {
    ShopCard,
    ShopComingSoon,
    FilterDropDown
  },

  computed: {
    ...mapGetters({
      shops: 'shops/getFilteredShops',
      comingSoon: 'shops/getShopsComingSoon',
      companies: 'shops/getCompanies',
      roasters: 'shops/getRoasters',
      roasterFilterLabel: 'shops/getActiveRoasterLabel',
      shopFilterLabel: 'shops/getActiveShopLabel'
    })
  }
}
</script>
