<template>
  <div class="filters">
    <div class="filters__roaster">
      <div
        class="filters--dropdown__label"
        @click="toggleRoasterDropdown"
      >
        <p class="filters--dropdown__label--type">Filter by Roaster:</p>
        <p class="filters--dropdown__label--value">{{ selectedRoaster }}</p>
      </div>
      <div
        class="dropdown-content"
        :class="{'--is-active': activeRoasterDropdown}"
      >
        <a
          @click="filterByRoaster('All', null)"
        >Show All Shops</a>
        <a
          v-for="roaster in roasters"
          :id="roaster.id"
          :key="`${roaster.name}-${roaster.id}`"
          :value="roaster.name"
          @click="filterByRoaster(roaster.name, roaster.id)"
        >
          {{ roaster.name }}
        </a>
      </div><!-- /.dropdown-content -->
    </div><!-- /.filters__roaster -->

    <div class="filters__company">
      <div
        class="filters--dropdown__label"
        @click="toggleCompanyDropdown"
      >
        <p class="filters--dropdown__label--type">Filter by Shop:</p>
        <p class="filters--dropdown__label--value">{{ selectedCompany }}</p>
      </div>
      <div
        class="dropdown-content"
        :class="{'--is-active': activeCompanyDropdown}"
      >
        <a
          @click="filterByCompany('All', null)"
        >Show All Shops</a>
        <a
          v-for="company in companies"
          :id="company.id"
          :key="`${company.name}-${company.id}`"
          :value="company.name"
          @click="filterByCompany(company.name, company.id)"
        >
          {{ company.name }}
        </a>
      </div><!-- /.dropdown-content -->
    </div><!-- /.filters__company -->
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Filters',

  data () {
    return {
      companyFilterText: this.selectedCompany,
      roasterFilterText: this.selectedRoaster,

      selectedCompany: 'All',
      selectedRoaster: 'All',

      activeCompanyDropdown: false,
      activeRoasterDropdown: false
    }
  },

  computed: {
    ...mapGetters({
      companies: 'shops/getCompanies',
      roasters: 'shops/getRoasters'
    }),
    isFilteredByCompany () {
      return this.selectedCompany !== ''
    },
    isFilteredByRoaster () {
      return this.selectedRoaster !== ''
    }
  },

  methods: {
    ...mapActions({
      setCompanyFilter: 'shops/updateCompanyFilter',
      setRoasterFilter: 'shops/updateRoasterFilter'
    }),

    filterByCompany (name, id) {
      this.toggleCompanyDropdown()
      this.selectedCompany = name
      this.setCompanyFilter(id)
    },

    filterByRoaster (name, id) {
      this.toggleRoasterDropdown()
      this.selectedRoaster = name
      this.setRoasterFilter(id)
    },

    toggleCompanyDropdown () {
      this.activeCompanyDropdown = !this.activeCompanyDropdown
    },

    toggleRoasterDropdown () {
      this.activeRoasterDropdown = !this.activeRoasterDropdown
    }
  }
}
</script>
