<template>
  <div>
    <div v-if="!!error">
      {{ error }}
    </div>

    <loading-data :loading="loading" v-else>
      <contest-navbar :contest="contest" :id="this.params.cid" class="mb-4"></contest-navbar>

      <div class="row mt-3">

        <div class="col-md-9 problem-content-wrapper pl-4">
          <template v-if="problem">
            <h5 class="pt-3 mb-1">{{ problem.title }}</h5>
            <p class="mb-4 limit-text">Limits: <span>{{ roundTo(problem.cpu) }}s, {{ problem.memory }} MB</span></p>

            <div class="problem-content" v-html="problem.statement"></div>
            <h6 class="mt-4">Samples</h6>
            <table class="table">
              <tbody>
                <tr>
                  <td><pre>{{ problem.input }}</pre></td>
                  <td><pre>{{ problem.output }}</pre></td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>

        <div class="col-md-3 pr-0" v-if="problem && joined">

          <div class="w-100 mt-5 mb-5">
            <form @submit.prevent="submit()" name="submit-form">
              <div class="p-0">

                <p class="mb-1 btn-iconic pl-0">
                  <strong><i class="material-icons">near_me</i> Submit</strong>
                </p>

                <div class="p-1">
                  <div class="form-bundle">
                    <label for="inputLanguage">Languge</label>
                    <b-form-select
                    v-model="language" id="inputLanguage" :options="languages" class="mb-3"
                    ></b-form-select>
                  </div>

                  <div class="form-bundle">
                    <label for="solutionFile">Source</label>
                    <b-form-file
                    ref="solutionFile"
                    name="solutionFile" choose-label="Source..." id="source"
                    ></b-form-file>
                  </div>

                  <div class="form-bundle mt-3">
                    <submit-button css="btn btn-sm btn-primary" color="#fff" :submitting="submitting"></submit-button>
                  </div>

                </div>
              </div>

            </form>
          </div>


          <!-- My Submissions -->
          <div class="w-100">

            <p class="mb-1 btn-iconic btn-iconic-sm pl-0 ">
              <strong><i class="material-icons">equalizer</i> My Submissions</strong>
            </p>

            <div class="p-1">
              <loading-pulse :loading="subsLoading" css="" size="7px">
                <template v-if="submissions && submissions.length">

                  <m-table striped
                  :items="submissions"
                  :fields="subsFields"
                  class="runs-table-sm"
                  keyIdentifier="submittime"
                  >
                    <template slot="submittime" scope="sub">
                      {{ fromWhen(sub.value) }}
                    </template>
                    <template slot="language" scope="sub">
                      {{ getRunLang(sub.value) }}
                    </template>
                    <template slot="status" scope="sub">
                      <b-badge :variant="statusVariant(sub.value)" :title="getRunStatus(sub.value)">
                        {{  getRunStatus(sub.value) }}
                      </b-badge>
                    </template>
                  </m-table>

                  <div class="d-flex justify-content-between">
                    <span></span>
                    <router-link :to="`/contests/${params.cid}/${params.slug}/submissions?problem=${params.pid}&user=${getUser.username}`"
                    class="btn btn-outline-secondary btn-xs pull-right"
                    >view all</router-link>
                  </div>

                </template>

                <div class="text-center" v-else>
                  <small class="text-muted">No submissions found</small>
                </div>

              </loading-pulse>
            </div>
          </div>


        </div>


      </div>

    </loading-data>
  </div>
</template>

<script>

  import { mapGetters } from 'vuex';
  import contestMixin from '@/mixins/contest';
  import runStatus from '@/lib/runStatus';
  import runLanguage from '@/lib/runLanguage';
  import moment from 'moment';

  export default {
    name: 'ContestProblems',
    mixins: [ contestMixin ],

    data () {
      return {
        contest: null,
        problem: null,
        loading: true,
        error: null,
        submitting: false,
        subsLoading: true,
        submissions: null,
        language: 'c',
        languages: [
          {
            text: 'C',
            value: 'c'
          },
          {
            text: 'C++',
            value: 'cpp'
          }
        ],
        subsFields: {
          submittime: {
            label: 'when',
            tdClass: ['ellipsis','view-sub-cell']
          },
          language: {
            label: 'lang'
          },
          status: {
            label: 'status',
            tdClass: ['ellipsis','view-sub-cell']
          }
        }
      };
    },

    computed: {
      ...mapGetters([
        'getUser'
      ])
    },

    methods: {
      submit(){
        if(this.submitting){
          return;
        }

        let sourceFile = document.getElementById('source').files;
        if( !sourceFile.length ){
          this.$noty.warning('source required', { timeout: false });
          return;
        }

        var postData = new FormData();
        postData.append('language', this.language);
        postData.append('source', sourceFile[0]);

        this.submitting = true;
        this.error = null;
        progressbar.start();

        this.$http
          .post(`/api/contest/${this.params.cid}/p/${this.params.pid}`, postData, {
            headers: {
              'Content-Type': 'multipart/form-data; charset=UTF-8'
            }
          })
          .then(response => {
            this.$noty.success('solution submitted');
            this.formDone();
            this.resetForm();
            this.fetchSubs();
          })
          .catch(err => {
            switch (err.response.status) {
              case 400:
              case 404:
                this.$noty.warning(this.getApiError(err), { timeout: false });
                break;
              default:
                this.error = this.getApiError(err);
                this.$noty.error(this.error);
            }
            this.formDone();
          });
      },

      fetchProblem(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/contest/${this.params.cid}/p/${this.params.pid}`)
          .then(response => {
            console.log(response.data);

            this.contest = response.data.contest;
            this.contest.id = this.params.cid;
            this.problem = response.data.problem;
            this.done(null);
            this.fetchSubs();
          })
          .catch(err=>{
            this.done(this.getApiError(err));

            this.$noty.warning(this.error);
            if( err.response.status === 302 ){
              this.$router.replace(`/contests/${this.params.cid}/${this.params.slug}`);
            }
          });
      },
      fetchSubs(){
        this.subsLoading = true;
        this.$http
          .get(`/api/contest/${this.params.cid}/submissions?user=${this.getUser.username}&problem=${this.params.pid}&limit=5`)
          .then(response => {
            console.log(response.data);
            this.submissions = response.data.subs;
            this.subsLoading = false;
          })
          .catch(err=>{
            this.subsLoading = false;
            this.$noty.warning(this.getApiError(err));
          });
      },
      resetForm(){
        //this.language = 'c';
        //this.$refs.solutionFile.reset();
      },
      formDone(){
        this.loading = false;
        this.submitting = false;
        progressbar.done();
        progressbar.remove();
      },
      done(err){
        progressbar.done();
        progressbar.remove();
        this.error = err;
        this.loading = false;
      },
      roundTo(num) {
        if( !num || num === undefined ){
          return '0.00';
        }
        num = parseFloat(parseInt(num)/1000.0);
        num = num.toString();
        return (num.indexOf('.') > -1 ? num+'00' : num+'.00').match(/^-?\d+(?:\.\d{0,2})?/)[0];
      },
      fromWhen(time){
        return moment(time).from();
      },
      getRunLang(lang){
        return runLanguage[lang];
      },
      getRunStatus(status){
        return runStatus[parseInt(status)];
      },
      statusVariant(code){
        code = parseInt(code);
        switch(code){
          case 0:
            return 'success';
          case 5:
            return 'secondary';
          case 6:
            return 'info';
          case 8:
            return 'warning';
          default:
            return 'danger';
        }
      }
    },

    mounted(){
      this.fetchProblem();
    }
  };
</script>
