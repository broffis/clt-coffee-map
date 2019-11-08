<template>
  <div :class="['filters-dropdown', { 'filters-dropdown--open': toggleMenu === true }]">
    <div
      class="filters-dropdown__label font-size-lg padding-b-2"
      @click="toggleMenu= !toggleMenu">
      <div class="flex-all">
        {{ label }}
        <span class="clr-blue-darker font-weight-medium">{{ activeLabel }}</span>
      </div>
    </div>

    <ul class="filters-dropdown__menu">
      <li
        class="menu-item"
        @click="changeSort('All', null)">
        All
      </li>
      <li
        v-for="(option, index) in sortOptions"
        :key="index"
        class="menu-item"
        @click="changeSort(option.name, option.id)">
          {{ option.name }}
        <!-- <Btn
          :value="i.label"
          @click="changeSort(i.sortIndex)" /> -->
      </li>
    </ul>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'FiltersTest',

  props: {
    sortType: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    sortOptions: {
      type: Array,
      default: () => {
        return []
      }
    },
    activeLabel: {
      type: String,
      default: 'All'
    }
  },

  data () {
    return {
      toggleMenu: false,
      currentSort: null
    }
  },

  methods: {
    ...mapActions({
      setCompanyFilter: 'shops/updateCompanyFilter',
      setRoasterFilter: 'shops/updateRoasterFilter'
    }),
    changeSort (name, id) {
      this.toggleMenu = false

      console.log('name', name)
      console.log('id', id)

      if (this.sortType === 'roaster') {
        this.activeLabel = name
        this.setRoasterFilter(id)
      }

      if (this.sortType === 'shop') {
        this.selectedCompany = name
        this.setCompanyFilter(id)
      }
    }
  }
}
</script>
