import swal from 'sweetalert2';


export default function(title, text){
  return swal({
    html: `
      <div class="swal-confirm">
        <h6>${title}</h6>
        <p>${text}</p>
      </div>
    `,
    showCancelButton: true
  });
};


//
// show confirmation alert with a input field to confirm
//
export function ConfimRestrict(
  title = 'DELETE',
  text = 'This action CANNOT be undone.',
  confirmField = '',
  confirmButtonText = 'I understand the consequences, delete this'
){

  return new Promise((resolve, reject) => {

    swal({
      html: `
        <div class="swal-confirm">
          <h6>${title}</h6>
          <p class="mb-2">${text}</p>
          <p class="mb-1">Please type in the name of the ${confirmField} to confirm.</p>
          <input type="password" value="" class="swal-confirm-input" >
        </div>
      `,
      confirmButtonText: confirmButtonText,
      confirmButtonColor: '#dc3545',
      showCancelButton: true
    })
      .then(() => {
        let el = document.querySelector('.swal-confirm-input');
        return !el ? resolve(null) : resolve(el.value);
      })
      .catch(() => {
        return reject();
      });
  });
};
