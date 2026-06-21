//refreshtoken app

// export const refreshtokenrequest = () => ({
//   type: 'REFRESH_TOKEN_REQUEST',
// });

// export const refreshtokensuccessful = data => ({
//   type: 'REFRESH_TOKEN_SUCCESSFUL',
//   payload: data,
// });

// export const refreshtokenfail = error => ({
//   type: 'REFRESH_TOKEN_FAIL',
//   payload: error,
// });







//token check action
export const tokencheck = () => ({
  type: 'TOKEN_CHECK',
 });


 //clear Store

 export const clearstore = ()=>({

  type: 'CLEAR_STORE',

 });



//verifyemail

export const verifyemailrequest = (email) => {
  console.log('Inside verifyemailrequest with email:', email);
  return{
  type: 'VERIFY_EMAIL_REQUEST',
  email,
  //  phone ,

};};


export const verifyemailsuccessful = (data, emailmessege) => ({
  type: 'VERIFY_EMAIL_SUCCESSFUL',
  payload: { data, emailmessege },
});

export const verifyemailfail = emailerror => ({
  type: 'VERIFY_EMAIL_FAIL',
  payload: emailerror,
});

export const clearemaildata = () => ({
  type: 'CLEAR_EMAIL_DATA',
});


//validations


//matchusename

export const matchusernamerequest = (username) => {
   console.log('Inside username verfiy action ', username);
 return {
  type: 'MATCH_USERNAME_REQUEST',
 username,
  //  phone ,

};};


export const matchusernamesuccessful = (data, usernamemessege) => ({
  type: 'MATCH_USERNAME_SUCCESSFUL',
  payload: { data, usernamemessege },
});

export const matchusernamefail = usernameerror => ({
  type: 'MATCH_USERNAME_FAIL',
  payload: usernameerror,
});


export const clearusernameerror = ()=>({

  type:'CLEAR_USERNAME_ERROR',

});

export const clearemailerror = ()=>({

  type:'CLEAR_EMAIL_ERROR',

});


export const clearemailmessege = ()=>({

  type: 'CLEAR_EMAIL_MESSEGE',
});
//matchotp


export const clearusernamemessege = ()=>({

  type: 'CLEAR_USERNAME_MESSEGE',
});




export const matchotprequest = (otp,email) => ({
  type: 'MATCH_OTP_REQUEST',
  otp,
  email,
  //  phone ,

});


export const matchotpsuccessful = (data, matchotpmessege) => ({
  type: 'MATCH_OTP_SUCCESSFUL',
  payload: { data, matchotpmessege },
});

export const matchotpfail = matchotperror => ({
  type: 'MATCH_OTP_FAIL',
  payload: matchotperror,
});




//SignUp
export const signuprequest = (signupData) => {
  console.log('sign up request action',signupData);

  return {
  type: 'SIGNUP_REQUEST',
  payload: signupData,
};};




// console.log('sgnuprequest.signupdata  ------>',signuprequest(signupData))


// // Change this in Redux/action/auth.js
// export const signuprequest = (username, password, email, otp, avatar, storelink, whatsapp, facebook, instagram, bio) => {
//   console.log("sign up request action", {username, password, email, otp, avatar, storelink, whatsapp, facebook, instagram, bio})
//   return {
//     type: 'SIGNUP_REQUEST',
//     username,
//     password,
//     email,
//     otp,
//     avatar,
//     storelink,
//     whatsapp,
//     facebook,
//     instagram,
//     bio
//   };
// };





export const signupsuccessful = (data, messege) => ({
  type: 'SIGNUP_SUCCESSFUL',
  payload: { data, messege },
});

export const signupfail = error => ({
  type: 'SIGNUP_FAIL',
  payload: error,
});





//LOGIN
// export const loginrequest = (username, password) => ({

//   type: 'LOGIN_REQUEST',
//   username,
//   password,
// });

export const loginrequest = (username, password,email) => {
  console.log('username is', username, 'password is :', password);
  return {
    type: 'LOGIN_REQUEST',
    username,
    password,
    email,
  };
};

export const loginsuccessful = (data, messege) => ({
  type: 'LOGIN_SUCCESSFUL',
  payload: { data, messege },
});

export const loginfail = error => ({
  type: 'LOGIN_FAIL',
  payload: error,
});



//LOGOUT


export const logoutrequest = ()=> {

   console.log('Inside logout request');
  return{
  type: 'LOG_OUT_REQUEST',

};

};


export const logoutsuccessful = messege => {
  console.log('messege in action',messege);
  return{

  type: 'LOG_OUT_SUCCESSFUL',

  payload: {
    messege,
  },
};};

export const logoutfails = error => {

  console.log('Inside logout fails');
  console.log(error);
  return{
  type: 'LOG_OUT_FAIL',
  payload: error,
};};





//CHANGE PIN
export const changepasswordrequest = (name, oldpassword, newpassword) => ({
  type: 'CHANGE_PASSWORD_REQUEST',
  name,
  newpassword,
  oldpassword,
});

export const changepasswordsuccessful = (data, messege) => ({
  type: 'CHANGE_PASSWORD_SUCCESSFUL',
  payload: {
    data,
    messege,
  },
});

export const changepasswordfails = error => ({
  type: 'CHANGE_PASSWORD_FAIL',
  payload: error,
});


//FORGET PASSWORD
export const forgetpasswordrequest = ( email) => ({
  type: 'FORGET_PASSWORD_REQUEST',
  email,
});

export const forgetpasswordsuccessful = (data, messege) => ({
  type: 'FORGET_PASSWORD_SUCCESSFUL',
  payload: { data, messege },
});
export const forgetpasswordfails = error => ({
  type: 'FORGET_PASSWORD_FAIL',
  payload: error,
});


export const clearuser = () => ({
  type: 'CLEAR_USER',
});


//clear match otp

export const clearmatchotp = () => ({
  type: 'CLEAR_MATCH_OTP',
});



//RESET PASSWORD

export const resetpasswordrequest = (email, otp, newpassword) => ({
  type: 'RESET_PASSWORD_REQUEST',
  email,
  otp,
  newpassword,
});

export const resetpasswordsuccessful = (data, messege) => ({
  type: 'RESET_PASSWORD_SUCCESSFUL',
  payload: { data, messege },
});

export const resetpasswordfails = error => ({
  type: 'RESET_PASSWORD_FAIL',
  payload: error,
});


//RESEND OTP
export const resendotprequest = (email) => ({
  type: 'RESEND_OTP_REQUEST',
  email,
});

export const resendotpsuccessful = (data, messege) => ({
  type: 'RESEND_OTP_SUCCESSFUL',
  payload: { data, messege },
});

export const resendotpfails = error => ({
  type: 'RESEND_OTP_FAIL',
  payload: error,
});


//change avatar or profile pic

export const changeavatarrequest = (avatar) => ({
  type: 'CHANGE_AVATAR_REQUEST',
  avatar,
});
export const changeavatarsuccessful = (data, messege) => ({
  type: 'CHANGE_AVATAR_SUCCESSFUL',
  payload: { data, messege },
});

export const changeavatarfails = error => ({
  type: 'CHANGE_AVATAR_FAIL',
  payload: error,
});





//LOGOUT


// export const logoutrequest = username => ({
//   type: 'LOG_OUT_REQUEST',
//   username,
// });


// export const logoutsuccessful = messege => ({
//   type: 'LOG_OUT_SUCCESSFUL',

//   payload: {
//     messege,
//   },
// });

// export const logoutfails = error => ({
//   type: 'LOG_OUT_FAIL',
//   payload: error,
// });

// CLEAN
export const clearerror = () => ({
  type: 'CLEAR_ERROR',
});

export const clearmessege = () => ({
  type: 'CLEAR_MESSEGE',
});

//LOADER
export const setloading = loading => ({
  type: 'LOADING',
  payload: loading,
});

// export const setCleanUsernameAction = (cleanusername) => ({
//   type: 'SET_CLEAN_USERNAME',
//   payload: cleanusername,
// });

export const setCleanUsernameAction = cleanUsername => {
  console.log('Action - setCleanUsernameAction called with:', cleanUsername);
  return {
    type: 'SET_CLEAN_USERNAME',
    payload: cleanUsername,
  };
};

export const azureloginrequest = azurename => {
  console.log('Action - azurelogin requestAction called with:', azurename);
  return {
    type: 'AZURE_LOGIN_REQUEST',
    azurename,
  };
};

export const azureloginsuccessful = (data, messege) => {
  // console.log('Action - azureloginsuccessfulAction called with:', username);
  return {
    type: 'AZURE_LOGIN_SUCCESSFUL',
    payload: { data, messege },
  };
};

export const azureloginfail = error => ({
  type: 'AZURE_LOGIN_FAIL',
  payload: error,
});


export const isinactivestate = () => ({

  type: 'IS_INACTIVE_STATE',
});

// export const haveaccesstoken = () => ({

//   type: 'HAVE_ACCESS_TOKEN'
// })
