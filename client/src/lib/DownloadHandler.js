

export default function(response){
  //https://stackoverflow.com/a/35851873/4839437

  let blob = new Blob([response.data],{
    type: response.headers['content-type']
  });

  let link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'participantsList.csv';
  link.click();
}