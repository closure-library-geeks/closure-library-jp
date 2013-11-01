// Copyright 2008 The Closure Library Authors. All Rights Reserved.
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
 * @fileoverview 関数作成のためのユーティリティ。Java のクラスを参考にしている。
 *
 * @author nicksantos@google.com (Nick Santos)
 */


goog.provide('goog.functions');


/**
 * 定関数を作成して返す。
 * @param {T} retValue 定関数が返す値。
 * @return {function():T} 作成された関数。
 * @template T
 */
goog.functions.constant = function(retValue) {
  return function() {
    return retValue;
  };
};


/**
 * 常に `false` を返す定関数。
 * @type {function(...): boolean}
 */
goog.functions.FALSE = goog.functions.constant(false);


/**
 * 常に `true` を返す定関数。
 * @type {function(...): boolean}
 */
goog.functions.TRUE = goog.functions.constant(true);


/**
 * 常に `null` を返す定関数。
 * @type {function(...): null}
 */
goog.functions.NULL = goog.functions.constant(null);


/**
 * 常に第一引数を返す関数。
 * @param {T=} opt_returnValue この関数が返す値。
 * @param {...*} var_args 無視される可変長引数。
 * @return {T} 与えられた第一引数。
 * @template T
 */
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * 指定したエラーメッセージでエラーを発生させる関数を作成して返す。
 * @param {string} message エラーメッセージ。
 * @return {!Function} エラーを発生させる関数。
 */
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  };
};


/**
 * 与えられたオブジェクトを例外として発生させる関数を作成して返す。
 * @param {*} err 投げられる例外。
 * @return {!Function} 例外を発生させる関数。
 */
goog.functions.fail = function(err) {
  return function() {
    throw err;
  }
};


/**
 * 与えられた関数を `opt_numArgs` で指定された個数の引数で実行する関数を返す。
 *  `opt_numArgs` の数以降の引数は無視される。
 * @param {Function} f 元の関数。
 * @param {number=} opt_numArgs `f` に渡す引数の個数。初期値は `0`。
 * @return {!Function} `opt_numArgs` で指定された数の引数
 */
goog.functions.lock = function(f, opt_numArgs) {
  opt_numArgs = opt_numArgs || 0;
  return function() {
    return f.apply(this, Array.prototype.slice.call(arguments, 0, opt_numArgs));
  };
};


/**
 * `n` 番目の引数を返す関数を作成して返す。
 * @param {number} n 作成される関数が返す引数の位置。
 * @return {!Function} 作成された関数。
 */
goog.functions.nth = function(n) {
  return function() {
    return arguments[n];
  };
};


/**
 * 与えられた関数の戻り値を指定した値に差し替えた関数を作成して返す。
 * @param {Function} f 元の関数。
 * @param {T} retValue 新しい戻り値。
 * @return {function(...[?]):T} 作成された関数。
 * @template T
 */
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue));
};


/**
 * 与えられた関数からなる合成関数を作成して返す。
 *
 * 例：`(goog.functions.compose(f, g))(a)` は `f(g(a))` と等価である。
 * @param {function(...[?]):T} fn 最後に合成される関数。
 * @param {...Function} var_args 関数からなる配列。
 * @return {function(...[?]):T} 作成された合成関数。
 * @template T
 */
goog.functions.compose = function(fn, var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if (length) {
      result = functions[length - 1].apply(this, arguments);
    }

    for (var i = length - 2; i >= 0; i--) {
      result = functions[i].call(this, result);
    }
    return result;
  };
};


/**
 * 与えられた関数を順に実行する関数を作成して返す。この関数の戻り値は最後の関数
 * の戻り値となる。
 *
 * 例：`(goog.functions.sequence(f, g))(x)` は 'f(x),g(x)' と等価である。
 * @param {...Function} var_args 関数からなる配列。
 * @return {!Function} 与えられた関数を順に実行する関数。
 */
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for (var i = 0; i < length; i++) {
      result = functions[i].apply(this, arguments);
    }
    return result;
  };
};


/**
 * 与えられた間数列の戻り値の論理積を返す関数を作成して返す。ある関数が `false`
 * を返した時点で `false` を返すので、ショートサーキット評価である。
 *
 * 例：`(goog.functions.and(f, g))(x)` は `f(x) && g(x)` と等価である。
 * @param {...Function} var_args 関数からなる配列。
 * @return {function(...[?]):boolean} 与えられた関数列の戻り値の論理積を返す関
 *     数。
 */
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for (var i = 0; i < length; i++) {
      if (!functions[i].apply(this, arguments)) {
        return false;
      }
    }
    return true;
  };
};


/**
 * 与えられた間数列の戻り値の論理和を返す関数を作成して返す。ある関数が `true`
 * を返した時点で `true` を返すので、ショートサーキット評価である。
 *
 * 例：`(goog.functions.or(f, g))(x)` は `f(x) || g(x)` と等価である。
 * @param {...Function} var_args 関数からなる配列。
 * @return {function(...[?]):boolean} 与えられた関数列の戻り値の論理和を返す関
 *     数。
 */
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for (var i = 0; i < length; i++) {
      if (functions[i].apply(this, arguments)) {
        return true;
      }
    }
    return false;
  };
};


/**
 * 与えられた関数の戻り値の否定論理を返す関数を作成して返す。
 *
 * 例：`(goog.functions.not(f))(x)` は `!f(x)` と等価である。
 * @param {!Function} f 元の関数。
 * @return {function(...[?]):boolean} 与えられた関数の戻り値の論理否定を返す関
 *     数。
 */
goog.functions.not = function(f) {
  return function() {
    return !f.apply(this, arguments);
  };
};


/**
 * 指定したコンストラクタと引数からオブジェクトを作成して返す。
 * オブジェクトファクトリとして使える。
 *
 * この関数を呼び出すとき、コンパイラによる型チェックをくぐり抜けられるように
 * キャストしてあげる必要があるだろう。
 * @param {!Function} constructor オブジェクトのコンストラクタ。
 * @param {...*} var_args コンストラクタに渡される可変長引数。
 * @return {!Object} `constructor` によって作成されたオブジェクト。
 */
goog.functions.create = function(constructor, var_args) {
  /** @constructor */
  var temp = function() {};
  temp.prototype = constructor.prototype;

  // `obj` は与えられた `constructor` の `prototype` チェーンをもっているので
  // `obj instanceof constructor` は `true` となる。
  var obj = new temp();

  // `obj` を `constructor` で初期化する。`arguments` を `shift()` した結果を得
  // るために `Array` の `prototype` 関数を用いている。
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj;
};


/**
 * @define {boolean} 戻り値にキャッシュを使うかどうか。この値はテストの際に無効
 *     にされるべきである。
 */
goog.define('goog.functions.CACHE_RETURN_VALUE', true);


/**
 * パラメータのない関数の呼び出しをキャッシュする関数を作成して返す。
 *
 * この関数が最初に呼び出されたとき、この戻り値がキャッシュされる（この関数は冪
 * 等性をもっていなければならない）。次回以降の呼び出しでは、キャッシュされてい
 * た値が返される。また、処理の重い関数を最初の呼び出しまで遅延させるという使い
 * 方も可能である。
 *
 *
 * 引数付きでキャッシュしたい場合には `goog.memoize` を参照。
 *
 * @param {!function():T} fn 遅延評価される関数。
 * @return {!function():T} `fn` をラップした関数。
 * @template T
 */
goog.functions.cacheReturnValue = function(fn) {
  var called = false;
  var value;

  return function() {
    if (!goog.functions.CACHE_RETURN_VALUE) {
      return fn();
    }

    if (!called) {
      value = fn();
      called = true;
    }

    return value;
  }
};
