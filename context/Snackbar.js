import {useContext, useState} from 'react';
import {createContext} from 'react';
import {Platform} from 'react-native';
import NitroSound from 'react-native-nitro-sound';

const APPLICATION_ID = 'com.ecommereceverse'; // <-- replace with your actual applicationId from android/app/build.gradle

export const SnackbarContext = createContext();

export const SnackProvider = ({children}) => {
  const [show, setShow] = useState(false);
  const [messege, setMessege] = useState('');
  const [explain, setExplain] = useState('');
  const [type, setType] = useState('info');

  const playSoundSafely = async (soundName) => {
    try {
      // stop anything currently playing to avoid conflicts
      try {
        await NitroSound.stopPlayer();
      } catch (e) {
        // no active player — safe to ignore
      }

      const uri =
        Platform.OS === 'android'
          ? `android.resource://${APPLICATION_ID}/raw/${soundName}`
          : soundName; // iOS: bundled file resolved from main bundle by name

      await NitroSound.startPlayer(uri);
    } catch (error) {
      console.log(`Cannot play ${soundName} sound:`, error);
    }
  };

  const handleSnackbar = ({error, messege, usernameerror, emailerror, emailmessege, matchotperror, matchotpmessege}) => {
    if (error) {
      setShow(true);
      setMessege(error[0]);
      setExplain(error[1]);
      setType('error');
      playSoundSafely('error');
    }
    else if (usernameerror) {
      setShow(true);
      setMessege(usernameerror[0]);
      setExplain(usernameerror[1]);
      setType('error');
      playSoundSafely('error');
    }
    else if (emailmessege) {
      setShow(true);
      setMessege(emailmessege[0]);
      setExplain(emailmessege[1]);
      setType('success');
      playSoundSafely('ding2');
    }
    else if (emailerror) {
      setShow(true);
      setMessege(emailerror[0]);
      setExplain(emailerror[1]);
      setType('error');
      playSoundSafely('error');
    }
    else if (messege) {
      setShow(true);
      setMessege(messege[0]);
      setExplain(messege[1]);
      setType('success');
      playSoundSafely('ding2');
    }
    else if (matchotperror) {
      setShow(true);
      setMessege(matchotperror[0]);
      setExplain(matchotperror[1]);
      setType('error');
      playSoundSafely('error');
    }
    else if (matchotpmessege) {
      setShow(true);
      setMessege(matchotpmessege[0]);
      setExplain(matchotpmessege[1]);
      setType('success');
      playSoundSafely('ding2');
    }
    else {
      setShow(false);
    }
  };

  return (
    <SnackbarContext.Provider
      value={{type, show, setShow, messege, explain, handleSnackbar}}>
      {children}
    </SnackbarContext.Provider>
  );
};


// import {useContext, useState} from 'react';
// import {createContext} from 'react';
// // import SoundPlayer from 'react-native-sound-player';
// import NitroSound from 'react-native-nitro-sound';

// export const SnackbarContext = createContext();

// export const SnackProvider = ({children}) => {
//   const [show, setShow] = useState(false);
//   const [messege, setMessege] = useState('');
//   const [explain, setExplain] = useState('');
//   const [type, setType] = useState('info');

//   // Helper function to safely play sounds
// // Replace with this:
// const playSoundSafely = async (soundName, extension = 'mp3') => {
//   try {
//     // await NitroSound.startPlayer(`${soundName}.${extension}`);
//     await NitroSound.startPlayer(`android.resource://${applicationId}/raw/${soundName}`);
//   } catch (error) {
//     console.log(`Cannot play ${soundName} sound:`, error);
//   }
// };
//   const handleSnackbar = async ({error, messege, usernameerror, emailerror, emailmessege, matchotperror, matchotpmessege}) => {
//     if (error) {
//       setShow(true);
//       setMessege(error[0]);
//       setExplain(error[1]);
//       setType('error');
//       playSoundSafely('error');
//     }
//     // error in username verification
//     else if(usernameerror) {
//       setShow(true);
//       setMessege(usernameerror[0]);
//       setExplain(usernameerror[1]);
//       setType('error');
//       playSoundSafely('error');
//     }
//     else if(emailmessege) {
//       setShow(true);
//       setMessege(emailmessege[0]);
//       setExplain(emailmessege[1]);
//       setType('success');
//       playSoundSafely('ding2');
//     }
//     // error in email verification
//     else if(emailerror) {
//       setShow(true);
//       setMessege(emailerror[0]);
//       setExplain(emailerror[1]);
//       setType('error');
//       playSoundSafely('error');
//     }
//     else if (messege) {
//       setShow(true);
//       setMessege(messege[0]);
//       setExplain(messege[1]);
//       setType('success');
//       playSoundSafely('ding2');
//     }
//     else if(matchotperror) {
//       setShow(true);
//       setMessege(matchotperror[0]);
//       setExplain(matchotperror[1]);
//       setType('error');
//        playSoundSafely('error');
//     }
//     else if(matchotpmessege) {
//       setShow(true);
//       setMessege(matchotpmessege[0]);
//       setExplain(matchotpmessege[1]);
//       setType('success');
//        playSoundSafely('ding2');
//     }
//     else {
//       setShow(false);
//     }
//   };

//   return (
//     <SnackbarContext.Provider
//       value={{type, show, setShow, messege, explain, handleSnackbar}}>
//       {children}
//     </SnackbarContext.Provider>
//   );
// };





// import {useContext, useState} from 'react';
// import {createContext} from 'react';
// import Sound from 'react-native-sound';

// export const SnackbarContext = createContext();

// export const SnackProvider = ({children}) => {
//   const [show, setShow] = useState(false);
//   const [messege, setMessege] = useState('');
//   const [explain, setExplain] = useState('');
//   const [type, setType] = useState('info');

//   // Helper: play a sound from android/app/src/main/res/raw (Android)
//   // or the main bundle (iOS), same as before.
//   const playSoundSafely = (soundName) => {
//     const sound = new Sound(soundName, Sound.MAIN_BUNDLE, (error) => {
//       if (error) {
//         console.log(`Cannot load ${soundName} sound:`, error);
//         return;
//       }
//       sound.play((success) => {
//         if (!success) {
//           console.log(`Playback failed for ${soundName}`);
//         }
//         sound.release(); // free resources once done
//       });
//     });
//   };

//   const handleSnackbar = ({error, messege, usernameerror, emailerror, emailmessege, matchotperror, matchotpmessege}) => {
//     if (error) {
//       setShow(true);
//       setMessege(error[0]);
//       setExplain(error[1]);
//       setType('error');
//       playSoundSafely('error.mp3');
//     }
//     else if (usernameerror) {
//       setShow(true);
//       setMessege(usernameerror[0]);
//       setExplain(usernameerror[1]);
//       setType('error');
//       playSoundSafely('error.mp3');
//     }
//     else if (emailmessege) {
//       setShow(true);
//       setMessege(emailmessege[0]);
//       setExplain(emailmessege[1]);
//       setType('success');
//       playSoundSafely('ding2.mp3');
//     }
//     else if (emailerror) {
//       setShow(true);
//       setMessege(emailerror[0]);
//       setExplain(emailerror[1]);
//       setType('error');
//       playSoundSafely('error.mp3');
//     }
//     else if (messege) {
//       setShow(true);
//       setMessege(messege[0]);
//       setExplain(messege[1]);
//       setType('success');
//       playSoundSafely('ding2.mp3');
//     }
//     else if (matchotperror) {
//       setShow(true);
//       setMessege(matchotperror[0]);
//       setExplain(matchotperror[1]);
//       setType('error');
//       playSoundSafely('error.mp3');
//     }
//     else if (matchotpmessege) {
//       setShow(true);
//       setMessege(matchotpmessege[0]);
//       setExplain(matchotpmessege[1]);
//       setType('success');
//       playSoundSafely('ding2.mp3');
//     }
//     else {
//       setShow(false);
//     }
//   };

//   return (
//     <SnackbarContext.Provider
//       value={{type, show, setShow, messege, explain, handleSnackbar}}>
//       {children}
//     </SnackbarContext.Provider>
//   );
// };