// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview オブジェクト・マップ・ハッシュを操作するためのユーティリティ。.
 */

goog.provide('goog.object');


/**
 * オブジェクト・マップ・ハッシュの各要素毎に関数を実行する。
 *
 * @param {Object.<K,V>} obj 走査したいオブジェクト。
 * @param {function(this:T,V,?,Object.<K,V>):?} f 各要素について実行される関数。
 *     この関数は要素の値・インデックス・走査しているオブジェクトの 3 つの引数を
 *     とる。戻り値は無視される。
 * @param {T=} opt_obj `f` を実行する際の `this` に設定されるオブジェクト。
 * @template T,K,V
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * オブジェクト・マップ・ハッシュの各要素毎に関数を実行し、この関数が `true`
 * を返した要素からなる新しいオブジェクトを返す。
 *
 * @param {Object.<K,V>} obj 走査したいオブジェクト。
 * @param {function(this:T,V,?,Object.<K,V>):boolean} f 各要素について実行される
 *     関数。この関数は要素の値・インデックス・走査しているオブジェクトの 3 つの
 *     引数をとり、戻り値は真偽値のほうがよい。この関数が `true` を返すとき、
 *     要素は新しいオブジェクトに追加され、`false` を返すときは追加されない。
 * @param {T=} opt_obj `f` を実行する際の `this` に設定されるオブジェクト。
 * @return {!Object.<K,V>} `f` で `true` を返された要素からなる新しいオブジェク
 *     ト。
 * @template T,K,V
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * オブジェクト・マップ・ハッシュの各要素毎に関数を実行し、この関数の戻り値から
 * なる新しいオブジェクトを返す。
 *
 * @param {Object.<K,V>} obj 走査したいオブジェクト。
 * @param {function(this:T,V,?,Object.<K,V>):R} f 各要素について実行される関数。
 *     この関数は要素の値・インデックス・走査しているオブジェクトの 3 つの引数を
 *     とり、何らかの戻り値を返す必要がある。この戻り値は新しいオブジェクトに追
 *     加される。
 * @param {T=} opt_obj `f` を実行する際の `this` に設定されるオブジェクト。
 * @return {!Object.<K,R>} `f` の戻り値から鳴る新しいオブジェクト。
 * @template T,K,V,R
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * オブジェクト・マップ・ハッシュの各要素毎に指定された関数を実行し、この関数が
 * `true` を返すとき、`some` は `true` を返す（残りの要素は処理されない）。
 * また、すべての呼び出しについて `false` を返すとき、`some` は `false` を返す。
 *
 * @param {Object.<K,V>} obj 走査したいオブジェクト。
 * @param {function(this:T,V,?,Object.<K,V>):boolean} f 各要素について実行される
 *     関数。この関数は要素の値・インデックス・走査しているオブジェクトの 3 つの
 *     引数をとり、戻り値は真偽値のほうがよい。
 * @param {T=} opt_obj `f` を実行する際の `this` に設定されるオブジェクト。
 * @return {boolean} すべての要素について `true` のとき、`true`。
 * @template T,K,V
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * オブジェクト・マップ・ハッシュの各要素毎に指定された関数を実行し、この関数が
 * `false` を返すとき、`some` は `false` を返す（残りの要素は処理されない）。
 * また、すべての呼び出しについて `true` を返すとき、`some` は `true` を返す。
 *
 * @param {Object.<K,V>} obj 走査したいオブジェクト。
 * @param {?function(this:T,V,?,Object.<K,V>):boolean} f 各要素について実行される
 *     関数。この関数は要素の値・インデックス・走査しているオブジェクトの 3 つの
 *     引数をとり、戻り値は真偽値のほうがよい。
 * @param {T=} opt_obj `f` を実行する際の `this` に設定されるオブジェクト。
 * @return {boolean} すべての要素について `false` のとき、`false`。
 * @template T,K,V
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * オブジェクトの要素の数（キーと値のペア数）を返す。
 *
 * @param {Object} obj 要素数を数えたいオブジェクト。
 * @return {number} このオブジェクトの要素数。
 */
goog.object.getCount = function(obj) {
  // JS1.5 では `__count__` は廃止されているため、警告がでてしまう。つまり、使う
  // べきではない。また、`__count__` は実際のオブジェクトに含まれる要素のみをカ
  // ウントする（プロトタイプチェインに含まれるものは含まれない）。
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * オブジェクトの適当なキーを返す（存在するならば）。
 * 多くのブラウザでは、オブジェクトリテラルの最初のキーになる（ただし Konqueror
 * は例外）。
 *
 * @param {Object} obj 適当なキーを得たいオブジェクト。
 * @return {string|undefined} 適当なキー。オブジェクトが空なら `undefined `。
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * オブジェクトの適当な値を返す（存在するならば）。
 * 多くのブラウザでは、オブジェクトリテラルの最初の値になる（ただし Konqueror
 * は例外）。
 *
 * @param {Object.<K,V>} obj 適当なキーを得たいオブジェクト。
 * @return {V|undefined} 適当な値。オブジェクトが空なら `undefined `。
 * @template K,V
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * オブジェクト・マップ・ハッシュが与えられた要素を含むかどうかを判定する。
 * `goog.object.containsValue` のエイリアスである。
 *
 * @param {Object.<K,V>} obj 判定対象となるオブジェクト。
 * @param {V} val 判定に使われる値。
 * @return {boolean} `val` がオブジェクトに存在するならば `true`。
 * @template K,V
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * オブジェクト・マップ・ハッシュの値からなる配列を返す。
 *
 * @param {Object.<K,V>} obj オブジェクト。
 * @return {!Array.<V>} オブジェクト・マップ・ハッシュの値からなる配列。
 * @template K,V
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * オブジェクト・マップ・ハッシュのキーからなる配列を返す。
 *
 * @param {Object} obj オブジェクト。
 * @return {!Array.<string>} オブジェクトのキーからなる配列。
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * ネストされたオブジェクトから値を返す。これは JSON レスポンスのような幾重にも
 * ネストされたオブジェクトから値を取得するのに役立つ。
 *
 * 使い方：
 *
 * ```
 * getValueByKeys(jsonObj, 'foo', 'entries', 3)
 * ```
 *
 * @param {!Object} obj オブジェクトまたは配列のようなオブジェクト。
 * @param {...(string|number|!Array.<number|string>)} var_args キーまたはイン
 *     デックス、またはそれらからなる配列・配列のようなオブジェクト。
 * @return {*} 得られた値。もし、該当する値がなければ `undefined`。
 */
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;

  // 可変長引数の場合は第二引数から始める。
  for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }

  return obj;
};


/**
 * オブジェクト・マップ・ハッシュが与えられたキーを含むかどうかを判定する。
 *
 * @param {Object} obj 判定対象のオブジェクト。
 * @param {*} key 判定に使われるキー。
 * @return {boolean} オブジェクトが `key` を含むのなら `true`。
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * オブジェクト・マップ・ハッシュが与えられた値を含むかどうかを判定する。
 * この関数のオーダーは O(n) である。
 *
 * @param {Object.<K,V>} obj 判定対象のオブジェクト。
 * @param {V} val 判定に使われる値。
 * @return {boolean} オブジェクトが `val` を含むのならば `true`。
 * @template K,V
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * オブジェクトから条件に合致するキーを検索し、これを返す。
 * @param {Object.<K,V>} obj 検索対象のオブジェクト。
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f 各値について実行
 *     される関数。この関数は値・キー・走査しているオブジェクトの 3 つの
 *     引数をとり、戻り値は真偽値のほうがよい。
 * @param {T=} opt_this `f` を実行する際の `this` に設定されるオブジェクト。
 * @return {string|undefined} 条件に合致したキー。条件に合致したキーがなければ
 *     `undefined`。
 * @template T,K,V
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * オブジェクトから条件に合致する値を検索し、これを返す。
 * @param {Object.<K,V>} obj 検索対象のオブジェクト。
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f 各値について実行
 *     される関数。この関数は値・キー・走査しているオブジェクトの 3 つの
 *     引数をとり、戻り値は真偽値のほうがよい。
 * @param {T=} opt_this `f` を実行する際の `this` に設定されるオブジェクト。
 * @return {V} 条件に合致した値。条件に合致した値がなければ `undefined`。
 * @template T,K,V
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * オブジェクト・マップ・ハッシュが空かどうかを判定する。
 *
 * @param {Object} obj 判定対象のオブジェクト。
 * @return {boolean} オブジェクトが空であれば `true`。
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * オブジェクト・マップ・ハッシュのすべてのキーと対応する値を除去する。
 *
 * @param {Object} obj 除去対象のオブジェクト。
 */
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};


/**
 * 与えられたキーと対応する値を除去する。
 *
 * @param {Object} obj 除去対象のオブジェクト。
 * @param {*} key 除去に使われるキー。
 * @return {boolean} 除去できれば `true`。
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * キーと対応する値をオブジェクトに追加する。キーが既に存在すれば、例外を発生
 * させる。既に存在しているキーの値を変更したければ、代わりに `set` を使うべき。
 *
 * @param {Object.<K,V>} obj 追加対象のオブジェクト。
 * @param {string} key 追加するキー。
 * @param {V} val 追加する値。
 * @template K,V
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * 与えられたキーと対応する値を返す。
 *
 * @param {Object.<K,V>} obj オブジェクト。
 * @param {string} key 値と対応するキー。
 * @param {R=} opt_val `key` と対応する値がなかったときに返される値。初期値は
 *     `undefined`。
 * @return {V|R|undefined} `key` と対応する値。なければ `undefined`。
 * @template K,V,R
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * キーと対応する値をオブジェクトに追加する。 *
 *
 * @param {Object.<K,V>} obj 追加対象のオブジェクト。
 * @param {string} key 追加するキー。
 * @param {V} val 追加する値。
 * @template K,V
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * キーと対応する値をオブジェクトに追加する。キーが既に存在すれば、何もしない。
 *
 * @param {Object.<K,V>} obj 追加対象のオブジェクト。
 * @param {string} key 追加するキー。
 * @param {V} val 追加する値。
 * @return {V} `key` と対応する値。キーが既に存在していた場合は、これに対応する
 *     値。
 * @template K,V
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * オブジェクトを浅く複製する。
 *
 * @param {Object.<K,V>} obj 複製するオブジェクト。
 * @return {!Object.<K,V>} 複製されたオブジェクト。
 * @template K,V
 */
goog.object.clone = function(obj) {
  // ここではプロトタイプによる手法が使えない。多くのメソッドが実際のキーに依存
  // しているからである。

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // ここでは `goog.mixin` を使うこともできるが、それとは独立させる意図がある。
};


/**
 * 値を複製する。オブジェクト・配列・基本型が入力できる。オブジェクトや配列は、
 * 再帰的に複製される。
 *
 * 警告：
 * `goog.object.unsafeClone` は循環参照を検知できない。したがって、オブジェクト
 * が循環参照を含む場合は、無限再帰が発生する。
 *
 * `goog.object.unsafeClone` は、`getUid` による固有の識別子を考慮しない。した
 * がって、複製されたオブジェクトも同じ固有識別子をもつことになる。
 *
 * @param {*} obj 複製するオブジェクト。
 * @return {*} 複製されたオブジェクト。
 */
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * キーと値が転置した新しいオブジェクトを返す（キーは値に、値はキーになる）。
 * もし、同一の値が存在する場合はどちらの値が使われるかは実装依存である。
 *
 * @param {Object} obj 転置するオブジェクト。
 * @return {!Object} 転置されたオブジェクト。
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * `object.prototype` に定義されているキーの名前。
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * オブジェクトを他のオブジェクトにあわせて拡張する。
 * この操作は破壊的である。新しいオブジェクトは作成されない。
 *
 * 例：
 *
 * ```
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {c: 2});
 * o; // {a: 0, b: 1, c: 2}
 * ```
 *
 * @param {Object} target  拡張されるオブジェクト。
 * @param {...Object} var_args 複製される値を持つオブジェクト。
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // IE の for-in ループでは、プロトタイプオブジェクトにある列挙可能ではないプ
    // ロパティを処理できない（例：`Object.prototype` の `isPrototypeOf`）。
    // また、`String` を拡張したオブジェクトの `replace` も同様である（`Object`
    // を拡張したものについては異なる）。

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * キー・値と並んだ可変長引数あるいは配列から、新しいオブジェクトを作成する。
 * @param {...*} var_args キー・値と並んだ偶数の長さを持つ可変長引数。もし、
 *     与えられた引数がひとつで、かつ配列であればこの配列を可変長引数とみなす。
 * @return {!Object} 作成されたオブジェクト。
 * @throws {Error} 与えられた可変長引数・配列の長さが偶数でなければエラーが発生
 *     する。
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * 可変長引数または配列をキーとして、値をすべて `true` とした新しいオブジェクト
 * を作成する。
 * @param {...*} var_args 新しいオブジェクトのキーとして使われるオブジェクトから
 *     なる可変長引数。与えられた引数が一つで、かつこれが配列であればこの配列を
 *     可変長引数とみなす。
 * @return {!Object} 作成されたオブジェクト。
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};


/**
 * 与えられたオブジェクトからイミュータブルなオブジェクトを作成して返す（ブラウ
 * ザがイミュータブルオブジェクトをサポートしていれば）。
 *
 * 通常では、作成されたイミュータブルオブジェクトへの書き込みは無視され、
 * strict モードでは、エラーが発生する。
 *
 * @param {!Object.<K,V>} obj オブジェクト。
 * @return {!Object.<K,V>} 作成されたイミュータブルなオブジェクト。ブラウザが
 *     イミュータブルなオブジェクトをサポートしていなければ元のオブジェクトが返
 *     される。
 * @template K,V
 */
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};


/**
 * オブジェクトがイミュータブルかどうかを判定する。
 * @param {!Object} obj オブジェクト。
 * @return {boolean} オブジェクトがイミュータブルであれば `true`。
 */
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};
