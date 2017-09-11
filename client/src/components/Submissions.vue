<template>
  <div>

    <div v-if="!!error">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
    </div>

    <div class="row" v-else>


      <div class="col-md-12">

      <h6 class="p-0 mb-3 btn-iconic">
        <i class="material-icons mr-1">schedule</i> Submissions
      </h6>
      <div class="card mb-5">
        <loading-data :loading="loading">
          <m-table
            :items="submissions"
            :fields="fields"
            keyIdentifier="submittime"
            class="submission-table"
          >
            <template slot="id" scope="sub">
              <router-link :to="`/submissions/${sub.value}`" >
                {{ sub.value }}
              </router-link>
            </template>
            <template slot="submittime" scope="sub">
              <div v-tooltip="sub.value">
                {{ fromWhen(sub.value) }}
              </div>
            </template>
            <template slot="username" scope="sub">
              <router-link :to="`/user/${sub.value}`" >
                {{ sub.value }}
              </router-link>
            </template>
            <template slot="title" scope="sub">
              <router-link v-tooltip="sub.value" :to="`/problems/${sub.item.pid}/${sub.item.slug}`" >
                {{ sub.value }}
              </router-link>
            </template>
            <template slot="language" scope="sub">
              {{ getRunLang(sub.value) }}
            </template>
            <template slot="cpu" scope="sub">
              {{ roundTo(sub.value) }}s
            </template>
            <template slot="memory" scope="sub">
              {{ toMB(sub.value) }}
            </template>
            <template slot="status" scope="sub">
              <b-badge :variant="statusVariant(sub.value)">
                {{  getRunStatus(sub.value) }}
              </b-badge>
            </template>
          </m-table>



        </loading-data>
      </div>

  
      <div class="d-flex justify-content-between" v-if="!loading && pagination && pagination.total !== null">
        <span></span>
        <b-pagination
        size="sm"
        :total-rows="pagination.total"
        v-model="cur_page"
        :per-page="pagination.page_limit"
        ></b-pagination>
        <span></span>
      </div>

      </div>

    </div>

  </div>
</template>

<script type="text/javascript">

  import has from 'has';
  import submissionMixin from '@/mixins/submission';

  export default {
    name: 'ProblemSubmissions',
    mixins: [ submissionMixin ],

    data(){
      return {
        submissions: null,
        pagination: null,
        loading: true,
        error: null,
        cur_page: null,
        fields: {
          id: {
            label: '#',
            tdClass: ['ellipsis','subs-index-cell']
          },
          submittime: {
            label: 'When'
          },
          username: {
            label: 'Who',
            tdClass: ['ellipsis','subs-title-cell']
          },
          title: {
            label: 'Problem',
            tdClass: ['ellipsis','subs-title-cell']
          },
          language: {
            label: 'Lang'
          },
          cpu: {
            label: 'CPU'
          },
          memory: {
            label: 'Memory'
          },
          status: {
            label: 'Verdict'
          }
        }

      };
    },
    methods: {
      fetchSubmissions(){
        this.loading = true;
        progressbar.start();

        let url = '/api/submission';
        let m = '?';

        if( has(this.$store.state.route.query,'user') ){
          url = `${url}${m}user=${this.$store.state.route.query.user}`;
          m = '&';
        }

        if( has(this.$store.state.route.query,'problem') ){
          url = `${url}${m}problem=${this.$store.state.route.query.problem}`;
          m = '&';
        }

        if( has(this.$store.state.route.query,'page') ){
          url = `${url}${m}page=${this.$store.state.route.query.page}`;
        }

        this.$http
          .get(url)
          .then(response => {
            this.submissions = response.data.submissions;
            this.pagination = response.data.pagination;
            this.cur_page = this.pagination.cur_page;
            this.doneFetching();
          })
          .catch(err => {
            this.loading = false;
            this.error = this.getApiError(err);
            this.doneFetching();
          });
      },

      doneFetching(){
        this.loading = false;
        progressbar.done();
        progressbar.remove();
      }
    },

    created(){
      this.fetchSubmissions();
    },

    watch: {
      '$route': 'fetchSubmissions',
      cur_page: function (page) {
        this.$router.push({
          path: this.$store.state.route.path,
          query: Object.assign({}, this.$store.state.route.query, { page })
        });
      }
    },

    mounted(){

      // setInterval(() => {
      //   this.fetchSubmissions();
      // }, 10000);

      console.log(this.$store.state.route.params);
      console.log(this.$store.state.route.query);
    }
  };
</script>