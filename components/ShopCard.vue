<template>
  <div class="shop-card">
    <div class="shop-card__upper">
      <div class="shop-card__upper--text">
        <img
          v-if="logo"
          class="logo"
          :src="logo"
        >
        <div
          v-else
          class="title"
        >
          {{ name }}
        </div><!-- /.title -->
        <div class="roaster">
          Roaster: {{ roaster }}
        </div><!-- /.roaster -->
      </div><!-- /.shop-card__upper--text -->
    </div><!-- /.shop-card__upper -->

    <div class="shop-card__lower">
      <div class="shop-card__lower--location">
        <span class="street">{{ streetAddress }}</span>
        <span class="city">{{ city }}, {{ state }} {{ zipCode }}</span>
      </div><!-- /.shop-card__lower--location -->

      <div class="shop-card__lower--text">
        <div class="blurb">
          {{ review }}
        </div><!-- /.blurb -->
        <div class="contact-info">
          <span
            v-if="hasWebsite"
            class="website"
          >
            <a :href="socialMediaLinks.websiteUrl">website</a>
          </span><!-- /.website -->

          <a
            v-if="hasTwitter"
            class="twitter"
            :href="socialMediaLinks.twitterLink"
          >
            <img src="/images/twitter-icon.png">
          </a>

          <a
            v-if="hasFacebook"
            class="facebook"
            :href="socialMediaLinks.facebookLink"
          >
            <img src="/images/facebook-icon.png">
          </a>

          <a
            v-if="hasInstagram"
            class="instagram"
            :href="socialMediaLinks.instagramLink"
          >
            <img src="/images/instagram-icon.png">
          </a>
        </div><!-- /.contact-info -->
      </div><!-- /.shop-card__lower--text -->
    </div><!-- /.shop-card__lower -->
  </div><!-- /.shop-card -->
</template>
<script>

export default {
  name: 'ShopCard',

  props: {
    name: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: 'LOGO'
    },
    roaster: {
      type: String,
      default: ''
    },
    streetAddress: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    zipCode: {
      type: Number,
      default: null
    },
    review: {
      type: String,
      default: ''
    },
    socialMediaLinks: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  computed: {
    hasWebsite () {
      return this.socialMediaLinks && this.socialMediaLinks.websiteUrl !== null
    },
    hasFacebook () {
      return this.socialMediaLinks && this.socialMediaLinks.facebookLink !== null
    },
    hasTwitter () {
      return this.socialMediaLinks && this.socialMediaLinks.twitterLink !== null
    },
    hasInstagram () {
      return this.socialMediaLinks && this.socialMediaLinks.instagramLink !== null
    }
  }
}
</script>
