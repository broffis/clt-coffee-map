<template>
  <div class="container">
    <div>
      <h1 class="title">
        Charlotte Coffee Map
      </h1>
      <shop-card
        name="Test Coffee Shop"
        roaster="Roasting Company"
        logo="Logo placeholder"
        street-address="123 Main Street"
        city="Charlotte"
        state="NC"
        :zip-code="28210"
        review="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullam"
        :social-media-links="{
          websiteUrl: 'www.google.com',
          facebookLink: 'www.facebook.com',
          twitterLink: 'www.twitter.com',
          instagramLink: 'www.instagram.com'
        }"
      />
    </div>
  </div>
</template>

<script>
// import coffeeShops from '@/config/shops'
import ShopCard from '@/components/ShopCard'

export default {
  components: {
    ShopCard
  }
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 4rem;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
