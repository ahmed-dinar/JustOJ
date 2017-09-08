<template>
  <div id="app">

    <b-navbar toggleable type="inverse"  v-if="showNavBar">
      <div class="container">

        <b-nav-toggle target="nav_collapse"></b-nav-toggle>

        <b-link class="navbar-brand" :to="{ path: '/' }">
          <!-- <img src="img/brand-logo.png"  width="35" height="32" /> -->
          JUST OJ<sup>&#946;</sup>
        </b-link>

        <b-collapse is-nav id="nav_collapse">

          <b-nav is-nav-bar>
            <b-nav-item :to="{ path: '/' }" exact>Home</b-nav-item>
            <b-nav-item :to="{ path: '/problems' }" exact>Problems</b-nav-item>
            <!-- <b-nav-item :to="{ path: '/ranks' }" exact>Ranks</b-nav-item> -->
            <b-nav-item :to="{ path: '/submissions' }" exact>Submissions</b-nav-item>
            <b-nav-item :to="{ path: '/contests' }" exact>Contests</b-nav-item>
          </b-nav>

          <b-nav is-nav-bar class="ml-auto">

            <template v-if="isLoggedIn">
              <b-nav-item exact><i class="material-icons">email</i></b-nav-item>

              <b-nav-item-dropdown right>

                <!-- Using text slot -->
                <template slot="text">
                  <span>{{ getUser.username  }}</span>
                </template>

                <b-dropdown-item :to="{ path: userLinks.profile }">
                  <i class="material-icons">person</i> Profile
                </b-dropdown-item>
                <b-dropdown-item :to="{ path: userLinks.settings }">
                  <i class="material-icons">settings</i> Settings
                </b-dropdown-item>
                <b-dropdown-item :to="{ path: userLinks.submissions }">
                  <i class="material-icons">near_me</i> My Submissions
                </b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item @click="logOut(true)">
                  <i class="material-icons">settings_power</i> Signout
                </b-dropdown-item>

              </b-nav-item-dropdown>


            </template>

            <template v-else>
              <b-nav-item class="nav-login-btn" :to="{ path: '/mails' }" exact><i class="material-icons">notifications</i></b-nav-item>
              <b-nav-item class="nav-login-btn" @click="goToLogin">Login</b-nav-item>
              <b-nav-item :to="{ path: '/signup' }" exact>Register</b-nav-item>
            </template>

          </b-nav>
        </b-collapse>
      </div>
    </b-navbar>


    <div v-if="$store.state.route.name === 'Home'">
      <router-view></router-view>
      <div class="main-footer">
        <footer class="container" >
          <div>
            &copy; 2017 CSE, JUST
            <!-- <div class="pull-right"><a href="mailto:madinar.cse@gmail.com">Developer: Ahmed Dinar</a></div> -->
          </div>
        </footer>
      </div>
    </div>

    <div class="main-wraper" v-else-if="showNavBar">
      <div class="content container main-height">
        <transition
          name="custom-classes-transition"
          enter-active-class="animated fadeIn"
          leave-class="animated fadeOut"
        >
          <router-view></router-view>
        </transition>
      </div>
      <div class="main-footer mt-4">
        <footer class="container" >
          <div>
            &copy; 2017 CSE, JUST
            <!-- <div class="pull-right"><a href="mailto:madinar.cse@gmail.com">Developer: Ahmed Dinar</a></div> -->
          </div>
        </footer>
      </div>
    </div>

    <div class="no-nav-body" v-else>
      <router-view></router-view>
    </div>

  </div>
</template>

<script>

  import { mapGetters, mapActions } from 'vuex';
  import pageLayout from '@/config/pageLayout';

  export default {

    name: 'app',

    created(){

      if( !this.isLoggedIn ){
        this.logOut();
      }

    },

    mounted(){
      // console.log(this.$store.state.route.path);
      // console.log(this.showNavBar);
    },

    computed: {

      showNavBar(){
        let page = this.$store.state.route.name;
        return pageLayout.noNavBar().indexOf(page) < 0;
      },

      userLinks(){
        return {
          profile: '/user/' + this.getUser.username,
          settings: '/user/settings/profile/',
          submissions: '/status/u/' + this.getUser.username
        };
      },

      ...mapGetters([
        'isLoggedIn',
        'getUser'
      ])

    },

    methods: {
      goToLogin(){
        window.location.href = `/login?next=${this.$store.state.route.path}`;
      },
      ...mapActions([
        'logOut'
      ])
    },

    mounted(){
      console.log(this.$store.state.route.name);
    }

  };
</script>

<style scoped>

  .nav-login-btn{
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }


</style>
