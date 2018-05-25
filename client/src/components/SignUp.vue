<template>
  <div class="form-center signup-form-wrapper">

   <div id="particles-js"></div>

   <b-alert variant="danger" class="text-center" dismissible :show="!!signupError" @dismissed="signupError=''" >
    {{ signupError }}
  </b-alert>

  <div class="card-block text-center form-header p-3">
    <router-link :to="{ path: '/' }" exact>
      <h3 class="web-title">just oj<sup>&#946;eta</sup></h3>
    </router-link>
  </div>

  <b-card class="mb-2 card-no-border">
    <div class="text-center" style="margin-bottom: 25px;">
     <h4 style="font-weight: bold; color: #737373;">Sign Up</h4>
   </div>

   <!-- Login Form -->
   <form @submit.prevent="submit('signup-form')" name="signup-form" data-vv-scope="signup-form">


    <div :class="{ 'form-group': true, 'input-icon': true, 'is-invalid': formError.has('signup-form.name')} ">
      <i class="material-icons md-20">person</i>
      <b-form-input
      name="name" type="text" placeholder="Name"
      v-model="creds.name"
      v-validate="'min:3|max:250|required'"
      ></b-form-input>
      <span v-show="formError.has('signup-form.name')" class="help form-control-feedback">{{ formError.first('signup-form.name') }}</span>
    </div>


    <div :class="{ 'form-group': true, 'input-icon': true, 'is-invalid': formError.has('signup-form.username')} ">
      <i class="material-icons md-20">person</i>
      <b-form-input
      name="username" type="text" placeholder="Username"
      v-model="creds.username"
      v-validate="'min:5|max:20|alpha_dash|required|verify_exists'"
      data-vv-delay="1000"
      ></b-form-input>
      <span v-show="formError.has('signup-form.username')" class="help form-control-feedback">{{ formError.first('signup-form.username') }}</span>
    </div>

    <div :class="{ 'form-group': true, 'input-icon': true, 'is-invalid': formError.has('signup-form.email')} ">
      <i class="material-icons md-20">email</i>
      <b-form-input
      name="email" type="text" placeholder="Email"
      v-model="creds.email"
      v-validate="'email|required|verify_exists'"
      data-vv-delay="1000"
      ></b-form-input>
      <span v-show="formError.has('signup-form.email')" class="help form-control-feedback">{{ formError.first('signup-form.email') }}</span>
    </div>

    <div :class="{ 'form-group': true, 'input-icon': true, 'is-invalid': formError.has('signup-form.password')} ">
      <i class="material-icons md-20">lock</i>
      <b-form-input
      name="password" type="password" placeholder="Password"
      v-model="creds.password"
      v-validate="'min:6|max:30|required'"></b-form-input>
      <span v-show="formError.has('signup-form.password')" class="help form-control-feedback">{{ formError.first('signup-form.password') }}</span>
    </div>

    <div :class="{ 'form-group': true, 'input-icon': true, 'is-invalid': formError.has('signup-form.confirmPassword')} ">
      <i class="material-icons md-20">lock</i>
      <b-form-input
      name="confirmPassword" type="password" placeholder="Confirm Password"
      v-model="creds.confirmPassword"
      v-validate="'confirmed:password'"></b-form-input>
      <span v-show="formError.has('signup-form.confirmPassword')" class="help form-control-feedback">{{ formError.first('signup-form.confirmPassword') }}</span>
    </div>

    <div class="form-group">
      <div class="captchaWrapper" :sitekey="recapt_key"></div>
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
        recapt_key: '6LfL7SAUAAAAAJW--J3re8gqgAGRITlYZ497Ynvt',
        creds: {
          name: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        },
        signupError: null
      };
    },


    methods: {

      submit(scope){

        this.loading = true;
        this.signupError = '';
        progressbar.start();

        let captchaResponse = this.$el.querySelector('.g-recaptcha-response');

        let credentials = {
          name: this.creds.name,
          username: this.creds.username,
          email: this.creds.email,
          password: this.creds.password,
          confirmPassword: this.creds.confirmPassword,
          'g-recaptcha-response': captchaResponse ? captchaResponse.value : ''
        };

        console.log(credentials);

        this.$validator
          .validateAll(scope)
          .then(result => {

            if(!result)
              return this.formDone();

            this.$http
              .post('/api/signup', credentials)
              .then(() => {
                this.formDone();
                this.resetForm();
                this.flash({
                  message: `Successfully registerd. A varification link sent to ${credentials.email}. Please follow the link to verify your account within 72 hours.`,
                  variant: 'success'
                });
                this.$router.replace('/login');
              })
              .catch(err => {

                this.signupError = has(err.response.data,'error')
                  ? err.response.data.error
                  : `${err.response.status} ${err.response.statusText}`;

                this.formDone();
              });

          });

      },

      formDone(){
        this.loading = false;
        progressbar.done();
        progressbar.remove();
        //reset recaptcha
        if (window.grecaptcha ){
          grecaptcha.reset();
        }
      },

      resetForm(){
        //reset every credential in data
        for (var key in this.creds) {
          if (this.creds.hasOwnProperty(key)) {
            this.creds[key] = '';
          }
        }

        this.$nextTick(() => {
          this.formError.clear('signup-form');
        });
      },

      initParticleJS(){
        particlesJS('particles-js', particlesOptions());
      },

      initCaptcha(){
        //https://maketips.net/tip/61/recaptcha-with-vuejs-example
        if (window.grecaptcha ){
          console.log('yay!');
          grecaptcha.render( this.$el.querySelector('.captchaWrapper'), { sitekey : this.recapt_key });
        }
        else{
          console.log('eh!');
        }
      }

    },

    mounted(){
      this.$nextTick(() => {
        this.initCaptcha();
        this.initParticleJS();
      });
    }

  };
</script>


