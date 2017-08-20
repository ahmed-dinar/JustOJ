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

          <div class="d-flex justify-content-between mb-3">
            <h6 class="p-0 btn-iconic btn-iconic-default">
              <i class="material-icons mr-1">question_answer</i> Clarifications
            </h6>
            <router-link :to="`/contests/${params.cid}/${params.slug}/clar/request`" class="btn btn-xs btn-primary btn-iconic">
              <i class="material-icons mr-1">chat_bubble</i> Request
            </router-link>
          </div>

          <div class="card">
            <div class="list-group" v-if="clars && clars.length">
              <router-link v-for="clar in clars" :key="clar.id" :to="`/contests/${params.cid}/${params.slug}/clar/${clar.id}`" class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ clar.title }}</h5>
                  <small>{{ clar.status }}</small>
                </div>
                <p class="mb-1">{{ clar.request }}</p>
              </router-link>
            </div>
            <div class="text-muted text-center p-3" v-else>
              No clarification
            </div>
          </div>

          <div class="d-flex justify-content-between" v-if="clars && clars.length && pagination && pagination.total !== null">
            <small>Showing {{ clars ? clars.length : '0' }} of {{ pagination.total }} entries</small>
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
          </div>

      </div>

      <div class="col-md-3 pr-0 mt-4">
        <div class="form-bundle">
        <label for="inputLanguage">Problem</label>
          <b-form-select
          v-model="selected" id="inputLanguage" :options="problems" class="mb-3"
          ></b-form-select>
        </div>
      </div>

    </div>
  </loading-data>

</div>
</template>

<script>

  import contestMixin from '@/mixins/contest';
  import has from 'has';

  export default {
    name: 'Clarifications',
    mixins: [ contestMixin ],

    data () {
      return {
        contest: null,
        clars: null,
        pagination: null,
        loading: true,
        cur_page: 1,
        error: null,
        selected: null,
        problems: [
          {
            text: 'C',
            value: 'c'
          },
          {
            text: 'C++',
            value: 'cpp'
          }
        ],
        pg: {
          next: '<i class="material-icons md-18">keyboard_arrow_right</i>',
          prev: '<i class="material-icons md-18">keyboard_arrow_left</i>',
          first: '<i class="material-icons md-18">first_page</i>',
          last: '<i class="material-icons md-18">last_page</i>'
        }
      };
    },

    methods: {
      fetchClars(){
        this.loading = true;
        progressbar.start();

        console.log(this.$store.state.route.query);

        this.$http
          .get(`/api/contest/${this.params.cid}/clars`)
          .then(response => {
            console.log(response.data);
            this.contest = response.data.contest;
            this.contest.id = this.params.cid;
            this.clars = response.data.clars;
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
      '$route': 'fetchClars',
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
      this.fetchClars();
    }
  };
</script>
