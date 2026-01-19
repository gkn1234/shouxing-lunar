/**
 * 城市经纬度数据 - City Coordinates Data
 *
 * 来源：寿星万年历 JW.js
 * 编码规则：4字符编码，前2位纬度，后2位经度
 * 解码：经度 = (c2*60 + c3 + 73*60) / 60 度
 *       纬度 = (c0*60 + c1) / 60 度
 */

/**
 * 城市信息接口
 */
export interface CityInfo {
  /** 城市名称 */
  name: string;
  /** 经度 (度，东经为正) */
  longitude: number;
  /** 纬度 (度，北纬为正) */
  latitude: number;
  /** 省份 */
  province: string;
}

/**
 * 解码经纬度编码字符
 */
function decodeChar(c: string): number {
  const code = c.charCodeAt(0);
  if (code > 96) return code - 97 + 36; // a-z → 36-61
  if (code > 64) return code - 65 + 10; // A-Z → 10-35
  return code - 48; // 0-9 → 0-9
}

/**
 * 解码4字符经纬度编码
 * @param encoded - 4字符编码字符串
 * @returns [经度, 纬度] (度)
 */
export function decodeCoordinates(encoded: string): [number, number] {
  if (encoded.length < 4) {
    throw new Error('编码字符串长度必须至少为4');
  }

  const v0 = decodeChar(encoded[0]);
  const v1 = decodeChar(encoded[1]);
  const v2 = decodeChar(encoded[2]);
  const v3 = decodeChar(encoded[3]);

  const longitude = v2 + v3 / 60 + 73; // 经度 (度)
  const latitude = v0 + v1 / 60; // 纬度 (度)

  return [longitude, latitude];
}

/**
 * 编码经纬度为4字符编码
 * @param longitude - 经度 (度)
 * @param latitude - 纬度 (度)
 * @returns 4字符编码字符串
 */
export function encodeCoordinates(longitude: number, latitude: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  const lonDeg = longitude - 73;
  const lonMin = Math.round((lonDeg % 1) * 60);
  const lonD = Math.floor(lonDeg);

  const latMin = Math.round((latitude % 1) * 60);
  const latD = Math.floor(latitude);

  return chars[latD] + chars[latMin] + chars[lonD] + chars[lonMin];
}

/**
 * 省份城市原始数据 (编码格式)
 * 格式: "编码+城市名 编码+城市名 ..."，第一个为省会
 */
const PROVINCE_DATA: Record<string, string> = {
  北京市: 'dshN天安门 dshO北京市 djh8房山区 dihK大兴区 drhQ崇文区 dthQ朝阳区 dthd通州区 dvhI海淀区 duhP东城区 dthM西城区 dqhL宣武区 dphH丰台区 dshD石景山区 duh6门头沟区 eDhE昌平区 e8hd顺义区 eJhc怀柔区 e8i7平谷区 eRgw延庆县 eMho密云县',
  天津市: 'cpic天津市 cpiT和平区 cpic河西区 cpie南开区 crig河北区 cqic河东区 cqig红桥区 cpir塘沽区 cji4大港区 crjP汉沽区 c6i2静海县 cwiA东丽区 crij北辰区 cMit武清区 cciB西青区 cUj0宝坻区 cyjo津南区 bxjK宁河县 cojQ蓟县',
  上海市: 'VEmS上海市 UjmK金山区 UtmS奉贤区 V2mD松江区 V7mN闵行区 VBmQ徐汇区 VDmP长宁区 VFmR闸北区 VEmT黄浦区 VDmS卢湾区 VEmR静安区 VDmW浦东新区 VGmV杨浦区 VGmU虹口区 VFmO普陀区 V9m7青浦区 VNmG嘉定区 VOmT宝山区 V3mj南汇区 VbmO崇明县',
  重庆市: 'ZJaW重庆市 Z7ag渝北区 ZMaV江北区 Z4ae北碚区 ZLaP渝中区 ZKaQ大渡口区 ZFaS九龙坡区 ZFaK沙坪坝区 ZHab南岸区 Y2ag巴南区 Ypai綦江区 YCaD万盛区 X7ao南川区 Ycbd涪陵区 XWZS武隆县 XMbx彭水县 WsaG永川区 X5ZP合川区 XKZd江津区 XgaI璧山县 Xn9w铜梁区 Y69L潼南县 YD9n大足区 YX9k荣昌区 YP8h双桥区 Zg9G长寿区 aacd垫江县 bIcS梁平县 aJce丰都县 acdl忠县 amde万州区 amcA开县 badZ云阳县 aqdq奉节县 ardQ巫山县 ate1巫溪县 a1de城口县 aIbD黔江区 aObS酉阳县 Ztbr秀山县 aBby石柱县',
  河北省: 'drjF石家庄 e3hZ张家口 esiT承德 cpic天津 dkhz邯郸 dYi8邢台 dljK保定 dej2衡水 dJjb沧州 d8jo廊坊 ediI唐山 efii秦皇岛',
  山西省: 'dqgE太原 dlf1大同 dOfN朔州 d5g6忻州 dxfc阳泉 dug9晋中 dXfr吕梁 dOfB长治 dCfK晋城 dHeW临汾 cwet运城',
  内蒙古: 'ehgK呼和浩特 eQf6包头 dKe9鄂尔多斯 d4e5榆林 eFgV乌兰察布 fAg2锡林浩特 g5gm二连浩特 fTiq赤峰 gDjw通辽 gPmn兴安盟 ijox海拉尔 hxpo满洲里 hEkF齐齐哈尔',
  辽宁省: 'geky沈阳 gclY大连 gdk4营口 gXkU鞍山 g7kM抚顺 g2kz本溪 gglX辽阳 gDko盘锦 gakZ锦州 gwlI葫芦岛 fRl8朝阳 guln阜新 gzlq铁岭 gJmn丹东',
  吉林省: 'hmmT长春 h4mN四平 hFlT辽源 hVmi吉林市 iCmQ白城 h0lJ通化 gvlq白山 iMo3延边',
  黑龙江: 'iYnC哈尔滨 jbnp齐齐哈尔 ijpC大庆 jnoM绥化 ivol牡丹江 kkqT佳木斯 kQqZ双鸭山 karp鹤岗 khr4伊春 jYpO七台河 knqE鸡西 jnr4黑河 mMsx大兴安岭',
  江苏省: 'X4ok南京 VMom镇江 UTn5常州 UOnU无锡 TwoW苏州 THoh昆山 T8nZ南通 TUp5盐城 UFpi扬州 UYpL淮安 VUp0徐州 U0on宿迁 ULoP泰州 U4oo连云港',
  浙江省: 'T0m3杭州 S5le宁波 SEkC温州 Spln绍兴 Sxlr嘉兴 TClK湖州 SRlc金华 SOkj台州 S1kf丽水 Rqka衢州 SHmh舟山',
  安徽省: 'WDoI合肥 VVn0芜湖 VDoY马鞍山 VZnp蚌埠 W6oT淮南 WVom淮北 X5of宿州 W0n8滁州 Vlnb铜陵 Vfnn池州 VBna安庆 Uvno黄山 Urnf宣城 W9o4阜阳 Wbnu亳州 VQnT六安',
  福建省: 'PFjl福州 Omje厦门 OKjA漳州 OtiL泉州 PCjd莆田 PYjY三明 Pvjz南平 Pvkv龙岩 O5jv宁德',
  江西省: 'TnoM南昌 TFnb九江 Svnm上饶 S0mj鹰潭 Rlnv景德镇 S1nq新余 RknC萍乡 RIn5宜春 Rbm1吉安 Qnnq抚州 Qqla赣州',
  山东省: 'bBmT济南 akmp泰安 aEmB济宁 a7lf枣庄 aclH临沂 ZXlw日照 aJn1青岛 aZmB淄博 aSm4潍坊 azmj烟台 b6mE威海 b3lL东营 a5mq滨州 a5lo德州 aAmG聊城 Znl6菏泽',
  河南省: 'YziV郑州 Ywiq开封 Z5iO洛阳 Ygjb新乡 YpjG焦作 ZeiW濮阳 Yqjb安阳 Yrjw鹤壁 Y5i1平顶山 XzhG许昌 Xwi5漯河 XGhz南阳 XNiV信阳 Xjii周口 XgiW驻马店 XwhT商丘 Z1hw三门峡 Y5hs济源',
  湖北省: 'Vnhf武汉 Vrh6黄石 VHhU鄂州 V6h0黄冈 V3gq咸宁 Uwh1荆州 VUgN宜昌 VHft十堰 V0gV襄阳 Ubgv荆门 Ungl随州 Vdh2孝感',
  湖南省: 'Tngt长沙 Togt株洲 Tdhf湘潭 TDgh衡阳 Sogl邵阳 Ttfc益阳 TVfl岳阳 S6fb常德 SAfa张家界 RYfI吉首 Rvgo永州 RVg5郴州 S4gi娄底 Segm怀化',
  广东省: 'NJha广州 MpgY深圳 Mkhc珠海 N3hb佛山 N8hd东莞 MqhQ中山 Mxhj江门 NDgz惠州 N2gu肇庆 NZfG韶关 Neg5河源 Nrfn梅州 ORfZ汕头 Ojfg潮州 Ogfk揭阳 MJgW汕尾 LNfZ湛江 LzhI茂名 LYgF阳江 MGgN云浮 N0fc清远',
  广西: 'Nqd2南宁 NAcu柳州 N9bg桂林 MOcs梧州 MweO玉林 N1cS贵港 Mrc8钦州 LrcZ北海 MTcn防城港 MTdF崇左 NVcl百色 Nndg河池 N4bE来宾 NJdr贺州',
  海南省: 'KMeN海口 JGdr三亚 JpeP五指山 Kyem文昌 K7dD东方 JqeM琼海 Jwdu万宁 K9dn儋州',
  四川省: 'VDaH成都 V6a2攀枝花 U2ac泸州 T7Zw宜宾 U09s内江 U0a0自贡 Ue9q资阳 UIaC眉山 U4aH乐山 V8aD德阳 VV9y绵阳 VN9M广元 Upac遂宁 UM9y南充 TcZF达州 Sp9J巴中 TCaY广安 V29v雅安 Twar西昌 TV9N阿坝州 Tw8C甘孜州',
  贵州省: 'Rla8贵阳 RWZx遵义 SMa2六盘水 RY9t安顺 S1Zx毕节 Rh9S铜仁 R79l凯里 Q4a0都匀 Q29e黔西南',
  云南省: 'PSZp昆明 Pva6曲靖 PMZz玉溪 PKZd楚雄 PRYq大理 PpYW丽江 Pp8c迪庆 PzXR保山 Q5Xv德宏 Oo9Q临沧 OnZc普洱 ORa3红河 NuZr文山 N8Y5西双版纳',
  西藏: 'ZL7x拉萨 Y35Z日喀则 X73Y山南 a45a那曲 Y66P林芝 Xs4Q昌都 U63g阿里',
  陕西省: 'XGdI西安 X3dD渭南 XAdK咸阳 XFcx铜川 XWcn延安 Y2bH榆林 WOdD商洛 WSdH宝鸡 VzdT汉中 W0cj安康',
  甘肃省: 'Yi9b兰州 YXaO白银 ZK9T定西 Xo9Y天水 W6aG陇南 X39r平凉 Xq9n庆阳 Z68b武威 aG7f张掖 aH6D酒泉 aF5Q嘉峪关 X78O甘南 Ye8R临夏',
  青海省: 'b18Q西宁 bb7u海东 b584海北 a57g海南州 aL5R黄南 aq5P果洛 aj4R玉树 Zf42海西',
  宁夏: 'bT9I银川 bc8Q石嘴山 aH9O吴忠 a19b固原 Zw9S中卫',
  新疆: 'jL4J乌鲁木齐 j53R克拉玛依 j82x石河子 ji48昌吉 hO4E吐鲁番 hB3b哈密 in26博乐 ig2p伊犁 gY28阿克苏 gQ28库车 eq2c阿图什 eq2F喀什 dY1F和田 dv1r塔城 i41W阿勒泰',
  香港: 'MLhL香港 MLhJ九龙 MKhR新界',
  澳门: 'MMhD澳门',
  台湾省: 'PAmd台北 PJm6基隆 P4mb新竹 Orm0台中 OemT彰化 OOmQ嘉义 NOmB台南 NAlt高雄 NGld屏东 Ndl1台东 PAle宜兰 Onlk花莲',
};

/**
 * 省份列表
 */
export const PROVINCES: readonly string[] = Object.keys(PROVINCE_DATA);

/**
 * 解析城市数据
 */
function parseCityData(): Map<string, CityInfo[]> {
  const result = new Map<string, CityInfo[]>();

  for (const [province, data] of Object.entries(PROVINCE_DATA)) {
    const cities: CityInfo[] = [];
    const items = data.split(' ');

    for (const item of items) {
      if (item.length < 5) continue; // 至少4字符编码 + 1字符名称

      const encoded = item.substring(0, 4);
      const name = item.substring(4);
      const [longitude, latitude] = decodeCoordinates(encoded);

      cities.push({
        name,
        longitude,
        latitude,
        province,
      });
    }

    result.set(province, cities);
  }

  return result;
}

// 缓存解析后的城市数据
let cityDataCache: Map<string, CityInfo[]> | null = null;

/**
 * 获取所有城市数据
 */
function getCityData(): Map<string, CityInfo[]> {
  if (!cityDataCache) {
    cityDataCache = parseCityData();
  }
  return cityDataCache;
}

/**
 * 获取省份的所有城市
 * @param province - 省份名称
 * @returns 城市列表
 */
export function getCitiesByProvince(province: string): CityInfo[] {
  const data = getCityData();
  return data.get(province) || [];
}

/**
 * 获取省会城市
 * @param province - 省份名称
 * @returns 省会城市信息
 */
export function getProvincialCapital(province: string): CityInfo | null {
  const cities = getCitiesByProvince(province);
  return cities.length > 0 ? cities[0] : null;
}

/**
 * 按名称查找城市
 * @param name - 城市名称 (支持模糊匹配)
 * @returns 匹配的城市列表
 */
export function findCityByName(name: string): CityInfo[] {
  const results: CityInfo[] = [];
  const data = getCityData();

  for (const cities of data.values()) {
    for (const city of cities) {
      if (city.name.includes(name) || name.includes(city.name)) {
        results.push(city);
      }
    }
  }

  return results;
}

/**
 * 获取所有城市列表
 * @returns 所有城市的平面列表
 */
export function getAllCities(): CityInfo[] {
  const results: CityInfo[] = [];
  const data = getCityData();

  for (const cities of data.values()) {
    results.push(...cities);
  }

  return results;
}

/**
 * 主要城市快捷访问 (预定义常用城市)
 */
export const MAJOR_CITIES: Record<string, CityInfo> = {
  北京: { name: '北京市', longitude: 116.4, latitude: 39.9, province: '北京市' },
  上海: { name: '上海市', longitude: 121.47, latitude: 31.23, province: '上海市' },
  广州: { name: '广州市', longitude: 113.27, latitude: 23.13, province: '广东省' },
  深圳: { name: '深圳市', longitude: 114.07, latitude: 22.55, province: '广东省' },
  成都: { name: '成都市', longitude: 104.07, latitude: 30.67, province: '四川省' },
  杭州: { name: '杭州市', longitude: 120.17, latitude: 30.25, province: '浙江省' },
  武汉: { name: '武汉市', longitude: 114.27, latitude: 30.58, province: '湖北省' },
  西安: { name: '西安市', longitude: 108.93, latitude: 34.27, province: '陕西省' },
  南京: { name: '南京市', longitude: 118.78, latitude: 32.07, province: '江苏省' },
  重庆: { name: '重庆市', longitude: 106.55, latitude: 29.57, province: '重庆市' },
  天津: { name: '天津市', longitude: 117.2, latitude: 39.13, province: '天津市' },
  苏州: { name: '苏州市', longitude: 120.62, latitude: 31.3, province: '江苏省' },
  香港: { name: '香港', longitude: 114.17, latitude: 22.28, province: '香港' },
  台北: { name: '台北', longitude: 121.52, latitude: 25.03, province: '台湾省' },
};
