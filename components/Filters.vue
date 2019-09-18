<template>
  <div>
    <div class="filters__company dropdown">
      <button
        class="dropbtn"
        @click="toggleCompanyDropdown()"
      >
        {{ companyFilterText }}
      </button>
      <div
        class="dropdown-content"
        :class="{'--is-active': activeCompanyDropdown}"
      >
        <a
          @click="filterByCompany(null, null)"
        >Show All Shops</a>
        <a
          v-for="(company, index) in companies"
          :id="company.id"
          :key="`${company.name}-${index}`"
          :value="company.name"
          @click="filterByCompany(company.name, company.id)"
        >
          {{ company.name }}
        </a>
      </div>
    </div>

    <div class="filters__roaster dropdown">
      <button
        class="dropbtn"
        @click="toggleRoasterDropdown()"
      >
        {{ companyFilterText }}
      </button>
      <div
        class="dropdown-content"
        :class="{'--is-active': activeRoasterDropdown}"
      >
        <a
          @click="filterByRoaster(null, null)"
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
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Filters',

  data () {
    return {
      companyFilterText: this.isFilteredByCompany ? this.selectedCompany : 'Filter by shop',
      roasterFilterText: this.isFilteredByRoaster ? this.selectedRoaster : 'Filter by roaster',

      selectedCompany: null,
      selectedRoaster: null,

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
      return this.selectedCompany !== null
    },
    isFilteredByRoaster () {
      return this.selectedRoaster !== null
    }
  },

  updated () {
    console.log('Company filter text: ', this.companyFilterText)
    console.log('Roaster filter text: ', this.roasterFilterText)
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

<style lang="scss">
  /* Dropdown Button */
.dropbtn {
  background-color: #f1f1f1;
  color: black;
  padding: 16px;
  font-size: 16px;
  border: none;
}

/* The container <div> - needed to position the dropdown content */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f1f1f1;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;

  &.--is-active {
    display: block;
  }

  a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
  }

  a:hover {
    background-color: #ddd;
  }
}
/* Change the background color of the dropdown button when the dropdown content is shown */
.dropdown:hover .dropbtn {background-color: #3e8e41;}
</style>
