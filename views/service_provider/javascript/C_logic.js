function show_password(){
   const img=document.getElementById('show_password');
   const password_field=document.getElementById('password');
   img.addEventListener('click',function show_password(){
        if(img.src=="http://localhost:4000/hide.png" && password_field.type=="password"){
            password_field.type="text";
            img.src="http://localhost:4000/show.png"
        }
        else{
            password_field.type="password";
            img.src="http://localhost:4000/hide.png";
        }
   })
}
show_password();

//Function To show the alert on the client side
function Show_alert(){
   const msg=document.getElementById('alert')
   if(msg.firstChild.innerText==''){
        msg.style.display='none'
   }
   else{
    msg.style.display='block';
   }
   setTimeout(() => {
        if(msg.style.display=="block" && msg.firstChild.innerText!=''){
            msg.style.display='none';
            msg.style.transition="ease 0.4s";
            msg.firstChild.innerText='';
        }
   }, 4000);
}
Show_alert();