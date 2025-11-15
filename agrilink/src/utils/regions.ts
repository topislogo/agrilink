// Myanmar regions and cities mapping for AgriLink
export const myanmarRegions = {
  'yangon': {
    name: 'Yangon Region',
    cities: ['Yangon', 'Thanlyin', 'Mingalardon', 'Insein', 'Hmawbi', 'Hlegu', 'Taikkyi']
  },
  'mandalay': {
    name: 'Mandalay Region',
    cities: ['Mandalay', 'Meiktila', 'Pyinoolwin', 'Kyaukse', 'Nyaung-U', 'Myingyan', 'Yamethin']
  },
  'naypyidaw': {
    name: 'Naypyidaw Union Territory',
    cities: ['Naypyidaw', 'Pyinmana', 'Lewe', 'Tatkon']
  },
  'ayeyarwady': {
    name: 'Ayeyarwady Region',
    cities: ['Pathein', 'Myaungmya', 'Bogalay', 'Pyapon', 'Labutta', 'Hinthada', 'Maubin']
  },
  'bago': {
    name: 'Bago Region',
    cities: ['Bago', 'Pyay', 'Taungoo', 'Thegon', 'Nyaunglebin', 'Kawa', 'Waw']
  },
  'magway': {
    name: 'Magway Region',
    cities: ['Magway', 'Pakokku', 'Minbu', 'Chauk', 'Yenangyaung', 'Thayet', 'Aunglan']
  },
  'sagaing': {
    name: 'Sagaing Region',
    cities: ['Sagaing', 'Monywa', 'Shwebo', 'Kale', 'Katha', 'Mawlaik', 'Ye-U']
  },
  'tanintharyi': {
    name: 'Tanintharyi Region',
    cities: ['Dawei', 'Myeik', 'Kawthaung', 'Bokpyin', 'Thayetchaung']
  },
  'mon': {
    name: 'Mon State',
    cities: ['Mawlamyine', 'Thaton', 'Mudon', 'Ye', 'Kyaikto', 'Paung', 'Chaungzon']
  },
  'kayin': {
    name: 'Kayin State',
    cities: ['Hpa-an', 'Kawkareik', 'Myawaddy', 'Kyainseikgyi', 'Thandaunggyi']
  },
  'kayah': {
    name: 'Kayah State',
    cities: ['Loikaw', 'Demoso', 'Hpruso', 'Bawlakhe']
  },
  'shan': {
    name: 'Shan State',
    cities: ['Taunggyi', 'Lashio', 'Kengtung', 'Hsipaw', 'Nyaungshwe', 'Kalaw', 'Pinlaung', 'Muse']
  },
  'chin': {
    name: 'Chin State',
    cities: ['Hakha', 'Falam', 'Tedim', 'Tonzang', 'Mindat']
  },
  'rakhine': {
    name: 'Rakhine State',
    cities: ['Sittwe', 'Kyaukpyu', 'Mrauk-U', 'Thandwe', 'Maungdaw', 'Buthidaung']
  },
  'kachin': {
    name: 'Kachin State',
    cities: ['Myitkyina', 'Bhamo', 'Putao', 'Mohnyin', 'Injangyang']
  }
};

export type RegionKey = keyof typeof myanmarRegions;

export function getAllRegions() {
  return Object.entries(myanmarRegions);
}

export function getCitiesForRegion(regionKey: RegionKey) {
  return myanmarRegions[regionKey]?.cities || [];
}

export function getRegionName(regionKey: RegionKey) {
  return myanmarRegions[regionKey]?.name || '';
}

export function getRegionFromCity(cityName: string): string | null {
  for (const [regionKey, regionData] of Object.entries(myanmarRegions)) {
    if (regionData.cities.includes(cityName)) {
      return regionKey;
    }
  }
  return null;
}