<template>
  <div class="form-center signin-form">

    <flash-message></flash-message>

    <b-alert variant="danger" class="text-center" dismissible :show="!!loginError" @dismissed="loginError=''" >
      {{ loginError }}
    </b-alert>

    <div class="card-block text-center form-header">
      <router-link :to="{ path: '/' }" exact>
        <h3 class="web-title">Just Online Judge</h3>
      </router-link>
    </div>

    <b-card class="mb-2" >

      <div class="text-center" style="margin-bottom: 25px;">
       <h3>Log In</h3>
     </div>

     <!-- Login Form -->
     <form @submit.prevent="submit('log-form')" name="login-form" data-vv-scope="log-form">

      <div :class="{ 'form-group': true, 'has-danger': formError.has('log-form.username')} ">
        <b-form-input
        name="username" type="text" placeholder="username"
        v-model="creds.username"
        v-validate="'required'"></b-form-input>
        <span v-show="formError.has('log-form.username')" class="help form-control-feedback">{{ formError.first('log-form.username') }}</span>
      </div>

      <div :class="{ 'form-group': true, 'has-danger': formError.has('log-form.password')} ">
        <b-form-input
        name="password" type="password" placeholder="password"
        v-model="creds.password"
        v-validate="'required'"></b-form-input>
        <span v-show="formError.has('log-form.password')" class="help form-control-feedback">{{ formError.first('log-form.password') }}</span>
      </div>

      <div class="form-group">
        <a href="#" class="forgot-password pull-right">Forgot Password?</a>
      </div>

      <div class="form-group">
        <button class="btn btn-primary btn-block" :disabled="loading"  type="submit">
          <pulse-loader class="loaderComp" :loading="loading" color="#ffffff" size="10px"></pulse-loader>
          <span v-show="!loading">Submit</span>
        </button>
      </div>

    </form>


    <div class="text-center help-block form-title">
      <span>Or Connect with</span>
    </div>

    <div>
      <a class="btn btn-social btn-md btn-facebook" href="#">
        <span class="fa fa-facebook"></span> Facebook
      </a>
      <a class="btn btn-social btn-md btn-google" href="#">
        <span class="fa fa-google"></span> Google
      </a>
      <a class="btn btn-social btn-md btn-dark" href="#">
        <span class="fa fa-github"></span> Github
      </a>
    </div>



  </b-card>

  <b-card class="mb-2" >
    <div class=" text-center">
      <router-link :to="{ path: '/signup' }" exact>
        Create an account
      </router-link>
    </div>
  </b-card>

  <button class="btn btn-primary btn-block"  @click="storeMe">
   store
 </button>


</div>

</div>
</template>

<script>

  import NProgress from 'nprogress';
  import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

  export default {

    name: 'app',

    components: {
      PulseLoader
    },

    data() {

      return{
        loading: false,
        creds: {
          username: '',
          password: ''
        },
        loginError: null
      };
    },

    computed: {

    },

    methods: {

      submit(scope){

        this.loading = true;
        this.loginError = '';
        NProgress.start();

        let credentials = {
          username: this.creds.username,
          password: this.creds.password
        };

        console.log(credentials);

        this.$validator.validateAll(scope)
          .then(result => {

            if(!result)
              return this.formDone();

            this.$store.dispatch('login', credentials)
              .then(() => {
                this.formDone();
              })
              .catch(err => {
                this.formDone();
                this.loginError = err;
              });

          });

      },

      formDone(){
        this.loading = false;
        NProgress.done();
        NProgress.remove();
      },

      storeMe(){
        this.$store.dispatch('flash',{ message: 'i am login!', variant: 'danger' }).then(()=>{
          setTimeout(()=>{
            console.log( this.$store.getters.getFlash );
            console.log( this.$store.getters.getFlash );
          }, 3000);
        });
      }

    },

    mounted(){

    }

};
</script>


