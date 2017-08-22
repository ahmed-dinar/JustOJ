<template>
  <div class="form-center signin-form">

     <div id="particles-js"></div>

    <flash-message variant="success"></flash-message>

    <b-alert variant="danger" class="text-center" dismissible :show="!!loginError" @dismissed="loginError=''" >
      {{ loginError }}
    </b-alert>


    <div class="card-block text-center form-header p-3">
      <router-link :to="{ path: '/' }" exact>
        <h3 class="web-title">Just<br>Online Judge</h3>
      </router-link>
    </div>

    <b-card class="mb-2 card-no-border">
      <div class="text-center" style="margin-bottom: 25px;">
       <h4 style="font-weight: bold; color: #737373;">Login</h4>
     </div>

     <!-- Login Form -->
     <form @submit.prevent="submit('log-form')" name="login-form" data-vv-scope="log-form">

      <div :class="{ 'form-group': true, 'input-icon': true, 'has-danger': formError.has('log-form.username')} ">
        <i class="material-icons md-20">person</i>
        <b-form-input
        name="username" type="text" placeholder="Username"
        v-model="creds.username"
        v-validate="'required'"
        ></b-form-input>
        <span v-show="formError.has('log-form.username')" class="help form-control-feedback">{{ formError.first('log-form.username') }}</span>
      </div>

      <div :class="{ 'form-group': true, 'input-icon': true, 'has-danger': formError.has('log-form.password')} ">
        <i class="material-icons md-20">lock</i>
        <b-form-input
        name="password" type="password" placeholder="Password"
        v-model="creds.password"
        v-validate="'required'"></b-form-input>
        <span v-show="formError.has('log-form.password')" class="help form-control-feedback">{{ formError.first('log-form.password') }}</span>
      </div>

      <div class="form-group">
        <router-link class="forgot-password pull-right" :to="{ path: '/account/password/reset' }" exact>Forgot Password?</router-link>
      </div>

      <div class="form-group">

        <button v-show="loading" class="btn btn-outline-primary btn-block" type="button">
          <pulse-loader class="loaderComp" :loading="loading" color="#737373" size="10px"></pulse-loader>
        </button>

        <button v-show="!loading" class="btn btn-outline-primary btn-block" type="submit">
          Submit
        </button>

      </div>

    </form>


    <div class="text-center help-block form-title">
      <span>Or</span>
    </div>

<!--     <div class="text-center">
      <a class="btn btn-social btn-md btn-google" href="#">
        <span class="fa fa-google"></span> Google
      </a>
      <a class="btn btn-social btn-md btn-dark" href="#">
        <span class="fa fa-github"></span> Github
      </a>
    </div> -->

    <!-- <hr> -->

    <div class="text-center">
      <router-link class="btn btn-outline-primary" to="/signup">
        Create an account
      </router-link>
    </div>


  </b-card>


</div>

</div>
</template>

<script>

  import has from 'has';
  import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
  import particlesOptions from '@/config/particlesOptions';

  export default {

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
    methods: {

      submit(scope){

        this.loading = true;
        this.loginError = '';
        progressbar.start();

        let credentials = {
          username: this.creds.username,
          password: this.creds.password
        };

        console.log(credentials);

        this.$validator
          .validateAll(scope)
          .then(result => {

            if(!result)
              return this.formDone();

            this.$store.dispatch('login', credentials)
              .then(() => {

                this.formDone();

                let go = has(this.$route.query,'next')
                  ? this.$route.query.next
                  : '/';

                this.$router.replace(go);
              })
              .catch(err => {
                this.formDone();
                this.resetForm();
                this.loginError = err;
              });

          });
      },

      formDone(){
        this.loading = false;
        progressbar.done();
        progressbar.remove();
      },

      resetForm(){
        this.creds.username = '';
        this.creds.password = '';
        this.$nextTick(() => {
          this.formError.clear('log-form');
        });
      },

      initParticleJS(){
        particlesJS('particles-js', particlesOptions());
      }

    },

    mounted(){
      this.$nextTick(() => {
        this.initParticleJS();
      });
    }

  };
</script>


