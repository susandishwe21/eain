export type StoryObjectId = 'photo' | 'lamp' | 'books' | 'window'

export interface StoryObject {
  title: string
  titleMyanmar: string
  text: string
  textMyanmar: string
}

export const objectStories: Record<StoryObjectId, StoryObject> = {
  photo: {
    title: 'A little memory',
    titleMyanmar: 'အမှတ်တရလေး',
    text: 'A small frame for the people and places that make home feel warm.',
    textMyanmar: 'အိမ်ကို နွေးထွေးစေတဲ့ လူတွေနဲ့ နေရာတွေအတွက် အမှတ်တရဘောင်လေး။',
  },
  lamp: {
    title: 'Evening lamp',
    titleMyanmar: 'ညနေမီးအိမ်',
    text: 'Click the lamp to turn its warm light on or off.',
    textMyanmar: 'မီးအိမ်ကို နှိပ်ပြီး နွေးထွေးတဲ့အလင်းကို ဖွင့်ပိတ်ကြည့်ပါ။',
  },
  books: {
    title: 'Shelf of stories',
    titleMyanmar: 'ပုံပြင်စာအုပ်စင်',
    text: 'A few well-loved books, waiting for a quiet evening.',
    textMyanmar: 'တိတ်ဆိတ်တဲ့ ညနေတစ်ခုကို စောင့်နေတဲ့ နှစ်သက်ရာစာအုပ်လေးတွေ။',
  },
  window: {
    title: 'Thadingyut evening',
    titleMyanmar: 'သီတင်းကျွတ်ညနေ',
    text: 'The sky outside glows like a tiny festival lantern.',
    textMyanmar: 'အပြင်ဘက်ကောင်းကင်ဟာ ပွဲတော်မီးပုံးလေးလို တောက်ပနေတယ်။',
  },
}
