export interface Station { id: string; name: string }

export const stations: Station[] = [
  { id: '5yx6BWlEVcY', name: 'Chillhop Radio - jazzy & lofi hip hop beats 🐾' },
  { id: '7NOSDKb0HlU', name: 'lofi hip hop radio - beats to study/relax to 🐾' },
  { id: 'blAFxjhg62k', name: 'Coffee Shop Radio - 24/7 Chill Lo-Fi & Jazzy Beats' },
  { id: 'TfmECBzmOn4', name: 'Lofi Hip Hop Radio 🍉 Relaxing Beats to Study, Sleep, Chill to' },
  { id: 'lkcjlTqmoDY', name: 'videogame lofi & chill beats 💾 pixel art backgrounds' },
  { id: 'i6WzngxTnBA', name: 'late night vibes radio - calm lofi / dreamy beats 😴' },
  { id: 'UedTcufyrHc', name: 'ChillSynth FM - lofi synthwave radio for retro dreaming' },
  { id: 'FWjZ0x2M8og', name: 'lofi hip hop radio 😴 sad & sleepy beats' },
  { id: 'qH3fETPsqXU', name: '【24/7 CHILL LOFI HIP HOP RADIO】beats to sleep/relax/study to' },
  { id: 'BLIKwfIJIyo', name: 'Space Ambient Music LIVE 24/7: Ambient Cosmic Background for Sleep' },
];

export const backgrounds = [
  '2yzgWbRc97QOIUpklz', 'fqtxCwUd2t6dCzILMq', '3dhmyq6EKw2x7eFt4X',
  '3oEjHGokRZdOBbcZuo', 'wKnqovL33x9in9ci6X', 'KETTXY34XNgWZBxvqx',
  'NKEt9elQ5cR68', 'Basrh159dGwKY', 'mJhkYA1gnvY7r481qL',
  'dvreHY4p06lzVSDrvj', '8vRvucL4OhyjyM4A8T', 'gfld3S4CsRXRZjqEj3',
  '7bEpr3NIPNY0E', 'QLgtN0msAekg3x7YTm', 'dsd7XbYg0e6hG0A7i8',
  'YRK6HL1CEMUxZHLvjl', 'YRQfWgn1De4nYLLQBa', 'NnMH7LDpZTPZS',
  'xUOwGcu6wd0cXBj5n2', '3o6nV7ygKBVCmLPpJu', 'p71BYIPogqBPy',
  '2seKKLp1n0sEeJLYTK', 'PXj1J0eMONGOA', '5torEEM8QnR95Cqg11',
  'He1ppTVuaVSCs', '97e6IX0kayYTK', '3gTmgzy7wYJfyaGRHQ',
  '3nbxypT20Ulmo', 'v2WuhMBzb3h5e', 'ZyFCksxxD9tmLYfGJo',
  'j5zqQSABpeHCU8EpO3', 'TNTyFBi6r9R6g', '7FvaPVEKXuB3O',
  'Wci9oW5MbO6PK', 'qvkaMMMqyGFjO', '4oHyOIBIt57ag',
  'lkceXNDw4Agryfrwz8', 'SJhhRPXjaTGe5MKz5N', '4YZNYcTybcYTnROykG',
  'RcRYrpC1pBvIB0icDm', '9LZTcawH3mc8V2oUqk', 'pVGsAWjzvXcZW4ZBTE',
  '2SYqgPxMm2kbVe3y02', 'tvU9iTev6uBIQ', 'H62NM1ab7wzMXURdoi',
  'l1BgQOc1Jj7L86BA4', 'gH1jGsCnQBiFHWMFzh', '11fHSR7hmRLbkA',
  'ckr4W2ppxPBeIF8dx4', 'vMSXa7KFGx49aeeXhe', 'ZCZ7FHlu3sPek3h0zP',
  '9jwuxt5bXKadi', '6705G9I9sUcNCaJF10',
];

export const gifUrl = (id: string) => `/assets/gifs/${id}.gif`;
export const randomOther = (length: number, current: number) =>
  length < 2 ? 0 : (current + 1 + Math.floor(Math.random() * (length - 1))) % length;

export function initialStationId() {
  const queryId = new URLSearchParams(location.search).get('station');
  return stations.some(s => s.id === queryId) ? queryId! : stations[0].id;
}
