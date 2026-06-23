export interface PostRecord {
  //basic specs.
  id: number ;
  mobileCode: string;
  dayOfWeekCode: string;
  seq: string;
  //Eng data
  nameEN: string;
  districtEN: string;
  locationEN: string;
  addressEN: string;

  //Trad Chinese data
  nameTC: string;
  districtTC: string;
  locationTC: string;
  addressTC: string;

//Simp chinese
  nameSC: string;
  districtSC: string;
  locationSC: string;
  addressSC: string;

  // Time and geo location data like lat and long
  openHour: string;   // TIME usually comes as "HH:MM:SS"
  closeHour: string;
  latitude: number;
  longitude: number;
}
