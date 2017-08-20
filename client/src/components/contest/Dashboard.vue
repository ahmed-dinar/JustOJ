<template>
  <div>

    <div v-if="!!error">
      <b-alert variant="warning">{{ error }}</b-alert>
    </div>


    <loading-data :loading="loading" v-else>
      <contest-navbar :contest="contest" :id="this.params.cid" class="mb-4"></contest-navbar>

      <div class="row dash-table">
        <div class="col-md-9">

          <h6 class="mb-1 btn-iconic">
            <i class="material-icons mr-1">extension</i> Problems
          </h6>

          <table class="table mb-0">
           <tbody>
            <tr v-for="problem in problems">

              <template v-if="joined">
                <td style="width: 9%">
                  {{ problem.ac }} | {{ problem.wa }}
                </td>
              </template>


              <td style="width: 5%">
                <h4 class="m-0">{{ problem.name }}</h4>
              </td>
              <td class="prob-title">
                <router-link :to="`/contests/${params.cid}/${params.slug}/p/${problem.id}/${problem.slug}`">
                  {{ problem.title }}
                </router-link>
              </td>
              <td style="width: 9%">
                <div class="btn-iconic btn-xs">
                  <i class="material-icons">person</i> x {{ problem.accepted }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </loading-data>
</div>
</template>

<script>

  import contestMixin from '@/mixins/contest';

  export default {
    name: 'Dashboard',
    mixins: [ contestMixin ],

    data () {
      return {
        contest: null,
        problems: null,
        loading: true,
        error: null
      };
    },

    methods: {
      fetchContest(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/contest/${this.params.cid}/dashboard`)
          .then(response => {
            console.log(response.data);
            this.contest = response.data.contest;
            this.problems = response.data.problems;

            this.error = null;
            this.done();
          })
          .catch(err=>{
            this.done();
            this.error = this.getApiError(err);
            this.$noty.warning(this.error);
            if( err.response.status === 302 ){
              this.$router.replace(`/contests/${this.params.cid}/${this.params.slug}`);
            }
          });
      },
      done(){
        this.loading = false;
        progressbar.done();
        progressbar.remove();
      }
    },

    mounted(){
      console.log(this.$store.state.route);
      this.fetchContest();
    }
  };
</script>


<style type="text/css" scoped>

  .dash-table h4, .dash-table h6{
    color: #4c5a67;
  }

  .dash-table .prob-title a{
    font-size: 15px;
    font-weight: 600;
  }

  .dash-table tbody{
    border-bottom: 1px solid #e9ecef;
  }

  .dash-table .btn-xs{
    font-weight: bold;
    color: #4c5a67;
    padding: 0;
  }


</style>