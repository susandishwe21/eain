export type PlaceId = 'house' | 'river' | 'treeRows' | 'park' | 'hut' | 'riceFields' | 'pagoda'

export interface PlaceStory {
  title: string
  titleMyanmar: string
  text: string
  textMyanmar: string
}

export const placeStories: Record<PlaceId, PlaceStory> = {
  house: {
    title: 'Our wooden house',
    titleMyanmar: 'တို့အိမ်လေး',
    text: 'The house sits under the trees, listening to rain, paddies, and family footsteps.',
    textMyanmar: 'သစ်ပင်တွေအောက်မှာ တည်ရှိတဲ့ အိမ်လေးက မိုးသံ၊ လယ်ကွင်းနဲ့ မိသားစုခြေသံတွေကို နားထောင်နေတယ်။',
  },
  river: {
    title: 'The little stream',
    titleMyanmar: 'ချောင်းလေး',
    text: 'A narrow ribbon of water curves past the home. Watch its gentle current shimmer.',
    textMyanmar: 'အိမ်ဘေးကနေ ကွေ့ကောက်စီးဆင်းတဲ့ ရေချောင်းလေး။ ရေပြင်လေး တလက်လက်ဖြစ်နေတာကို ကြည့်ပါ။',
  },
  treeRows: {
    title: 'The tree garden',
    titleMyanmar: 'သစ်ပင်ဥယျာဉ်',
    text: 'Young trees planted in parallel rows make a patient garden south of the house.',
    textMyanmar: 'အိမ်တောင်ဘက်က အတန်းလိုက်စိုက်ထားတဲ့ သစ်ပင်ငယ်လေးတွေဟာ စိတ်ရှည်တဲ့ ဥယျာဉ်လေးတစ်ခုပါ။',
  },
  park: {
    title: 'The green park',
    titleMyanmar: 'မြက်ခင်းပြင်',
    text: 'An open patch of grass: room for shade, games, and a quiet look across the village.',
    textMyanmar: 'အရိပ်၊ ကစားစရာနဲ့ ရွာကို ငေးကြည့်ဖို့ နေရာလွတ်မြက်ခင်းပြင်လေး။',
  },
  hut: {
    title: 'The little hut',
    titleMyanmar: 'တဲလေး',
    text: 'Beside the hut, a straw stack waits for the next season in the paddies.',
    textMyanmar: 'တဲလေးဘေးက ကောက်ရိုးပုံလေးဟာ နောက်ထပ်လယ်ရာသီကို စောင့်နေတယ်။',
  },
  riceFields: {
    title: 'Rice fields',
    titleMyanmar: 'စပါးခင်းများ',
    text: 'Growing green plots and harvested brown plots share the same careful bunds.',
    textMyanmar: 'စိမ်းလန်းတဲ့ စပါးခင်းတွေနဲ့ ရိတ်သိမ်းပြီးတဲ့ အညိုရောင်ခင်းတွေကို ကန်သင်းလေးတွေက ခွဲထားတယ်။',
  },
  pagoda: {
    title: 'Pagoda',
    titleMyanmar: 'ဘုရား',
    text: 'The golden pagoda stands by the river at Thein Htaung village. Its gold catches the evening sun, and on Thadingyut night candles glow all around its base.',
    textMyanmar: 'မြစ်ကမ်းနားက ရွှေစေတီတော်ဟာ ညနေနေရောင်မှာ ရွှေရောင်တဖိတ်ဖိတ် တောက်ပနေတယ်။ သီတင်းကျွတ်ညမှာ စေတီတော်အောက်ခြေတစ်ဝိုက် ဖယောင်းတိုင်မီးလေးတွေ ထွန်းညှိထားကြတယ်။',
  },
}
