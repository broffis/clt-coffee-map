<template>
  <div>
    <ul class="filters__company">
      <li
        v-for="(company, index) in companies"
        :id="company.id"
        :key="`${company.name}-${index}`"
        :value="company.name"
        @click="filterByCompany(company.id)"
      >
        {{company.name}}-{{index}}
      </li>
    </ul>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Filters',

  computed: {
    ...mapGetters({
      companies: 'shops/getCompanies'
    })
  },

  methods: {
    ...mapActions({
      setCompanyFilter: 'shops/updateCompanyFilter',
      setRoasterFilter: 'shops/updateRoasterFilter'
    }),

    filterByCompany (id) {
      this.setCompanyFilter(id)
    }
  }
}
</script>
