<template>
  <div>
    <div v-if="!!error">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
    </div>

    <loading-data :loading="loading" v-else>
      <contest-navbar :contest="contest" :id="this.params.cid" class="mb-4"></contest-navbar>

      <div class="row">
        <div class="col-md-9">

          <h6 class="p-0 mb-3 btn-iconic text-secondary">
            <i class="material-icons mr-1">assessment</i> Submissions
          </h6>

          <m-table
          :items="submissions"
          :fields="fields"
          keyIdentifier="submittime"
          show-empty
          class="submission-table table-gray mb-5"
          >
            <template slot="id" scope="sub">
              <router-link :to="`/contests/${params.cid}/${params.slug}/submissions/${sub.value}`" >
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
              <router-link v-tooltip="sub.value" :to="`/contests/${params.cid}/${params.slug}/p/${sub.item.pid}/${sub.item.slug}`" >
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

          <div class="d-flex justify-content-between" v-if="submissions && submissions.length && pagination && pagination.total !== null">
            <small><!-- Showing {{ submissions ? submissions.length : '0' }} of {{ pagination.total }} entries --></small>
            <b-pagination
            size="sm"
            :total-rows="pagination.total"
            v-model="cur_page"
            :per-page="pagination.page_limit"
            :next-text="pg.next"
            :prev-text="pg.prev"
            :first-text="pg.first"
            :last-text="pg.last"
            ></b-pagination>
            <small></small>
          </div>

      </div>
      <div class="col-md-3">
      </div>

    </div>
  </loading-data>

</div>
</template>

<script>

  import contestMixin from '@/mixins/contest';
  import submissionMixin from '@/mixins/submission';
  import has from 'has';

  export default {
    name: 'ContestSub',
    mixins: [ contestMixin, submissionMixin ],

    data () {
      return {
        contest: null,
        submissions: null,
        pagination: null,
        loading: true,
        cur_page: 1,
        error: null,
        fields: {
          id: {
            label: '#',
            tdClass: ['ellipsis','subs-index-cell']
          },
          submittime: {
            label: 'When',
            tdClass:['cell-when']
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
        },
        pg: {
          next: '<i class="material-icons md-18">keyboard_arrow_right</i>',
          prev: '<i class="material-icons md-18">keyboard_arrow_left</i>',
          first: '<i class="material-icons md-18">first_page</i>',
          last: '<i class="material-icons md-18">last_page</i>'
        }
      };
    },

    methods: {
      fetchSubs(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/contest/${this.params.cid}/submissions`,{ params: this.$store.state.route.query })
          .then(response => {
            console.log(response.data);
            this.contest = response.data.contest;
            this.contest.id = this.params.cid;
            this.submissions = response.data.subs;
            this.pagination = response.data.pagination;
            this.done(null);
          })
          .catch(err=>{
            this.done(this.getApiError(err));
            this.$noty.warning(this.error);
            if( err.response.status === 302 ){
              this.$router.replace(`/contests/${this.params.cid}/${this.params.slug}`);
            }
          });
      },
      done(err){
        progressbar.done();
        progressbar.remove();
        this.error = err;
        this.loading = false;
      }
    },

    watch: {
      '$route': 'fetchSubs',
      cur_page: function (page) {
        this.$router.push({
          path: this.$store.state.route.path,
          query: Object.assign({}, this.$store.state.route.query, { page })
        });
      }
    },

    mounted(){
      this.cur_page = has(this.$store.state.route.query,'page')
        ? parseInt(this.$store.state.route.query.page)
        : 1;
      this.fetchSubs();
    }
  };
</script>
