<template>
  <div class="row mt-4">

    <div class="col-md-12" v-if="!!error">
      <b-alert variant="danger" :show="!!error">
        {{ error }}
      </b-alert>
    </div>

    <div class="col-md-12" v-else>

      <div class="d-flex justify-content-between mb-2">
        <button class="btn btn-sm btn-iconic btn-primary" v-b-modal.addModal>
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

      <b-table
      :items="users"
      :fields="fields"
      class="table-gray"
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



  <!-- ----- modal  -->
  <b-modal
  id="addModal"
  ref="addModal"
  :size="random ? 'sm' : 'sm'"
  no-close-on-esc
  no-close-on-backdrop
  >

    <div slot="modal-title">
      <h6 class="btn-iconic p-0">
        <i class="material-icons mr-1">person_add</i> Add Participant
      </h6>
    </div>

    <toggle-button
    data-toggle="tooltip" data-placement="bottom" title="RANDOM"
    @change="random = $event.value"
    :value="true"
    :width="80"
    :height="23"
    :color="toggleColor"
    :labels="{ checked: 'RANDOM', unchecked: 'MANUAL' }"
    class="mb-4"
    />

    <loading-data :loading="submitting">

    <div key="random" v-show="random">
      <form @submit.stop.prevent="randomSubmit('random-form')" name="random-form" data-vv-scope="random-form">

        <div class="form-bundle mb-3">
          <label>Total user to generate</label>
          <div :class="{ 'has-danger': formError.has('random-form.randcount')} ">
            <input
              type="text" v-model="randcount" class="form-control" placeholder="Total"
              name="randcount"
              v-validate="'required|numeric|min_value:0|max_value:50'"
            >
            <span v-show="formError.has('random-form.randcount')" class="help form-control-feedback">
              {{ formError.first('random-form.randcount') }}
            </span>
          </div>
        </div>

        <div class="form-bundle">
          <button class="btn btn-primary btn-sm">SUBMIT</button>
        </div>

      </form>
    </div>

    <div key="manual" v-show="!random">
      <form @submit.stop.prevent="manualSubmit('manual-form')" name="manual-form" data-vv-scope="manual-form">

        <div class="form-bundle mb-3">
          <label>Name</label>
          <div :class="{ 'has-danger': formError.has('manual-form.name')} ">
            <input
              type="text" v-model="genuser.name" class="form-control" placeholder="Name"
              name="name"
              v-validate="'min:3|max:250|required'"
            >
            <span v-show="formError.has('manual-form.name')" class="help form-control-feedback">
              {{ formError.first('manual-form.name') }}
            </span>
          </div>
        </div>

        <div class="form-bundle mb-3">
          <label>Username</label>
          <div :class="{ 'has-danger': formError.has('manual-form.username')} ">
            <input
              type="text" v-model="genuser.username" class="form-control" placeholder="username"
              name="username"
              v-validate="'min:5|max:20|alpha_dash|required|verify_exists'"
            >
            <span v-show="formError.has('manual-form.username')" class="help form-control-feedback">
              {{ formError.first('manual-form.username') }}
            </span>
          </div>
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

          <div v-if="!genuser.random" :class="{ 'has-danger': formError.has('manual-form.password')} ">
            <input
              type="text" v-model="genuser.password" class="form-control" placeholder="Password"
              name="password"
              v-validate="'min:6|max:30'"
            >
            <span v-show="formError.has('manual-form.password')" class="help form-control-feedback">
              {{ formError.first('manual-form.password') }}
            </span>
          </div>

        </div>

        <div class="form-bundle mb-3">
          <label>Institute</label>
          <div :class="{ 'has-danger': formError.has('manual-form.institute')} ">
            <input
              type="text" v-model="genuser.institute" class="form-control" placeholder="Name"
              name="institute"
              v-validate="'max:50'"
            >
            <span v-show="formError.has('manual-form.institute')" class="help form-control-feedback">
              {{ formError.first('manual-form.institute') }}
            </span>
          </div>
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

  export default {
    name: 'EditContestants',

    data(){
      return {
        random: true,
        randcount: null,
        genuser: {
          random: false
        },
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
      }
    },

    methods: {
      fetchUsers(){
        this.$http
          .get(`/api/contest/edit/${this.contestId}/users`)
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

      },
      randomSubmit(scope){

      },
      manualSubmit(scope){

        this.$validator
          .validateAll(scope)
          .then(result => {
            if(!result){
              return;
            }

            this.submitting = true;

            this.$http
              .post(`/api/contest/edit/${this.contestId}/users`, this.genuser)
              .then(response => {
                this.closeModal();
                this.$noty.success('Participant added');
                this.fetchUsers();
              })
              .catch(err => {
                this.closeModal();
                this.handleError(err);
              });
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
      closeModal(){
        this.submitting = false;
        this.$refs.addModal.hide();
      }
    },

    mounted(){
      this.fetchUsers();
      this.genuser.random = true;

      console.log(this.$store.state.route.params);
    }
  };
</script>