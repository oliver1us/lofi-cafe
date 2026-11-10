const english = {
  listeningNow: 'listening now', tapToStart: 'tap to start', pressToStart: 'press any key to start',
  changeStation: 'change station', playPause: 'play/pause', tweetThisStation: 'tweet this station',
  changeGif: 'change gif', showVideo: 'show original video', lowPowerMode: 'low-power mode',
  closeThis: 'close this', sayHi: 'Or click here to say hi!',
  arrows: 'arrows', spacebar: 'spacebar',
};
type Copy = typeof english;
const translations: Record<string, Partial<Copy>> = {
  es: {
    listeningNow: 'escuchando ahora', pressToStart: 'presionar una cualquier tecla para empezar',
    changeStation: 'cambiar de estaciòn', tweetThisStation: 'tuitear esta estaciòn',
    changeGif: 'cambiar el gif', showVideo: 'mostrar video original', lowPowerMode: 'modo low-power',
    closeThis: 'cerrar', sayHi: 'Hacer clic aqui para contactarnos',
    arrows: 'flechas', spacebar: 'barra espaciadora',
  },
  it: {
    listeningNow: 'in ascolto ora', pressToStart: 'premi un tasto per cominciare',
    changeStation: 'cambia stazione', playPause: 'play/pausa', tweetThisStation: 'twitta questa stazione',
    changeGif: 'cambia gif', showVideo: 'mostra video originale', lowPowerMode: 'modalità low-power',
    closeThis: 'chiudi', sayHi: 'Clicca qui per scriverci!',
    arrows: 'frecce', spacebar: 'spazio',
  },
  ja: { tapToStart: 'タップしてスタートしてください', pressToStart: 'キーを押してスタートしてください' },
};
export const language = navigator.language.split('-')[0];
export const copy: Copy = { ...english, ...translations[language] };
