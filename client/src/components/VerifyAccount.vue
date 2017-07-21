<template>
  <div>
    <div v-if="error">{{ error }}</div>
  </div>
</template>

<script>
  export default {
    name: 'hello',

    data () {
      return {
        error: null
      };
    },

    mounted(){
      let token = this.$route.query.verification;

      if( !token ){
        this.error = 'token invalid or expired';
        return;
      }

      this.$http
        .get(`/api/user/verify?verification=${token}`)
        .then(response => {
          if( !response.data.verified ){
            this.error = 'token invalid or expired';
            return;
          }
          this.flash({
            message: '<i class="material-icons">check_circle</i> Account verified. You can login now',
            variant: 'success'
          });
          this.$router.replace('/login');
        })
        .catch(err => {
          this.error = `${err.response.status} ${err.response.statusText}`;
        });
    }

  };
</script>


