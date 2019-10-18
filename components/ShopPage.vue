<template>
  <div class="single-shop-page">
    <div class="single-shop-page__upper">
      <div class="single-shop-page__upper--header">
        <img
          v-if="hasLogo"
          class="single-shop-page__upper--logo"
          :src="shop.logo"
        >
      </div><!-- /.single-shop-page__upper--header -->
      <div
          class="single-shop-page__upper--title"
        >
          {{ shop.name }}
        </div><!-- /.single-shop-page__upper--title -->
      <div class="single-shop-page__upper--text">
        <div
          v-if="shop.roaster !== ''"
          class="roaster"
        >
          <span class="roaster--label">Roaster:&nbsp;</span>
          <span class="roaster--value">{{ shop.roaster }}</span>
        </div><!-- /.roaster -->
      </div><!-- /.single-shop-page__upper--text -->
    </div><!-- /.single-shop-page__upper -->

    <div class="single-shop-page__lower">
      <div class="single-shop-page__lower--location">
        <!-- <span class="street">{{ shop.streetAddress }}</span>
        <span class="city">{{ shop.city }}, {{ shop.state }} {{ shop.zipCode }}</span> -->
      </div><!--/.single-shop-page__lower--location -->

      <div class="single-shop-page__lower--text">
        <div
          class="about"
        >
          <div
            v-if="shop.currentFavoriteDrink !== ''"
            class="about__drink"
          >
            <span class="about__drink--label">Favorite Offering:</span>
            <span clas="about__drink--text">{{ shop.currentFavoriteDrink }}</span>
          </div><!-- /.about__drink -->
          <div
            v-if="shop.about !== ''"
            class="about__info"
          >
            <span class="about__info--label">About:&nbsp;</span>
            <span class="about__info--text">{{ shop.about }}</span>
          </div><!-- /.about__info -->
          <div
            v-if="shop.shopInfo !== ''"
            class="about__special-info"
          >
            <span class="about__special-info--label">Shop Info:&nbsp;</span>
            <span class="about__special-info--text">{{ shop.shopInfo }}</span>
          </div><!-- /.about__special-info -->
        </div><!-- /.about -->
      </div><!-- /.single-shop-page__lower--text -->
    </div><!-- /.single-shop-page__lower -->
    <div class="single-shop-page__contact-info">
      <a
        v-if="hasWebsite"
        class="website"
        :href="shop.websiteUrl"
      >website</a>

      <a
        v-if="hasTwitter"
        class="twitter"
        :href="shop.twitterLink"
      >
        <img src="/images/icons/twitter-icon.png">
      </a>

      <a
        v-if="hasFacebook"
        class="facebook"
        :href="shop.facebookLink"
      >
        <img src="/images/icons/facebook-icon.png">
      </a>

      <a
        v-if="hasInstagram"
        class="instagram"
        :href="shop.instagramLink"
      >
        <img src="/images/icons/instagram-icon.png">
      </a>
    </div><!-- /.single-shop-page__contact-info -->
  </div><!-- /.single-shop-page -->
</template>
<script>

export default {
  name: 'ShopPage',

  props: {
    shop: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  computed: {
    hasWebsite () {
      return this.shop.websiteUrl && this.shop.websiteUrl !== undefined
    },
    hasFacebook () {
      return this.shop.facebookLink && this.shop.facebookLink !== undefined
    },
    hasTwitter () {
      return this.shop.twitterLink && this.shop.twitterLink !== undefined
    },
    hasInstagram () {
      return this.shop.instagramLink && this.shop.instagramLink !== undefined
    },
    hasLogo () {
      // const logoTitle = this.shop.logo.replace('/images/logos/', '')
      // console.log('logoTitle', logoTitle)
      // return this.shop.logo && logoTitle.length > 0
      console.log(typeof this.shop.logo)
      // return this.shop.logo && this.shop.logo.replace('/images/logos/', '')
      return this.shop.logo
    }
  },

  mounted () {
    console.log(this.shop)
  }
}
</script>
