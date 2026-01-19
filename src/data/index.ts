/**
 * Data module - 数据模块
 *
 * 来源：寿星万年历
 * 包含城市经纬度、历史纪年等数据
 */

// 城市数据
export {
  CityInfo,
  decodeCoordinates,
  encodeCoordinates,
  PROVINCES,
  getCitiesByProvince,
  getProvincialCapital,
  findCityByName,
  getAllCities,
  MAJOR_CITIES,
} from './cities';

// 历史纪年数据
export {
  EraInfo,
  DynastyInfo,
  DYNASTIES,
  getEraData,
  findEraByYear,
  findEraByName,
  findErasByDynasty,
  yearToEraString,
  getDynastyByYear,
} from './eras';

// VSOP87 行星数据
export * from './vsop87';
