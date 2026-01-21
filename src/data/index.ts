/**
 * Data module - 数据模块
 *
 * 来源：寿星万年历
 * 包含城市经纬度、历史纪年等数据
 */

// 城市数据 - 类型导出
export type { CityInfo } from './cities';

// 城市数据
export {
  decodeCoordinates,
  encodeCoordinates,
  PROVINCES,
  getCitiesByProvince,
  getProvincialCapital,
  findCityByName,
  getAllCities,
  MAJOR_CITIES,
} from './cities';

// 历史纪年数据 - 类型导出
export type { EraInfo, DynastyInfo } from './eras';

// 历史纪年数据
export {
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
