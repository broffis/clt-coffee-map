<template>
  <div
    v-if="hasMapImage"
    class="map-image">
    <a :href="mapUrl">
      <div
        v-if="hasNeighborhood"
        class="map-image__neighborhood">
        Neighborhood: {{ neighborhood }}
      </div>
      <div
        v-else
        class="map-image__city">
        City: {{ city }}
      </div>
      <div class="map-image__map">
        <img :src="'/images/map/' + mapImage" />
      </div>
    </a>
  </div>
</template>

<script>
export default {
  name: 'MapImage',

  props: {
    location: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data () {
    return {
      address: this.location.address,
      city: this.location.city,
      state: this.location.state,
      zip: this.location.zipCode,
      lat: this.location.lat,
      long: this.location.long,
      neighborhood: this.location.neighborhood,
      mapImage: this.location.mapImage,
      mapUrl: this.location.mapUrl
    }
  },

  computed: {
    hasNeighborhood () {
      return this.neighborhood && this.neighborhood !== ''
    },
    hasMapImage () {
      return this.mapImage && this.mapImage !== '' && this.mapImage !== 'map-'
    }
  }
}
</script>
