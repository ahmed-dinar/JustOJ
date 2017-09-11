<template>
  <div>

    <div class="col-md-12" v-if="!!error">
      <smooth-alert variant="danger" :show="!!error">
        {{ error }}
      </smooth-alert>
    </div>

    <div v-else class="col-md-12 pl-0">

      <div class="col-md-12">
        <smooth-alert variant="danger" :show="!!submitError" dismissible @dismissed="submitError=null">
          {{ submitError }}
        </smooth-alert>
      </div>

      <div class="col-md-12">
        <div class="row">

          <div class="col-md-9 pl-0 mb-2 problem-content-wrapper">
            <loading-data :loading="loading">
              <template v-if="problem">
                <h5 class="pt-3 mb-0">{{ problem.title }}</h5>
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
            </loading-data>
          </div>

          <div class="col-md-3 pr-0">

            <!--Problem Tag List -->
            <div class="w-100 mb-5">
              <p class="mb-1 btn-iconic btn-iconic-sm pl-0">
                  <strong><i class="material-icons">local_offer</i> Tags</strong>
              </p>
              <div class="p-1">
                <loading-pulse :loading="loading" css="" size="7px">
                  <template v-if="tags && tags.length">
                    <template v-for="ptag in tags">
                      <router-link :to="tagLink(ptag)">
                        <b-badge class="tag-badge mr-1">
                          {{ ptag }}
                        </b-badge>
                      </router-link>
                    </template>
                  </template>
                  <div class="text-center" v-else>
                    <small class="text-muted">No Tags Added</small>
                  </div>
                </loading-pulse>
               </div>
            </div>

            <!-- Submit Problem -->
            <div class="w-100 mb-5" v-if="!loading && problem">

              <template v-if="isLoggedIn">
                <form @submit.prevent="submit('submit-form')" name="submit-form">
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
              </template>
              <div class="p-0" v-else>
                <p class="mb-1 btn-iconic pl-0">
                  <strong><i class="material-icons">near_me</i> Submit</strong>
                </p>
                <button class="btn btn-sm btn-primary ml-1" @click="goToLogin">Login</button>
              </div>

            </div>

            <!-- My Submissions -->
            <div class="w-100 mb-4" v-if="isLoggedIn">
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
                      <router-link :to="`/submissions?problem=${params.pid}&user=${getUser.username}`"
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

            <!-- Problem Ranking -->
            <div class="w-100 mb-5">
              <p class="mb-1 btn-iconic btn-iconic-sm pl-0">
                <strong><i class="material-icons">people</i> Rank</strong>
              </p>
              <div class="p-1">
                <loading-pulse :loading="rankLoading" css="" size="7px">
                  <template v-if="ranks && ranks.length">

                    <m-table striped
                    :items="ranks"
                    :fields="rankFields"
                    class="runs-table-sm"
                    keyIdentifier="username"
                    >
                      <template slot="index" scope="rank">
                        {{ rank.index + 1 }}
                      </template>
                      <template slot="username" scope="rank">
                        {{ rank.value }}
                      </template>
                      <template slot="language" scope="rank">
                        {{ getRunLang(rank.value) }}
                      </template>
                      <template slot="cpu" scope="rank">
                        {{  roundTo(rank.value) }}
                      </template>
                    </m-table>

                  </template>
                  <div class="text-center" v-else>
                    <small class="text-muted">Nobody solved yet!</small>
                  </div>
                </loading-pulse>
               </div>
            </div>

          </div>

        </div>
      </div>

    </div>

  </div>
</template>

<script>

  import { mapGetters } from 'vuex';
  import runStatus from '@/lib/runStatus';
  import runLanguage from '@/lib/runLanguage';
  import moment from 'moment';

  export default {
    name: 'ViewProblem',

    data () {
      return {
        rankLoading: true,
        subsLoading: true,
        loading: true,
        problem: null,
        error: null,
        submitError: null,
        submitting: false,
        language: 'c',
        ranks: null,
        submissions: null,
        languages: [
          {
            text: 'C',
            value: 'c'
          },
          {
            text: 'C++',
            value: 'cpp'
          },
          {
            text: 'JAVA 8',
            value: 'java'
          },
          {
            text: 'C++11',
            value: 'cpp11'
          },
          {
            text: 'C++14',
            value: 'cpp14'
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
        },
        rankFields: {
          index: {
            label: '#'
          },
          username: {
            label: 'who',
            tdClass: 'ellipsis'
          },
          language: {
            label: 'lang'
          },
          cpu: {
            label: 'cpu'
          }
        }
      };
    },

    computed: {
      params(){
        return this.$store.state.route.params;
      },
      tags(){
        if(!this.problem || !this.problem.tags){
          return [];
        }
        return this.problem.tags.split(',');
      },
      ...mapGetters([
        'isLoggedIn',
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
          return;
        }

        var postData = new FormData();
        postData.append('language', this.language);
        postData.append('source', sourceFile[0]);

        this.submitting = true;
        this.submitError = null;
        this.error = null;
        progressbar.start();

        this.$http
          .post(`/api/problem/${this.params.pid}`, postData, {
            headers: {
              'Content-Type': 'multipart/form-data; charset=UTF-8'
            }
          })
          .then(response => {
            this.$noty.success('solution submitted');
            this.formDone();
            this.resetForm();
            this.fetchSubmissions();
          })
          .catch(this.handleError);
      },

      fetchProblem(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/problem/${this.params.pid}`)
          .then(response => {
            this.problem = response.data;
            this.formDone();
            if( this.isLoggedIn ){
              this.fetchSubmissions();
            }
            this.fetchRank();
          })
          .catch(this.handleError);
      },

      fetchSubmissions(){
        this.$http
          .get(`/api/problem/submission/u/${this.params.pid}`)
          .then(response => {
            console.log(response.data);
            this.submissions = response.data;
            this.subsLoading = false;
          })
          .catch(err => {
            this.subsLoading = false;
          });
      },

      fetchRank(){
        this.$http
          .get(`/api/problem/rank/${this.params.pid}`)
          .then(response => {
            console.log(response.data);
            this.ranks = response.data;
            this.rankLoading = false;;
          })
          .catch(err => {
            this.rankLoading = false;
          });
      },

      formDone(){
        this.loading = false;
        this.submitting = false;
        progressbar.done();
        progressbar.remove();
      },

      resetForm(){
        //this.language = 'c';
        //this.$refs.solutionFile.reset();
      },

      handleError(err){
        let errors = this.getApiError(err);

        switch (err.response.status) {
          case 400:
          case 404:
            this.submitError = errors;
            this.$noty.error(this.submitError, { timeout: 0 });
            break;
          default:
            this.error = errors;
        }
        this.formDone();
      },

      roundTo(num) {
        if( !num || num === undefined ){
          return '0.00';
        }
        num = parseFloat(parseInt(num)/1000.0);
        num = num.toString();
        return (num.indexOf('.') > -1 ? num+'00' : num+'.00').match(/^-?\d+(?:\.\d{0,2})?/)[0];
      },

      tagLink(tagName){
        return `/problems?tag=${tagName}`;
      },

      getRunStatus(status){
        return runStatus[parseInt(status)];
      },

      getRunLang(lang){
        return runLanguage[lang];
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
      },

      fromWhen(time){
        return moment(time).from();
      },

      goToLogin(){
        window.location.href = `/login?next=${this.$store.state.route.path}`;
      }
    },

    mounted(){


      this.fetchProblem();
    },

    created(){
      console.log(this.$store.state.route.params.pid);
      console.log(this.$store.state.route.params.slug);
    }
  };
</script>

