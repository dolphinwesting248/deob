function _0x4a67(_0x329bcb, _0x1e7c54) {
 var _0x3e54a7 = _0x3e54();
 var _0x4a67b2 = _0x3e54a7[_0x329bcb];
 var _0x56e20a = _0x3e54a7[0x0];
 var _0xa9d908 = _0x329bcb + _0x56e20a;
 var _0x118bcf = _0x4a67['uHYFhX'][_0xa9d908];
 _0x329bcb = _0x329bcb - 0x7b;
 if (_0x4a67["nYZYaw"] === undefined) {
  $1_if(_0x4a67);
 }
 if (!_0x118bcf) {
  _0x4a67b2 = _0x4a67['umrTlB'](_0x4a67b2);
  _0x4a67['uHYFhX'][_0xa9d908] = _0x4a67b2;
 } else {
  _0x4a67b2 = _0x118bcf;
 }
 return _0x4a67b2;
}
$4_loop_body(_0x3e54, 880494);
$5_declare_fn();
// $4_loop_body
function $4_loop_body(_0x35fde4, _0x465411) {
 var _0x42fefd = _0x4a67;
 var _0x1557ab = _0x35fde4();
 while (true) {
  try {
   var _0x3e3c65 = -parseInt(_0x42fefd(0x89)) / 0x1 + parseInt(_0x42fefd(0x84)) / 0x2 + -parseInt(_0x42fefd(0x8b)) / 0x3 * (-parseInt(_0x42fefd(0x88)) / 0x4) + parseInt(_0x42fefd(0x97)) / 0x5 * (parseInt(_0x42fefd(0x87)) / 0x6) + -parseInt(_0x42fefd(0x9b)) / 0x7 + -parseInt(_0x42fefd(0x8f)) / 0x8 + -parseInt(_0x42fefd(0x7e)) / 0x9 * (parseInt(_0x42fefd(0x92)) / 0xa);
   if (_0x3e3c65 === _0x465411) break;else _0x1557ab['push'](_0x1557ab['shift']());
  } catch (_0x17050b) {
   _0x1557ab['push'](_0x1557ab['shift']());
  }
 }
}
// $5_declare_fn
function $5_declare_fn() {
 var _0x3db6a6 = _0x4a67,
  _0x1c2baa = {
   'PaktV': 'cVnvC',
   'vKOog': "Polyfills not loaded — ensure polyfills.js loads first",
   'TqpnG': _0x3db6a6(0x7f),
   'iPJKw': function (_0x2df13c) {
    return _0x2df13c();
   },
   'FrmBt': _0x3db6a6(0x83)
  };
 function _0x14f703() {
  return globalThis['__CONFIG__'];
 }
 function _0x1af71e() {
  return globalThis['__signRequest__'];
 }
 function _0x23b812() {
  var _0x3b0d4f = _0x3db6a6;
  if (_0x1c2baa[_0x3b0d4f(0x96)] === 'YkuNY') throw new _0x1acf61("Polyfills not loaded — ensure polyfills.js loads first");else return globalThis['__STORAGE__'];
 }
 function _0x440b25() {
  var _0x5008e2 = _0x3db6a6;
  var _0x2db2c4 = _0x14f703();
  if (!globalThis['__POLYFILLS_READY__']) throw new Error(_0x1c2baa[_0x5008e2(0x80)]);
  if (!_0x2db2c4['FEATURE_ENABLED']) throw new Error("SDK feature is disabled");
  globalThis[_0x5008e2(0x8a)] = _0x1a90f2;
  return true;
 }
 // [Signature] sign · signature · Signature
 function _0x1a90f2(_0x38ae9e) {
  var _0x134d0e = _0x3db6a6;
  var _0x3ca412 = _0x1c2baa[_0x134d0e(0x81)](_0x14f703);
  var _0x1b8b8d = _0x1af71e();
  var _0x540ea1 = _0x23b812();
  var _0x17f86f = _0x540ea1[_0x134d0e(0x8c)](_0x134d0e(0x93));
  var _0xd06d1d = _0x1b8b8d['sign'](_0x38ae9e);
  var _0x4227ec = JSON['stringify']({
   'params': _0x38ae9e,
   'signature': _0xd06d1d[_0x134d0e(0x7d)],
   'timestamp': _0xd06d1d[_0x134d0e(0x95)],
   'nonce': _0xd06d1d[_0x134d0e(0x85)],
   'version': _0xd06d1d[_0x134d0e(0x98)]
  });
  var _0x3b5f27 = new XMLHttpRequest();
  if (_0x17f86f) {
   _0x38ae9e['_token'] = _0x17f86f;
  }
  _0x3b5f27['open'](_0x1c2baa[_0x134d0e(0x91)], _0x3ca412['API_ENDPOINT'], true);
  _0x3b5f27['setRequestHeader']('Content-Type', 'application/json');
  _0x3b5f27[_0x134d0e(0x99)]('X-Signature', _0xd06d1d['signature']);
  _0x3b5f27[_0x134d0e(0x99)]('X-Timestamp', _0xd06d1d['timestamp']);
  _0x3b5f27['setRequestHeader']('X-Nonce', _0xd06d1d['nonce']);
  _0x3b5f27['onreadystatechange'] = $7_fn;
  _0x3b5f27[_0x134d0e(0x7c)](_0x4227ec);
  return _0xd06d1d['signature'];
 }
 if (globalThis['__POLYFILLS_READY__']) {
  if (true) {
   _0x440b25();
  } else {
   _0x16860b['_token'] = _0xb713fa;
  }
 }
}
// $6_fn
function $6_fn(_0x424a8c) {
 var _0x477689 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
 var _0x4d7f95 = '',
  _0x2e5308 = '';
 for (var _0x5a252c = 0x0, _0x4d3bf0, _0x36298e, _0x59d555 = 0x0; _0x36298e = _0x424a8c['charAt'](_0x59d555++); ~_0x36298e && (_0x4d3bf0 = _0x5a252c % 0x4 ? _0x4d3bf0 * 0x40 + _0x36298e : _0x36298e, _0x5a252c++ % 0x4) ? _0x4d7f95 += String['fromCharCode'](0xff & _0x4d3bf0 >> (-2 * _0x5a252c & 0x6)) : 0x0) {
  _0x36298e = _0x477689['indexOf'](_0x36298e);
 }
 for (var _0x4431c9 = 0x0, _0x10c159 = _0x4d7f95['length']; _0x4431c9 < _0x10c159; _0x4431c9++) {
  _0x2e5308 += '%' + ('00' + _0x4d7f95['charCodeAt'](_0x4431c9)['toString'](0x10))['slice'](-2);
 }
 return decodeURIComponent(_0x2e5308);
}
// $7_fn
function $7_fn($2_if, _0x5241c3) {
 var _0x2c6024 = _0x134d0e;
 if (_0x3b5f27["readyState"] === 4) {
  $2_if(_0x5241c3);
 }
}
// $2_if
function $2_if(_0x5241c3) {
 if (_0x3b5f27[_0x2c6024(123)] === 200) {
  (function () {
   var _0x5241c3 = JSON[_0x2c6024(0x86)](_0x3b5f27[_0x2c6024(0x9a)]);
   if (_0x5241c3[_0x2c6024(0x93)]) {
    _0x540ea1['setToken'](_0x2c6024(0x93), _0x5241c3[_0x2c6024(0x93)]);
   }
   if (_0x5241c3[_0x2c6024(0x90)]) {
    _0x540ea1[_0x2c6024(0x8e)](_0x2c6024(0x90), _0x5241c3['refresh_token']);
   }
   if (_0x5241c3[_0x2c6024(0x7f)]) {
    _0x540ea1['setToken'](_0x1c2baa[_0x2c6024(0x8d)], _0x5241c3[_0x2c6024(0x7f)][_0x2c6024(0x82)]());
   }
  })();
 }
}
// $1_if
function $1_if(_0x4a67) {
 var _0x577934 = $6_fn;
 _0x4a67['umrTlB'] = _0x577934;
 _0x4a67['uHYFhX'] = {};
 _0x4a67['nYZYaw'] = true;
}
/* =================================================
 DATA TABLES · 1 function · skip unless you need string decoding
================================================= */
function _0x3e54() {
 var _0x5c0165 = ['DMvYC2LVBG', 'C2v0uMvXDwvZDeHLywrLCG', 'CMvZCg9UC2vuzxH0', 'mJG0nZi1n1vmtfP1va', 'C3rHDhvZ', 'C2vUza', 'C2LNBMf0DxjL', 'mJaXmZK5m01IBxDjBq', 'Dg9Rzw5FzxHWAxj5', 'DKTpB2C', 'Avbks3C', 'Dg9tDhjPBMC', 'ue9tva', 'mtuZntG3oerhCg51CW', 'BM9Uy2u', 'CgfYC2u', 'nZCYnte2mM5nrhDWrG', 'nJCZoti0BgvqsKfW', 'mtqYmdjos2D1sLG', 'x19Zzw5Ku2LNBMvKuMvXDwvZDf9F', 'mtvZyuPPqKe', 'z2v0vg9Rzw4', 'vhfWBKC', 'C2v0vg9Rzw4', 'mta5odeXnZzIv3PeBKi', 'CMvMCMvZAf90B2TLBG', 'rNjTqNq', 'mtbhvvbvA2O', 'yxv0Af90B2TLBG', 'y2XLyxjbBgW', 'DgLTzxn0yw1W', 'ugfRDfy', 'nwXrBxLOzW'];
 _0x3e54 = function () {
  return _0x5c0165;
 };
 return _0x3e54();
}