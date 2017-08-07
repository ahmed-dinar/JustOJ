import axios from 'axios';

export default function (role) {
  return axios.get(`/api/auth/role?role=${role}`);
}