<template>
  <div class="row mt-4">

    <div class="col-md-12" v-if="!!error">
      <b-alert variant="danger" :show="!!error">
        {{ error }}
      </b-alert>
    </div>

    <div class="col-md-12" v-else>

      <div class="d-flex justify-content-between mb-2">
        <button class="btn btn-sm btn-iconic btn-primary" @click="showAddModal">
          <i class="material-icons mr-1">person_add</i> Add Participant
        </button>
        <div class="d-flex">
          <button @click="download" class="btn btn-sm btn-iconic btn-outline-primary mr-2">
            <i class="material-icons mr-1">file_download</i> Download CSV
          </button>
          <button @click="deleteAll" class="btn btn-sm btn-iconic btn-outline-danger">
            <i class="material-icons mr-1">delete</i> Delete All
          </button>
        </div>
      </div>

      <loading-data :loading="loading">

        <b-table
        :items="users"
        :fields="fields"
        class="table-gray mb-3"
        >

          <template slot="index" scope="participant">{{ participant.index + 1 }}</template>
          <template slot="username" scope="participant">
            {{ participant.value }}
          </template>
          <template slot="name" scope="participant">
            {{ participant.value }}
          </template>
          <template slot="password" scope="participant">
            {{ participant.value }}
          </template>
          <template slot="institute" scope="participant">
            {{ participant.value }}
          </template>

          <template slot="action" scope="participant">
            <div class="d-flex">
              <button v-tooltip="'Edit'" @click="editIt(participant.item)" class="btn btn-sm btn-iconic btn-outline-primary mr-1">
                <i class="material-icons">mode_edit</i>
              </button>
              <button v-tooltip="'Remove'" @click="removeIt(participant.item)" class="btn btn-sm btn-iconic btn-outline-danger">
                <i class="material-icons">delete</i>
              </button>
            </div>
          </template>

        </b-table>

        <template v-if="pagination && pagination.total !== null">
          <b-pagination
          size="sm"
          :total-rows="pagination.total"
          v-model="cur_page"
          :per-page="pagination.page_limit"
          ></b-pagination>
        </template>

      </loading-data>





  

  <!-- edit modal -->
  <b-modal
  id="editModal"
  ref="editModal"
  size="sm"
  no-close-on-esc
  no-close-on-backdrop
  >

    <div slot="modal-title">
      <h6 class="btn-iconic p-0">
        <i class="material-icons mr-1">edit</i> Edit Participant
      </h6>
    </div>

    <loading-data :loading="submitting">

    <form @submit.stop.prevent="submit('ec-form')" name="ec-form" data-vv-scope="ec-form">

      <div class="form-bundle mb-3">
        <label>Name</label>
        <input
        type="text" v-model="edituser.name"
        :class="[ 'form-control', formError.has('ec-form.name') ? 'is-invalid' : '' ]"
        placeholder="Name"
        data-vv-name="name"
        v-validate="'min:3|max:250|required'"
        >
        <span v-show="formError.has('ec-form.name')" class="invalid-feedback">{{ formError.first('ec-form.name') }}</span>
      </div>

      <div class="form-bundle mb-3">
        <label>Username</label>
        <input
        type="text" v-model="edituser.username" class="form-control" placeholder="username"
        data-vv-name="username"
        :class="[ 'form-control', formError.has('ec-form.username') ? 'is-invalid' : '' ]"
        v-validate="'min:5|max:20|alpha_dash|required'"
        data-vv-delay="1000"
        >
        <span v-show="formError.has('ec-form.username')" class="invalid-feedback">{{ formError.first('ec-form.username') }}</span>
      </div>

      <div class="form-bundle mb-3">
        <label>Password</label>
        <input
        type="text" v-model="edituser.password" class="form-control" placeholder="Password"
        :class="[ 'form-control', formError.has('ec-form.password') ? 'is-invalid' : '' ]"
        data-vv-name="password"
        v-validate="'min:6|max:30|required'"
        >
        <span v-show="formError.has('ec-form.password')" class="invalid-feedback">{{ formError.first('ec-form.password') }}</span>
      </div>

      <div class="form-bundle mb-3">
        <label>Institute</label>
        <input
        type="text" v-model="edituser.institute" class="form-control" placeholder="Name"
        :class="[ 'form-control', formError.has('manual-form.institute') ? 'is-invalid' : '' ]"
        data-vv-name="institute"
        v-validate="'max:50'"
        >
        <span v-show="formError.has('ec-form.institute')" class="invalid-feedback">{{ formError.first('ec-form.institute') }}</span>
      </div>

      <div class="form-bundle">
        <button class="btn btn-primary btn-sm">SUBMIT</button>
      </div>

    </form>

    </loading-data>


  <div slot="modal-footer"></div>
  </b-modal>




  <!-- ----- add modal  -->
  <b-modal
  id="addModal"
  ref="addModal"
  :size="random ? 'md' : 'sm'"
  no-close-on-esc
  no-close-on-backdrop
  >

    <div slot="modal-title">
      <h6 class="btn-iconic p-0">
        <i class="material-icons mr-1">person_add</i> Add Participant
        <toggle-button
        data-toggle="tooltip" data-placement="bottom" title="RANDOM"
        @change="random = $event.value"
        :value="true"
        :width="80"
        :height="23"
        :color="toggleColor"
        :labels="{ checked: 'AUTO', unchecked: 'MANUAL' }"
        class="ml-2"
        />
      </h6>
    </div>



    <loading-data :loading="submitting">


    <!-- manualy add user -->
    <div key="manual" v-show="!random">
      <form @submit.stop.prevent="submit('manual-form')" name="manual-form" data-vv-scope="manual-form">

        <div class="form-bundle mb-3">
          <label>Name</label>
          <input
          type="text" v-model="genuser.name" placeholder="Name"
          :class="[ 'form-control', formError.has('manual-form.name') ? 'is-invalid' : '' ]"
          data-vv-name="name"
          v-validate="'min:3|max:250|required'"
          >
          <span v-show="formError.has('manual-form.name')" class="invalid-feedback">{{ formError.first('manual-form.name') }}</span>
        </div>

        <div class="form-bundle mb-3">
          <label>Username</label>
            <input
              type="text" v-model="genuser.username" class="form-control" placeholder="username"
              data-vv-name="username"
              :class="[ 'form-control', formError.has('manual-form.username') ? 'is-invalid' : '' ]"
              v-validate="'min:5|max:20|alpha_dash|required|verify_exists'"
              data-vv-delay="1000"
            >
            <span v-show="formError.has('manual-form.username')" class="invalid-feedback">{{ formError.first('manual-form.username') }}</span>
        </div>

        <div class="form-bundle mb-3">

          <toggle-button
            data-toggle="tooltip" data-placement="bottom" title="RANDOMPASS"
            @change="genuser.random = $event.value"
            :value="true"
            :width="140"
            :height="23"
            :color="toggleColor"
            :labels="{ checked: 'RANDOM PASSWORD', unchecked: 'INPUT PASSWORD' }"
            :class="[ genuser.random ? '' : 'mb-2' ]"
          />

          <div v-if="!genuser.random">
            <input
              type="text" v-model="genuser.password" class="form-control" placeholder="Password"
              :class="[ 'form-control', formError.has('manual-form.password') ? 'is-invalid' : '' ]"
              data-vv-name="password"
              v-validate="'min:6|max:30'"
            >
            <span v-show="formError.has('manual-form.password')" class="invalid-feedback">{{ formError.first('manual-form.password') }}</span>
          </div>

        </div>

        <div class="form-bundle mb-3">
          <label>Institute</label>
          <input
          type="text" v-model="genuser.institute" class="form-control" placeholder="Name"
          :class="[ 'form-control', formError.has('manual-form.institute') ? 'is-invalid' : '' ]"
          data-vv-name="institute"
          v-validate="'max:50'"
          >
          <span v-show="formError.has('manual-form.institute')" class="invalid-feedback">{{ formError.first('manual-form.institute') }}</span>
        </div>

        <div class="form-bundle">
          <button class="btn btn-primary btn-sm">SUBMIT</button>
        </div>

      </form>
    </div>


    <div key="random" v-show="random">
      <form @submit.stop.prevent="randomSubmit('random-form')" name="random-form" data-vv-scope="random-form">

        <div class="form-bundle mb-4">

          <toggle-button
          data-toggle="tooltip" data-placement="bottom" title="total"
          @change="randomgen.file = $event.value"
          :value="false"
          :height="20"
          :width="40"
          />
          <label>Upload CSV File</label>

          <div class="row mt-3">

            <div class="col-md-12" v-if="randomgen.file">

              <b-form-file id="userFIle"
              v-model="randomgen.csv"
              data-vv-name="csv"
              :no-drop="true"
              ></b-form-file>
              <span v-show="formError.has('random-form.csv')" class="feedback-danger">{{ formError.first('random-form.csv') }}</span>

              <p class="m-0 mt-2 small-text">* Only contains two columns, <strong>name</strong> and <strong>institute</strong> respectively.</p>
              <p class="m-0 small-text">* Include column headers: <strong>name</strong> and <strong>institute</strong> respectively.</p>
              <p class="m-0 small-text">* Contains not more than <strong>150 rows.</strong></p>
              <p class="small-text">* File maximum size <strong>15kB</strong>.</p>
            </div>

            <div class="col-md-6" v-else>
              <label>Number of participants to generate</label>
              <input
              type="text" v-model="randomgen.total" placeholder="Total"
              :class="[ 'form-control', formError.has('random-form.randcount') ? 'is-invalid' : '' ]"
              data-vv-name="randcount"
              v-validate="'required|numeric|min_value:0|max_value:50'"
              >
              <span v-show="formError.has('random-form.randcount')" class="invalid-feedback">{{ formError.first('random-form.randcount') }}</span>
            </div>

          </div>

        </div>


        <div class="form-bundle mb-4">
          <label>Username</label>

          <div class="row mb-1">

            <div class="col-md-4 pr-1">
              <label>Prefix</label>
              <input
              type="text" v-model="randomgen.prefix" placeholder="prefix"
              :class="[ 'form-control', formError.has('random-form.prefix') ? 'is-invalid' : '' ]"
              data-vv-name="prefix"
              v-validate="'required|min:4|max:12'"
              >
              <span v-show="formError.has('random-form.prefix')" class="invalid-feedback">{{ formError.first('random-form.prefix') }}</span>
            </div>

            <div>
              <div class="icon-hash"><i class="material-icons">remove</i></div>
            </div>

            <div class="col-md-4 pl-1">
              <label class="mr-2">Suffix</label>
              <toggle-button
              data-toggle="tooltip" data-placement="bottom" title="suffix"
              @change="randomgen.suffix.number = $event.value"
              :value="true"
              :width="80"
              :height="23"
              :color="toggleColor"
              :labels="{ checked: 'NUMBER', unchecked: 'RANDOM' }"
              />

              <input v-if="randomgen.suffix.number"
              type="text" v-model="randomgen.suffix.from" placeholder="starting from"
              :class="[ 'form-control', formError.has('random-form.suffix') ? 'is-invalid' : '' ]"
              data-vv-name="suffix"
              v-validate="'required|numeric|min_value:1|max_value:1000000'"
              >
              <span v-show="formError.has('random-form.suffix')" class="invalid-feedback">{{ formError.first('random-form.suffix') }}</span>

            </div>

          </div>
          <p class="m-0 small-text">* Username will be: <strong>prefix_suffix</strong></p>
          <p class="m-0 small-text">* If sufix is number, then it will be auto incremental</p>
          <p class="small-text">* Example: icpc2017_team_1, icpc2017_team_2, where icpc2017_team is prefix.</p>
        </div>


        <div class="form-bundle">
          <button class="btn btn-primary btn-sm">SUBMIT</button>
        </div>

      </form>
    </div>

    </loading-data>

    <div slot="modal-footer"></div>
  </b-modal>


    </div>
  </div>
</template>

<script type="text/javascript">

  import DownloadHandler from '@/lib/DownloadHandler';
  import Confim, { ConfimRestrict } from '@/lib/ConfirmSwal';
  import noop from '@/lib/noop';
  import { Validator } from 'vee-validate';
  import has from 'has';

  export default {
    name: 'EditContestants',

    data(){
      return {
        random: true,
        randcount: null,
        randomgen: {
          total: null,
          file: false,
          csv: null,
          prefix: null,
          suffix: {
            number: true,
            from: null
          }
        },
        genuser: {
          random: false
        },
        edituser: {},
        currentUsename: null,
        users: null,
        pagination: null,
        fields: {
          index: {
            label: '#',
            thStyle: { width: '2%' }
          },
          username: {
            label: 'Username',
            thStyle: { width: '10%' }
          },
          name: {
            label: 'Name',
            thStyle: { width: '10%' }
          },
          password: {
            label: 'Password',
            thStyle: { width: '10%' }
          },
          institute: {
            label: 'Institute',
            thStyle: { width: '10%' }
          },
          action: {
            label: 'Action',
            thStyle: { width: '3%' }
          }
        },
        toggleColor: {
          checked: '#447DF7',
          unchecked: '#8639ac'
        },
        submitting: false,
        error: null,
        loading: null
      };
    },

    computed: {
      contestId(){
        return this.$store.state.route.params.cid;
      },
      cur_page(){
        return has(this.$store.state.route.query,'page')
          ? parseInt(this.$store.state.route.query.page)
          : 1;
      }
    },

    methods: {
      fetchUsers(){
        this.$http
          .get(`/api/contest/edit/${this.contestId}/users?page=${this.cur_page}`)
          .then(response => {
            this.users = response.data.users;
            this.pagination = response.data.pagination;
          })
          .catch(this.handleError);
      },
      download(){
        this.$http
          .get(`/api/contest/edit/${this.contestId}/users/download`)
          .then(DownloadHandler)
          .catch(this.handleError);
      },
      removeIt(participant){
        Confim('DELETE PARTICIPANT')
          .then(confirmText => {
            this.$http
              .delete(`/api/contest/edit/${this.contestId}/users?user=${participant.id}`)
              .then(()=>{
                this.$noty.success('Participant removed');
                this.fetchUsers();
              })
              .catch(this.handleError);
          }).catch(noop);
      },
      deleteAll(){
        ConfimRestrict(
          'DELETE ALL PARTICIPANTS',
          'This will delete everything related to every user and CANNOT be undone.',
          'Contest Id from url'
          )
          .then(confirmText => {
            if( confirmText !== this.contestId ){
              this.$noty.error('Contest Id Doesn\'t Match');
              return;
            }
            this.$http
              .delete(`/api/contest/edit/${this.contestId}/users?user=all`)
              .then(()=>{
                this.$noty.success('All Participants removed');
                this.fetchUsers();
              })
              .catch(this.handleError);
          }).catch(noop);
      },
      editIt(participant){
        this.formError.items = [];
        this.currentUsename = participant.username;
        this.edituser = Object.assign({}, participant);
        this.$refs.editModal.show();
      },
      showAddModal(){
        this.formError.items = [];
        this.$refs.addModal.show();
      },
      randomSubmit(scope){
        this.formError.items = [];

        // if( this.randomgen.file && !this.validateFile(this.randomgen.csv, scope) ){
        //   return;
        // }

        this.$validator
          .validateAll(scope)
          .then(result => {
            if(!result){
              return;
            }

            console.log(this.randomgen);

            let postData;
            let api;

            if( this.randomgen.file ){
              //csv file uploaded
              postData = new FormData();
              postData.append('csv', this.randomgen.csv);
              postData.append('prefix', this.randomgen.prefix);

              if( this.randomgen.suffix.number ){
                postData.append('suffix', this.randomgen.suffix.from);
              }

              console.log(postData);

              api = this.$http.post(`/api/contest/edit/${this.contestId}/users/gen`, postData, {
                headers: {
                  'Content-Type': 'multipart/form-data; charset=UTF-8'
                }
              });
            }
            else{
              //json request
              postData = {
                prefix: this.randomgen.prefix,
                total: this.randomgen.total
              };

              if( this.randomgen.suffix.number ){
                postData.suffix = this.randomgen.suffix.from;
              }

              api = this.$http.post(`/api/contest/edit/${this.contestId}/users/gen`, postData);
            }

            api
              .then(response => {
                this.$noty.success('yo');
              })
              .catch(err => {
                this.$noty.error(this.getApiError(err));
              });
          });
      },
      submit(scope){

        this.$validator
          .validateAll(scope)
          .then(result => {
            if(!result){
              return;
            }

            let update = scope === 'ec-form';

            //add new
            if( !update ){
              return this.manualSubmit(this.genuser, update);
            }

            //no need to update same username
            if( this.currentUsename === this.edituser.username ){
              delete this.edituser.username;
              console.log('after delete');
              console.log(this.edituser);
              return this.manualSubmit(this.edituser, update);
            }

            //validate if username exists
            const nameValidator = new Validator();

            nameValidator.attach('username', 'verify_exists', scope);
            nameValidator
              .validate('username', this.edituser.username)
              .then(notexists => {

                nameValidator.detach('username');

                if(notexists){
                  return this.manualSubmit(this.edituser, update);
                }

                this.formError.add('username', 'username already exists', '', scope);
              });
          });
      },
      manualSubmit(data, update){
        this.submitting = true;

        let api = update
          ? this.$http.put(`/api/contest/edit/${this.contestId}/users`, data)
          : this.$http.post(`/api/contest/edit/${this.contestId}/users`, data);

        api
          .then(response => {
            this.closeModal(update);
            this.$noty.success(`Participant ${ update ? 'updated' : 'added' }`);
            this.fetchUsers();
          })
          .catch(err => {
            this.closeModal(update);
            this.handleError(err);
          });
      },
      handleError(err){
        switch (err.response.status) {
          case 401:
            this.$store.commit('LOG_OUT');
            this.$router.replace({ path: '/login' });
            break;
          case 400:
            this.$noty.error(this.getApiError(err));
            break;
          default:
            this.error = this.getApiError(err);
        };
      },
      closeModal(update){
        this.submitting = false;
        if( update ){
          this.$refs.editModal.hide();
        }else{
          this.$refs.addModal.hide();
        }
      },
      validateFile(theFile, scope = null){
        if( !theFile ){
          this.formError.add('csv', 'file required', '', scope);
          return false;
        }
        if( Math.ceil(parseInt(theFile.size)/1000) > 15 ){
          this.formError.add('csv', 'The file field must be less than 16 KB.', '', scope);
          return false;
        }
        if( theFile.type.indexOf('text/plain') < 0 && theFile.type.indexOf('text/csv') < 0 ){
          this.formError.add('csv', 'The file must have a valid csv file type.', '', scope);
          return false;
        }
        return true;
      }
    },

    watch: {
      '$route': 'fetchUsers',
      cur_page: function (page) {
        this.$router.push({
          path: this.$store.state.route.path,
          query: { page: page }
        });
      }
    },

    mounted(){
      this.genuser.random = true;
      this.fetchUsers();


      console.log(this.$store.state.route.params);
    }
  };
</script>