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
 * @fileoverview クラスの追加・削除・設定を行うユーティリティ.
 * javascript標準のElement.classListよりもgoog.dom.classlist
 * に近い実装のため、処理が高速 (毎回文字列解析するのではなく
 * ネイティブメソッドを利用)かつコンパイルの圧縮性能が高くなっている.
 *
 * Note: このユーティリティはHTMLElementの操作をおこなうものであり、
 * その他のインターフェイスでは動作しない.(例： SVGElements では動作しない).
 *
 */


goog.provide('goog.dom.classes');

goog.require('goog.array');


/**
 * クラス名を要素にセット(上書き)する.
 * @param {Node} element クラスをセットするDOMノード.
 * @param {string} className 適用するクラス名(複数クラス可).
 */
goog.dom.classes.set = function(element, className) {
  element.className = className;
};


/**
 * 要素が持っているクラス名のリストを返す
 * @param {Node} element クラスを取得するDOMノード.
 * @return {!Array} elementのクラス名. 
 *     ブラウザによってArrayに特別なプロパティが追加されることが有るが、
 *     それらのプロパティには依存しない.
 */
goog.dom.classes.get = function(element) {
  var className = element.className;
  // Some types of elements don't have a className in IE (e.g. iframes).
  // Furthermore, in Firefox, className is not a string when the element is
  // an SVG element.
  return goog.isString(className) && className.match(/\S+/g) || [];
};


/**
 * クラス(複数可)を要素に追加する.
 * クラス名が重複して登録されることはない.
 * @param {Node} クラスを追加するDOMノード.
 * @param {...string} 追加するクラス(複数可).
 * @return {boolean} クラスがすべて追加されれば(もしくは存在していれば)
 * Trueを返す.
 */
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  goog.dom.classes.set(element, classes.join(' '));
  return classes.length == expectedCount;
};


/**
 * クラス(複数可)を要素から削除する.
 * @param {Node} クラスを削除するDOMノード.
 * @param {...string} 削除するクラス(複数可).
 * @return {boolean} var_argsのクラスがすべて存在し、削除できればTrueを返す.
 */
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var newClasses = goog.dom.classes.getDifference_(classes, args);
  goog.dom.classes.set(element, newClasses.join(' '));
  return newClasses.length == classes.length - args.length;
};


/**
 * goog.dom.classes.add と goog.dom.classes.addRemoveの
 * ヘルパーメソッド. クラス配列に１つ以上のクラスを追加する.
 * @param {Array.<string>} classes element要素のすべてのクラス名が入った
 *     クラス配列.この引数に args を追加する.
 * @param {Array.<string>} args 追加するクラス名の配列
 * @private
 */
goog.dom.classes.add_ = function(classes, args) {
  for (var i = 0; i < args.length; i++) {
    if (!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
    }
  }
};


/**
 * goog.dom.classes.remove と goog.dom.classes.addRemoveのヘルパーメソッド.
 * 2つの配列の差分を返す.
 * @param {!Array.<string>} arr1 1つ目の配列.
 * @param {!Array.<string>} arr2 2つ目の配列.
 * @return {!Array.<string>} 1つ目の配列の要素の内、２つ目の配列に無い
 *     要素の配列.
 * @private
 */
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return goog.array.filter(arr1, function(item) {
    return !goog.array.contains(arr2, item);
  });
};


/**
 * クラス名を入れ替える. 入れ替え対象外のクラスは保持される.
 * fromClassが削除されなければ、toClassは追加されない.
 * @param {Node} element クラスを入れ替える対象のDOMノード.
 * @param {string} fromClass 削除するクラス名.
 * @param {string} toClass 追加するクラス名.
 * @return {boolean} クラスを入れ替える事ができればTrueを返す.
 */
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);

  var removed = false;
  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true;
    }
  }

  if (removed) {
    classes.push(toClass);
    goog.dom.classes.set(element, classes.join(' '));
  }

  return removed;
};


/**
 * クラスの追加と削除を１度に行う.(追加・削除どちらのクラスも0個以上)
 * goog.dom.classes.add と goog.dom.classes.remove を個別に呼ぶことと異なり、 
 * 1度で効率的にクラスの書き換えを行う.
 *
 * もし同じクラスが削除・追加の両方のリストにある場合、クラスは追加される.
 * 従って、このメソッドを使えば goog.dom.classes.swap の代わりに2つ以上の
 * クラスを入れ替える事ができる.
 *
 * @param {Node} element クラスを入れ替える対象のDOMノード.
 * @param {?(string|Array.<string>)} classesToRemove 削除するクラス(複数可). 
 *     nullにすればクラスは削除されません.
 * @param {?(string|Array.<string>)} classesToAdd 追加するクラス(複数可). 
 *     nullにすればクラスは追加されません.
 */
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if (goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove);
  } else if (goog.isArray(classesToRemove)) {
    classes = goog.dom.classes.getDifference_(classes, classesToRemove);
  }

  if (goog.isString(classesToAdd) &&
      !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd);
  } else if (goog.isArray(classesToAdd)) {
    goog.dom.classes.add_(classes, classesToAdd);
  }

  goog.dom.classes.set(element, classes.join(' '));
};


/**
 * 要素がクラス名を持っているかどうかを返す.
 * @param {Node} element 確認対象のDOMノード.
 * @param {string} className 確認するクラス名.
 * @return {boolean} element が className を持っていればTrueを返す.
 */
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className);
};


/**
 * enabled引数に従ってクラスを追加または削除します.
 * @param {Node} element 追加・削除する対象のDOMノード.
 * @param {string} className 追加・削除するクラス名.
 * @param {boolean} enabled 追加するか、削除するか (true で追加, false で削除).
 */
goog.dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classes.add(element, className);
  } else {
    goog.dom.classes.remove(element, className);
  }
};


/**
 * 要素がクラスを持っていれば削除し、持ってなければ追加します.
 * 他のクラス名には影響しません.
 * @param {Node} element クラスを切り替える対象のDOMノード.
 * @param {string} className 切り替えるクラス.
 * @return {boolean} 追加されたらTrue, 削除されたらFalseを返します. 
 *     (言い換えると、このメソッドを呼んだあとに element が  className
 *      を持っているかどうかを返します.)
 */
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};
