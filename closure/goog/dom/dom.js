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
 * @fileoverview ブラウザの Document Object Model を操作するためのユーティリ
 * ティ。mochikit (`http://mochikit.com/`) をかなり参考にした。
 *
 * 異なる `document` オブジェクト間では `goog.dom.DomHelper` を作成して使うこと
 * ができる。これは、フレームや異なる `window` をまたいで動作させるときに便利で
 * ある。
 */


// TODO(arv): Rename/refactor getTextContent and getRawTextContent. The problem
// is that getTextContent should mimic the DOM3 textContent. We should add a
// getInnerText (or getText) which tries to return the visible text, innerText.


goog.provide('goog.dom');
goog.provide('goog.dom.Appendable');
goog.provide('goog.dom.DomHelper');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.BrowserFeature');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.functions');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * @define {boolean} Quirks（互換）モードで動作させるかどうか。
 */
goog.define('goog.dom.ASSUME_QUIRKS_MODE', false);


/**
 * @define {boolean} Standard（標準）モードで動作させるかどうか。
 */
goog.define('goog.dom.ASSUME_STANDARDS_MODE', false);


/**
 * Compatibility（互換）モードで動作しているかどうか。
 * @type {boolean}
 * @private
 */
goog.dom.COMPAT_MODE_KNOWN_ =
    goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;


/**
 * 現在の `document` に対応する `DomHelper` を返す。
 * @param {(Node|Window)=} opt_element もし指定されたならば、この要素についての
 *     `Domhelper` を返す。
 * @return {!goog.dom.DomHelper} `Domhelper`。
 */
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ?
      new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) :
      (goog.dom.defaultDomHelper_ ||
          (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper()));
};


/**
 * 標準の `DomHelper` のキャッシュ。
 * @type {goog.dom.DomHelper}
 * @private
 */
goog.dom.defaultDomHelper_;


/**
 * 現在の `document` オブジェクトを返す。DOM のためのライブラリで使われている。
 * @return {!Document} Document object.
 */
goog.dom.getDocument = function() {
  return document;
};


/**
 * 指定した ID をもつ要素を現在の `document` から取得して返す。
 *
 * `Element` が与えられたときはそのまま返す。
 *
 * @param {string|Element} element 要素の ID か DOM ノード。
 * @return {Element} 指定した ID をもつ要素、または与えられた DOM ノード。
 */
goog.dom.getElement = function(element) {
  return goog.dom.getElementHelper_(document, element);
};


/**
 * 指定した ID をもつ要素を与えられた `document` から取得して返す。
 * `Element` が与えられたときはそのまま返す。
 * @param {!Document} doc `document`。
 * @param {string|Element} element 要素の ID。
 * @return {Element} 指定した ID をもつ要素、または与えられた DOM ノード。
 * @private
 */
goog.dom.getElementHelper_ = function(doc, element) {
  return goog.isString(element) ?
      doc.getElementById(element) :
      element;
};


/**
 * 指定した ID で要素を取得する。要素が見つからなかったときは例外を発生させる。
 *
 * 要素が存在すると期待されるときで、かつ要素が見つからないときアサーションに
 * よって例外を発生させたいときに使う（アサーションが有効であれば例外が発生）。
 *
 * @param {string} id 要素の ID。
 * @return {Element} 指定した ID をもつ要素（存在するならば）。
 */
goog.dom.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(document, id);
};


/**
 * `getRequiredElement` の実装。静的なものと `DomHelper` にあるものの二つある。
 * 指定された ID をもつ要素があるかどうかアサートされる。
 * @param {!Document} doc `document`。
 * @param {string} id 要素の ID。
 * @return {Element} 指定した ID をもつ要素、または与えられた DOM ノード。
 * @private
 */
goog.dom.getRequiredElementHelper_ = function(doc, id) {
  // To prevent users passing in Elements as is permitted in getElement().
  goog.asserts.assertString(id);
  var element = goog.dom.getElementHelper_(doc, id);
  element = goog.asserts.assertElement(element,
      'No element found with id: ' + id);
  return element;
};


/**
 * `getElement` のエイリアス。
 * @param {string|Element} element 要素の ID か DOM ノード。
 * @return {Element} 指定した ID をもつ要素、または与えられた DOM ノード。
 * @deprecated `goog.dom.getElement` を使うべき。
 */
goog.dom.$ = goog.dom.getElement;


/**
 * タグ名、あるいはクラス名から要素を検索して返す。可能であれば、ブラウザによる
 * ネイティブ実装（`querySelectorAll`、`getElementsByTagName`、
 * `getElementsByClassName`）を使う。この関数は、取得したい要素の特徴が限定され
 * るときに役にたつ。また、`goog.gom.query` では CSS3 のセレクタ式を使えために
 * さらに強力で一般的な方法を利用できるが、実行コストが高くつく。もし、あるタグ
 * が一つのクラスにしか属していないような場合にはこちらの方がより速く、エレガン
 * である。
 *
 * @see `goog.dom.query`
 *
 * @param {?string=} opt_tag 要素のタグ名。
 * @param {?string=} opt_class クラス名（省略可能）。
 * @param {(Document|Element)=} opt_el 検索対象となる要素（省略可能）。
 * @return { {length: number} } 得られた要素からなる配列のようなオブジェクト。
 *     `length` プロパティと数字によるインデックスが存在することは保証されてる。
 */
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class,
                                                opt_el);
};


/**
 * 与えられたクラス名を持つ要素を返す。
 * @see `goog.dom.query`
 * @param {string} className 検索に使うクラス名。
 * @param {(Document|Element)=} opt_el 検索対象となる要素（省略可能）。
 * @return { {length: number} } 見つかった要素からなる配列のようなオブジェクト。
 */
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if (goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll('.' + className);
  } else if (parent.getElementsByClassName) {
    return parent.getElementsByClassName(className);
  }
  return goog.dom.getElementsByTagNameAndClass_(
      document, '*', className, opt_el);
};


/**
 * 与えられたクラス名を持つ最初の要素を返す。
 * @see `goog.dom.query`
 * @param {string} className 検索に使うクラス名。
 * @param {(Document|Element)=} opt_el 検索対象となる要素（省略可能）。
 * @return { {length: number} } 見つかった要素。
 */
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if (goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector('.' + className);
  } else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0];
  }
  return retVal || null;
};


/**
 * 与えられた `className` をもつ要素が存在するか確認し、最初の要素を返す。
 *
 * @see `goog.dom.query`
 * @param {string} className 探すためのクラス名。
 * @param {!Element|!Document=} opt_root 探索範囲となる要素（省略可能）。
 * @return {!Element} 与えられたクラス名を持つ最初の要素。
 * @throws {goog.asserts.AssertionError} 要素が見つからなければ発生。
 */
goog.dom.getRequiredElementByClass = function(className, opt_root) {
  var retValue = goog.dom.getElementByClass(className, opt_root);
  return goog.asserts.assert(retValue,
      'No element found with className: ' + className);
};


/**
 * W3C Selectors API の標準化されていて、かつ高速であるネイティブ実装が利用でき
 * るかどうかを判定する（`http://www.w3.org/TR/selectors-api/`）。
 * @param {!(Element|Document)} parent 親要素。
 * @return {boolean} `parent.querySelector` API が利用できるかどうか。
 * @private
 */
goog.dom.canUseQuerySelector_ = function(parent) {
  return !!(parent.querySelectorAll && parent.querySelector);
};


/**
 * `getElementsByTagNameAndClass` のネイティブな実装。
 * @param {!Document} doc 検索対象となる `document`。
 * @param {?string=} opt_tag 要素のタグ名。
 * @param {?string=} opt_class クラス名（省略可能）。
 * @param {(Document|Element)=} opt_el 検索対象となる要素（省略可能）。
 * @return { {length: number} } 得られた要素からなる配列のようなオブジェクト。
 *     `length` プロパティと数字によるインデックスが存在することは保証される。
 * @private
 */
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class,
                                                  opt_el) {
  var parent = opt_el || doc;
  var tagName = (opt_tag && opt_tag != '*') ? opt_tag.toUpperCase() : '';

  if (goog.dom.canUseQuerySelector_(parent) &&
      (tagName || opt_class)) {
    var query = tagName + (opt_class ? '.' + opt_class : '');
    return parent.querySelectorAll(query);
  }

  // ネイティブな `getElementsByClassName` が利用できるときはこれを使う。タグ名
  // でフィルタリングするよりも、クラス名によるフィルタリングの方が処理数を少な
  // くなると想定している。
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);

    if (tagName) {
      var arrayLike = {};
      var len = 0;

      // タグ名が指定されていれば、フィルタリングする。
      for (var i = 0, el; el = els[i]; i++) {
        if (tagName == el.nodeName) {
          arrayLike[len++] = el;
        }
      }
      arrayLike.length = len;

      return arrayLike;
    } else {
      return els;
    }
  }

  var els = parent.getElementsByTagName(tagName || '*');

  if (opt_class) {
    var arrayLike = {};
    var len = 0;
    for (var i = 0, el; el = els[i]; i++) {
      var className = el.className;
      // `className` が `split` 関数をもっているかどうかを確認する（SVG は
      // `className` をもたない）。
      if (typeof className.split == 'function' &&
          goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el;
      }
    }
    arrayLike.length = len;
    return arrayLike;
  } else {
    return els;
  }
};


/**
 * `getElementsByTagNameAndClass` へのエイリアス。
 * @param {?string=} opt_tag 要素のタグ名。
 * @param {?string=} opt_class クラス名（省略可能）。
 * @param {Element=} opt_el 検索対象の要素（省略可能）。
 * @return { {length: number} } 得られた要素からなる配列のようなオブジェクト。
 *     `length` プロパティと数字によるインデックスが存在することは保証される。
 * @deprecated `goog.dom.getElementsByTagNameAndClass` を使うべき。
 */
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;


/**
 * 複数の属性をノードに設定する。
 * @param {Element} element 属性を設定する DOM ノード。
 * @param {Object} properties 属性名と値からなるハッシュ。
 */
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if (key == 'style') {
      element.style.cssText = val;
    } else if (key == 'class') {
      element.className = val;
    } else if (key == 'for') {
      element.htmlFor = val;
    } else if (key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
      element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
    } else if (goog.string.startsWith(key, 'aria-') ||
        goog.string.startsWith(key, 'data-')) {
      element.setAttribute(key, val);
    } else {
      element[key] = val;
    }
  });
};


/**
 * `element[key] = val` ではなく `element.setAttribute(key, val)` によって設定さ
 * れるべき属性名のマップ。`goog.dom.setProperties` で使われる。
 *
 * @type {Object}
 * @private
 */
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'frameborder': 'frameBorder',
  'height': 'height',
  'maxlength': 'maxLength',
  'role': 'role',
  'rowspan': 'rowSpan',
  'type': 'type',
  'usemap': 'useMap',
  'valign': 'vAlign',
  'width': 'width'
};


/**
 * viewport の寸法を返す。
 *
 * Gecko の標準モードでは：
 * docEl.clientWidth  スクロールバーを含まない viewport の幅。
 * win.innerWidth     スクロールバーを含む viewport の幅。
 * body.clientWidth   `body` 要素の幅。
 *
 * docEl.clientHeight  スクロールバーを含まない viewport の高さ。
 * win.innerHeight     スクロールバーを含む viewport の高さ。
 * body.clientHeight   `body` 要素の高さ。
 *
 * Gecko の後方互換モードでは：
 * docEl.clientWidth  スクロールバーを含まない viewport の幅。
 * win.innerWidth     スクロールバーを含む viewport の幅。
 * body.clientWidth   スクロールバーを含まない viewport の幅。
 *
 * docEl.clientHeight  `document` の高さ。
 * win.innerHeight     スクロールバーを含む viewport の高さ。
 * body.clientHeight   スクロールバーを含まない viewport の高さ。
 *
 * IE6/7 の標準モードでは：
 * docEl.clientWidth  スクロールバーを含まない viewport の幅。
 * win.innerWidth     未定義。
 * body.clientWidth   `body` 要素の幅。
 *
 * docEl.clientHeight スクロールバーを含まない viewport の高さ。
 * win.innerHeight    未定義。
 * body.clientHeight  `document` 要素の高さ。
 *
 * IE5 + IE6/7 の後方互換モードでは：
 * docEl.clientWidth  `0`。
 * win.innerWidth     未定義。
 * body.clientWidth   スクロールバーを含まない viewport の幅。
 *
 * docEl.clientHeight `0`。
 * win.innerHeight    未定義。
 * body.clientHeight  スクロールバーを含まない viewport の高さ。
 *
 * Opera 9 の標準・後方互換モードでは：
 * docEl.clientWidth  スクロールバーを含まない viewport の幅。
 * win.innerWidth     スクロールバーを含む viewport の幅。
 * body.clientWidth   スクロールバーを含まない viewport の幅。
 *
 * docEl.clientHeight  `document` の高さ。
 * win.innerHeight     スクロールバーを含む viewport の高さ。
 * body.clientHeight   スクロールバーを含まない viewport の高さ。
 *
 * WebKit では：
 * Safari 2
 * docEl.clientHeight `scrollHeight` と同じ。
 * docEl.clientWidth  `innerWidth` と同じ。
 * win.innerWidth     スクロールバーを含まない viewport の幅。
 * win.innerHeight    スクロールバーを含む viewport の高さ。
 * frame.innerHeight  スクロールバーを含まない viewport の高さ。
 *
 * Safari 3 (tested in 522)
 *
 * docEl.clientWidth  スクロールバーを含まない viewport の幅。
 * docEl.clientHeight スクロールバーを含まない viewport の高（strictモード）。
 * body.clientHeight  スクロールバーを含まない viewport の高（quirksモード）。
 *
 * @param {Window=} opt_window 判定する `window` 要素。
 * @return {!goog.math.Size} `width` と `height` をもつオブジェクト。
 */
goog.dom.getViewportSize = function(opt_window) {
  // TODO(arv): This should not take an argument
  return goog.dom.getViewportSize_(opt_window || window);
};


/**
 * `getViewportSize` の実装。
 * @param {Window} win viewport の寸法を取得するための `window`。
 * @return {!goog.math.Size} `width` と `height` をもつオブジェクト。
 * @private
 */
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight);
};


/**
 * `document` の高さを返す。
 *
 * @return {number} 現在の `document` の高さ。
 */
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};


/**
 * 与えられた `window` の `document` の高さを返す。
 *
 * この関数は opensocial gadget api からの転載である：
 * `gadgets.window.adjustHeight(opt_height)`
 *
 * @private
 * @param {Window} win 高さを取得する `window`。
 * @return {number} 与えられた `window` の高さ。
 */
goog.dom.getDocumentHeight_ = function(win) {
  // NOTE(eae): webkit の quirks モードでは `window` のサイズを返すというよりか
  // は、`document` の高さを返しているのではないだろうか。
  var doc = win.document;
  var height = 0;

  if (doc) {
    // Quirks モード、Strict モードでブラウザの挙動が異なるため、コンテントの
    // 内側の高さを計算することは難しい。ここでは、`document.body` または
    // `document.documentElement` の3つのプロパティを使うことにした：
    // - `scrollHeight`
    // - `offsetHeight`
    // - `clientHeight`
    // これらの値は、ブラウザによっても描画モードによってもかなり異なる。
    // しかし、これらには法則性があり、長い時間と苦労をかけてやっと解決できた。

    // viewport の高さを取得する。
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      // Strict mode では：
      // コンテントの内側の高さはどちらかに含まれる：
      //    `document.documentElement.scrollHeight`
      //    `document.documentElement.offsetHeight`
      // ブラウザ間の挙動の違いを研究したところ、viewport の高さと異なれば使って
      // もよいことがわかった。
      height = docEl.scrollHeight != vh ?
          docEl.scrollHeight : docEl.offsetHeight;
    } else {
      // Quirks モードでは：
      // `documentElement.clientHeight` が `documentElement.offsetHeight`が等し
      // いのは IE である。多くのブラウザでは `document.documentElement` はコン
      // テントの内側の高さである。しかし、IE 以外のブラウザでは `document.body`
      // を使うべきである。どちらを使うべきかをどのようにして判定できるかどう
      // か？ `document.documentElement.clientHeight` が
      // `document.documentElement.offsetHeight` と等しければ、 `document.body`
      // を使うべきである。
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if (docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight;
      }

      // viewport の寸法よりもコンテントの高さが大きい、あるいは小さいかどうかを
      // 確認する。コンテントの高さの方が大きければ、大きい値を使う。小さけれ
      // ば、小さい値を使う。
      if (sh > vh) {
        // コンテントが大きいとき
        height = sh > oh ? sh : oh;
      } else {
        // コンテントが小さいとき
        height = sh < oh ? sh : oh;
      }
    }
  }

  return height;
};


/**
 * ページのスクロール距離を座標オブジェクトにして返す。
 *
 * @param {Window=} opt_window 取得対象の `window` （省略可能）。
 * @return {!goog.math.Coordinate} `x` と `y` をもつオブジェクト。
 * @deprecated `goog.dom.getDocumentScroll` を使うべき。
 */
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll();
};


/**
 * ドキュメントのスクロール距離を座標オブジェクトにして返す。
 *
 * @return {!goog.math.Coordinate} `x` と `y` をもつオブジェクト。
 */
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};


/**
 * `getDocumentScroll` の実装。
 *
 * @param {!Document} doc スクロール距離を取得するための `document`。
 * @return {!goog.math.Coordinate} `x` と `y` をもつオブジェクト。
 * @private
 */
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  if (goog.userAgent.IE && goog.userAgent.isVersionOrHigher('10') &&
      win.pageYOffset != el.scrollTop) {
    // IE10 のタッチデバイスのキーボードでは、`scrollTop` を修正せずに
    // `pageYOffset` を利用してページの表示位置をずらしている。この場合、`body`
    // のスクロールオフセットを利用したい。
    return new goog.math.Coordinate(el.scrollLeft, el.scrollTop);
  }
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft,
      win.pageYOffset || el.scrollTop);
};


/**
 * `document` のスクロール要素を返す。
 * @return {Element} スクロール要素。
 */
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};


/**
 * `getDocumentScrollElement` の実装。
 * @param {!Document} doc スクロール要素を取得するための `document`。
 * @return {Element} スクロール要素。
 * @private
 */
goog.dom.getDocumentScrollElement_ = function(doc) {
  // Webkit では、quirks モードでも、strict モードでも `body.scrollLeft` が必要
  // である。もし、`document` が `body` をもっていなければ、`documentElement` を
  // 使う（これは SVG ドキュメントを想定している）。
  if (!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc)) {
    return doc.documentElement;
  }
  return doc.body || doc.documentElement;
};


/**
 * 与えられた `document` が属している `window` を返す。
 *
 * @param {Document=} opt_doc `window` を取得する `document`。
 * @return {!Window} `document` から属している `window`。
 */
goog.dom.getWindow = function(opt_doc) {
  // TODO(arv): This should not take an argument.
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window;
};


/**
 * `getWindow` の実装。
 *
 * @param {!Document=} doc `window` に属している `document`。
 * @return {!Window} `document` から属している `window`。
 * @private
 */
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};


/**
 * DOM ノードを指定した属性で作成して返す。また、可変長引数で子要素を追加でき
 * る。子要素は `childNodes` の先頭に追加される。
 *
 * 例： ```createDom('div', null, createDom('p'), createDom('p'));``` は 2 つの
 * パラグラフ要素を持つ div 要素を返す。
 *
 * @param {string} tagName 作成する要素のタグ名。
 * @param {(Object|Array.<string>|string)=} opt_attributes オブジェクトであれば
 *     含まれる属性名・値が設定される。文字列であれば、クラス名として設定され
 *     る。配列であれば結合されてクラス名として設定される。
 * @param {...(Object|string|Array|NodeList)} var_args DOM ノードもしくはテキス
 *     トノードとなる文字列。もし、可変長引数に配列が含まれれば、これらも子要素
 *     として追加される。
 *
 * @return {!Element} DOM ノードへの参照。
 */
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments);
};


/**
 * `createDom` の実装。
 * @param {!Document} doc DOM を作成する `document`。
 * @param {!Arguments} args 呼び出されたときの引数。`goog.dom.createDom` を参
 *     照。
 * @return {!Element} DOM ノードへの参照。
 * @private
 */
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];

  // Internet Explorer がやらかした：http://msdn.microsoft.com/workshop/author/
  //                                 dhtml/reference/properties/name_2.asp
  // なので `type` 属性を `input` または `button` に設定できなくなった。
  if (!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes &&
      (attributes.name || attributes.type)) {
    var tagNameArr = ['<', tagName];
    if (attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name),
                      '"');
    }
    if (attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type),
                      '"');

      // 入力されたオブジェクトを変えることなく、`type` を除去する。
      var clone = {};
      goog.object.extend(clone, attributes);

      // コンパイラは `goog.object.extend` がどのようにプロパティを追加してい
      // るかがわからないので、リフレクションが使われるだろう。
      // なので、クオートで囲む必要がある。
      delete clone['type'];

      attributes = clone;
    }
    tagNameArr.push('>');
    tagName = tagNameArr.join('');
  }

  var element = doc.createElement(tagName);

  if (attributes) {
    if (goog.isString(attributes)) {
      element.className = attributes;
    } else if (goog.isArray(attributes)) {
      goog.dom.classes.add.apply(null, [element].concat(attributes));
    } else {
      goog.dom.setProperties(element, attributes);
    }
  }

  if (args.length > 2) {
    goog.dom.append_(doc, element, args, 2);
  }

  return element;
};


/**
 * ノードに文字列、あるいは他のノードを追加する。
 * @param {!Document} doc ノードを作成した `document`。
 * @param {!Node} parent ノードの追加先。
 * @param {!Arguments} args 追加されるノードが含まれる配列。`goog.dom.append`
 *     を参照。
 * @param {number} startIndex 追加されるノードの先頭のインデックス。
 * @private
 */
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    // TODO(user): More coercion, ala MochiKit?
    if (child) {
      parent.appendChild(goog.isString(child) ?
          doc.createTextNode(child) : child);
    }
  }

  for (var i = startIndex; i < args.length; i++) {
    var arg = args[i];
    // TODO(attila): Fix isArrayLike to return false for a text node.
    if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      // もし、引数が本物の配列ではなくノードリストであれば複製して使う。
      // `forEach` は変更可能な `NodeList` を処理できないからである。
      goog.array.forEach(goog.dom.isNodeList(arg) ?
          goog.array.toArray(arg) : arg,
          childHandler);
    } else {
      childHandler(arg);
    }
  }
};


/**
 * `createDom` のエイリアス。
 * @param {string} tagName 作成する要素のタグ名。
 * @param {(Object|Array.<string>|string)=} opt_attributes オブジェクトであれば
 *     含まれる属性名・値が設定される。文字列であれば、クラス名として設定され
 *     る。配列であれば結合されてクラス名として設定される。
 * @param {...(Object|string|Array|NodeList)} var_args DOM ノードもしくはテキス
 *     トノードとなる文字列。もし、可変長引数に配列が含まれれば、これらも子要素
 *     として追加される。
 *
 * @return {!Element} DOM ノードへの参照。
 * @deprecated `goog.dom.createDom` を使うべき。
 */
goog.dom.$dom = goog.dom.createDom;


/**
 * 新しい要素を作成して返す。
 * @param {string} name タグ名。
 * @return {!Element} 作成された要素。
 */
goog.dom.createElement = function(name) {
  return document.createElement(name);
};


/**
 * テキストノードを作成して返す。
 * @param {number|string} content コンテント。
 * @return {!Text} 作成されたテキストノード。
 */
goog.dom.createTextNode = function(content) {
  return document.createTextNode(String(content));
};


/**
 * テーブルを作成する。
 * @param {number} rows テーブルの行数（`1` より大きくなければならない）。
 * @param {number} columns テーブルの列数（`1` より大きくなければならない）。
 * @param {boolean=} opt_fillWithNbsp `true` であればテーブルを `nsbp` で埋め
 *     る。
 * @return {!Element} 作成されたテーブル。
 */
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};


/**
 * `goog.dom.createTable` の実装。
 * @param {!Document} doc テーブルを作成するのに使う `document`。
 * @param {number} rows テーブルの行数（`1` より大きくなければならない）。
 * @param {number} columns テーブルの列数（`1` より大きくなければならない）。
 * @param {boolean=} opt_fillWithNbsp `true` であればテーブルを `nsbp` で埋め
 *     る。
 * @return {!Element} 作成されたテーブル。
 * @private
 */
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ['<tr>'];
  for (var i = 0; i < columns; i++) {
    rowHtml.push(fillWithNbsp ? '<td>&nbsp;</td>' : '<td></td>');
  }
  rowHtml.push('</tr>');
  rowHtml = rowHtml.join('');
  var totalHtml = ['<table>'];
  for (i = 0; i < rows; i++) {
    totalHtml.push(rowHtml);
  }
  totalHtml.push('</table>');

  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join('');
  return /** @type {!Element} */ (elem.removeChild(elem.firstChild));
};


/**
 * HTML 文字列を `DocumentFragment` に変換する。クロスサイトスクリプティングを防
 * 止するため、この文字列はサニタイズされていなければならない。たとえば、
 * `goog.dom.htmlToDocumentFragment('&lt;img src=x onerror=alert(0)&gt;')` に
 * よって、これが追加された瞬間に、ほとんどのブラウザでアラートが表示させられ
 * てしまう。
 *
 * @param {string} htmlString 変換したい HTML 文字列。
 * @return {!Node} 作成された `DocumentFragment`。
 */
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString);
};


/**
 * `htmlToDocumentFragment` の実装。
 *
 * @param {!Document} doc `document`。
 * @param {string} htmlString 変換したい HTML 文字列。
 * @return {!Node} 作成された `DocumentFragment`。
 * @private
 */
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement('div');
  if (goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = '<br>' + htmlString;
    tempDiv.removeChild(tempDiv.firstChild);
  } else {
    tempDiv.innerHTML = htmlString;
  }
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = doc.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * ブラウザが CSS1 互換モードならば `true` を返し、それ以外は `false` を返す。
 * @return {boolean} Css1 互換モードであれば `true` を返す。
 */
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};


/**
 * ブラウザが CSS1 互換モードならば `true` を返し、それ以外は `false` を返す。
 * @param {Document} doc 判定対象の `document`。
 * @return {boolean} Css1 互換モードであれば `true` を返す。
 * @private
 */
goog.dom.isCss1CompatMode_ = function(doc) {
  if (goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE;
  }

  return doc.compatMode == 'CSS1Compat';
};


/**
 * 与えられたノードが子要素をもてるかどうかを判定する。HTML の生成に使う。
 *
 * IE は `node.canHaveChildren` をネイティブで実装しているが、これは信頼できな
 * い振る舞いをする。IE8 よりも前では、`base` タグは子要素を持ってもよいことに
 * なっており、IE9 ではすべての要素について `canHaveChildren` は `true` を返して
 * いた。
 *
 * 経験的に、IE 以外のブラウザでは全てのノードに子要素を追加することが出来るが、
 * この振る舞いも信頼できない。
 *
 * ```
 *   var a = document.createElement('br');
 *   a.appendChild(document.createTextNode('foo'));
 *   a.appendChild(document.createTextNode('bar'));
 *   console.log(a.childNodes.length);  // 2
 *   console.log(a.innerHTML);  // Chrome: "", IE9: "foobar", FF3.5: "foobar"
 * ```
 *
 * より詳細な情報：
 * `http://dev.w3.org/html5/markup/syntax.html#syntax-elements`
 *
 * TODO(user): `shouldAllowChildren()` にリネームした方がいいのかな？
 *
 * @param {Node} node 判定対象となるノード。
 * @return {boolean} ノードが子要素をもてるかどうか。
 */
goog.dom.canHaveChildren = function(node) {
  if (node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false;
  }
  switch (node.tagName) {
    case goog.dom.TagName.APPLET:
    case goog.dom.TagName.AREA:
    case goog.dom.TagName.BASE:
    case goog.dom.TagName.BR:
    case goog.dom.TagName.COL:
    case goog.dom.TagName.COMMAND:
    case goog.dom.TagName.EMBED:
    case goog.dom.TagName.FRAME:
    case goog.dom.TagName.HR:
    case goog.dom.TagName.IMG:
    case goog.dom.TagName.INPUT:
    case goog.dom.TagName.IFRAME:
    case goog.dom.TagName.ISINDEX:
    case goog.dom.TagName.KEYGEN:
    case goog.dom.TagName.LINK:
    case goog.dom.TagName.NOFRAMES:
    case goog.dom.TagName.NOSCRIPT:
    case goog.dom.TagName.META:
    case goog.dom.TagName.OBJECT:
    case goog.dom.TagName.PARAM:
    case goog.dom.TagName.SCRIPT:
    case goog.dom.TagName.SOURCE:
    case goog.dom.TagName.STYLE:
    case goog.dom.TagName.TRACK:
    case goog.dom.TagName.WBR:
      return false;
  }
  return true;
};


/**
 * 与えられたノードに子要素を追加する。
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child);
};


/**
 * 与えられたノードにテキストノードか子要素を追加する。
 * @param {!Node} parent 追加対象となるノード。
 * @param {...goog.dom.Appendable} var_args もし、ノードであればそのまま追加す
 *     る。文字列であれば、テキストノードにして追加する。配列のようなオブジェク
 *     トであれば、`0` から `length - 1` 番目の要素までを追加する。
 */
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1);
};


/**
 * DOM ノードからすべての子要素を除去する。
 * @param {Node} node 除去対象となるノード。
 */
goog.dom.removeChildren = function(node) {
  // 生のコレクションの走査は遅くなりがち。これはいまのところ最速のやり方であ
  // る。二重括弧はコンパイラが strict で警告を出すことを防止するための手段であ
  // る。
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};


/**
 * 新しいノードを既に存在しているノード参照の前に追加する（つまり、兄要素とな
 * る）。もしノード参照に親がいなければ、何もしない。
 * @param {Node} newNode 挿入される新しいノード。
 * @param {Node} refNode 挿入対象となるノードの参照。
 */
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }
};


/**
 * 新しいノードを既に存在しているノード参照の前に追加する（つまり、弟要素とな
 * る）。もしノード参照に親がいなければ、何もしない。
 * @param {Node} newNode 挿入される新しいノード。
 * @param {Node} refNode 挿入対象となるノードの参照。
 */
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  }
};


/**
 * 要素を指定したインデックスに挿入する。インデックスが挿入対象の親オブジェクト
 * の子要素数以上であれば、末尾に追加される。
 * @param {Element} parent 子要素が挿入される親要素。
 * @param {Node} child 挿入される子要素。
 * @param {number} index 子要素を挿入する位置のインデックス。非負である必要があ
 *     る。
 */
goog.dom.insertChildAt = function(parent, child, index) {
  // 第二引数が `null` であれば、末尾の子要素として追加される。
  parent.insertBefore(child, parent.childNodes[index] || null);
};


/**
 * Removes a node from its parent.
 * 子要素を親要素から除去する。
 * @param {Node} node 除去される子要素。
 * @return {Node} 除去されたノード。除去に失敗したときは `null`。
 */
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};


/**
 * DOMツリーの中のノードを置換する。`oldNode` が親要素をもたなければ何もしない。
 * @param {Node} newNode 挿入されるノード。
 * @param {Node} oldNode 置換されるノード。
 */
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
};


/**
 * 要素を平坦化する（この要素が除去されたあと、子要素で置き換えられる）。
 * 与えられた要素が `document` に存在しなければ何もしない。
 * @param {Element} element 平坦化される要素。
 * @return {Element|undefined} 子要素が除去された `element`。ドキュメントツリー
 *     のなかに存在しなければ、`undefined`。
 */
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    // IE （と Opera ）の DOM メソッドが利用可能であれば使う。
    if (element.removeNode) {
      return /** @type {Element} */ (element.removeNode(false));
    } else {
      // 全ての子要素を元の要素の一つ上の階層に移動する。
      while ((child = element.firstChild)) {
        parent.insertBefore(child, element);
      }

      // 元の要素を除去する。
      return /** @type {Element} */ (goog.dom.removeNode(element));
    }
  }
};


/**
 * 与えられた要素の子要素を返す。
 * @param {Element} element 子要素を取得するための要素。
 * @return {!(Array|NodeList)} 子要素からなる配列または配列のようなオブジェク
 *     ト。
 */
goog.dom.getChildren = function(element) {
  // `children` 属性が使えるかどうかを判定する。IE8 ではコメントが含まれるときに
  // この属性が利用できない。
  if (goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE &&
      element.children != undefined) {
    return element.children;
  }
  // 利用できないときは子要素をフィルタリングする。
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT;
  });
};


/**
 * 与えられた要素の最初の子要素を返す。
 * @param {Node} node 子要素を取得するための要素。
 * @return {Element} `node` の最初の子要素。
 */
goog.dom.getFirstElementChild = function(node) {
  if (node.firstElementChild != undefined) {
    return /** @type {Element} */(node).firstElementChild;
  }
  return goog.dom.getNextElementNode_(node.firstChild, true);
};


/**
 * 与えられた要素の最後の子要素を返す。
 * @param {Node} node 子要素を取得するための要素。
 * @return {Element} `node` の最後の子要素。
 */
goog.dom.getLastElementChild = function(node) {
  if (node.lastElementChild != undefined) {
    return /** @type {Element} */(node).lastElementChild;
  }
  return goog.dom.getNextElementNode_(node.lastChild, false);
};


/**
 * 与えられた要素の直後の兄弟要素を返す。
 * @param {Node} node 直後の兄弟要素を取得するための要素。
 * @return {Element} `node` の直後の兄弟要素。
 */
goog.dom.getNextElementSibling = function(node) {
  if (node.nextElementSibling != undefined) {
    return /** @type {Element} */(node).nextElementSibling;
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true);
};


/**
 * 与えられた要素の直前の兄弟要素を返す。
 * @param {Node} node 直前の兄弟要素を取得するための要素。
 * @return {Element} `node` の直前の兄弟要素。
 */
goog.dom.getPreviousElementSibling = function(node) {
  if (node.previousElementSibling != undefined) {
    return /** @type {Element} */(node).previousElementSibling;
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false);
};


/**
 * 与えられた要素に対して指定された方向で隣り合っている要素を返す。
 * @param {Node} node 隣り合っている要素を取得するための要素。
 * @param {boolean} forward 隣り合っている方向。
 * @return {Element} `node` の隣の兄弟要素。
 * @private
 */
goog.dom.getNextElementNode_ = function(node, forward) {
  while (node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling;
  }

  return /** @type {Element} */ (node);
};


/**
 * 与得られたノードとソースコード上で隣り合うノードのうち、後の方のノードを返
 * す。
 * @param {Node} node ノード。
 * @return {Node} DOM ツリーの次にあたるノード。`node` が最後の要素であれば、
 *     `null` が返る。
 */
goog.dom.getNextNode = function(node) {
  if (!node) {
    return null;
  }

  if (node.firstChild) {
    return node.firstChild;
  }

  while (node && !node.nextSibling) {
    node = node.parentNode;
  }

  return node ? node.nextSibling : null;
};


/**
 * 与得られたノードとソースコード上で隣り合うノードのうち、前の方のノードを返
 * す。
 * @param {Node} node ノード。
 * @return {Node} DOM ツリーの前にあたるノード。`node` が最後の要素であれば、
 *     `null` が返る。
 */
goog.dom.getPreviousNode = function(node) {
  if (!node) {
    return null;
  }

  if (!node.previousSibling) {
    return node.parentNode;
  }

  node = node.previousSibling;
  while (node && node.lastChild) {
    node = node.lastChild;
  }

  return node;
};


/**
 * オブジェクトが DOM ノードかどうかを判定する。
 * @param {*} obj DOM ノードかどうかを判定するためのオブジェクト。
 * @return {boolean} このオブジェクトか DOM ノードかどうか。
 */
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0;
};


/**
 * オブジェクトが `Element` かどうか判定する。
 * @param {*} obj `Element` かどうか判定するためのオブジェクト。
 * @return {boolean} このオブジェクトが `Element` かどうか。
 */
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT;
};


/**
 * 与えられたオブジェクトが `window` オブジェクトかどうか判定する。これは、
 * HTML ページでグローバルな `window` と iframe の `window` の両方を含む。
 * @param {*} obj 判定するためのオブジェクト。
 * @return {boolean} オブジェクトが `window` かどうか。
 */
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj['window'] == obj;
};


/**
 * Returns an element's parent, if it's an Element.
 * 与えられた要素の親要素を返す（`Element` であれば）。
 * @param {Element} element DOM 要素。
 * @return {Element} 親要素。`Element` でなければ `null`。
 */
goog.dom.getParentElement = function(element) {
  if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    var isIe9 = goog.userAgent.IE &&
        goog.userAgent.isVersionOrHigher('9') &&
        !goog.userAgent.isVersionOrHigher('10');
    // IE9 の SVG 要素は `parentElement` プロパティが使えない。
    // `goog.global['SVGElement']` は IE9 の Quikrs モードで未定義になる。
    if (!(isIe9 && goog.global['SVGElement'] &&
        element instanceof goog.global['SVGElement'])) {
      return element.parentElement;
    }
  }
  var parent = element.parentNode;
  return goog.dom.isElement(parent) ? /** @type {!Element} */ (parent) : null;
};


/**
 * 与えられたノードが、もうひとつ与えられたノードを含んでいるかどうかを判定す
 * る。
 * @param {Node} parent `descendant` を含んでいるかどうか判定するためのノード。
 * @param {Node} descendant 判定するためのノード。
 * @return {boolean} `parent` が `descendent` を含んでいるかどうか。
 */
goog.dom.contains = function(parent, descendant) {
  // ブラウザ固有のメソッドを利用可能であれば使う。この方が速い。

  // IE DOM
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }

  // W3C DOM Level 3
  if (typeof parent.compareDocumentPosition != 'undefined') {
    return parent == descendant ||
        Boolean(parent.compareDocumentPosition(descendant) & 16);
  }

  // W3C DOM Level 1
  while (descendant && parent != descendant) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
};


/**
 * 2つのノードのドキュメントの並び順を比較する。`0` なら同じノード、負の値なら
 * `node1` は `node2` よりも前にあり、正の値なら `node1` は `node2` よりも後に
 * ある。このメソッドはタグが現れる順を判定しているので、`<b><i>text</i></b>` の
 * 場合、b ノードは i ノードよりも前にあると判断されることに注意。
 *
 * @param {Node} node1 比較するためのひとつめのノード。
 * @param {Node} node2 比較するためのふたつめのノード。
 * @return {number} 同じノードならば `0` 、`node1` が `node2` よりも前にあれば
 *     負の値、`node2` が `node1` よりも前にあれば正の値。
 */
goog.dom.compareNodeOrder = function(node1, node2) {
  // ノードが等しければすぐに終了する。
  if (node1 == node2) {
    return 0;
  }

  // `compareDocumentPosition` が利用であれば使う。
  if (node1.compareDocumentPosition) {
    // 4 は FOLLOWS に対するビットマスク。
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }

  // IE7、IE8 の `document` ノードのための特例処理。
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    if (node1.nodeType == goog.dom.NodeType.DOCUMENT) {
      return -1;
    }
    if (node2.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1;
    }
  }

  // `sourceIndex` を使った IE での処理。ひとつめのノードがソース番号をもってい
  // るか、あるいはこのノードの親で判定する。
  if ('sourceIndex' in node1 ||
      (node1.parentNode && 'sourceIndex' in node1.parentNode)) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;

    if (isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex;
    } else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;

      if (parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2);
      }

      if (!isElement1 && goog.dom.contains(parent1, node2)) {
        return -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2);
      }


      if (!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1);
      }

      return (isElement1 ? node1.sourceIndex : parent1.sourceIndex) -
             (isElement2 ? node2.sourceIndex : parent2.sourceIndex);
    }
  }

  // Safari では `range` で比較する。
  var doc = goog.dom.getOwnerDocument(node1);

  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);

  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);

  return range1.compareBoundaryPoints(goog.global['Range'].START_TO_END,
      range2);
};


/**
 * `textNode` の親が `node` の祖先だった場合における 2 つのノードの位置を比較す
 * るユーティリティ関数。もし想定している状況下にない場合は、null オブジェクトに
 * アクセスしてしまうかもしれない。
 * @param {Node} textNode 比較するための `textNode`。
 * @param {Node} node 比較するためのノード。
 * @return {number} `node` が `textNode` より前にあれば `-1`、それ以外は `+1`。
 * @private
 */
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    // もし `textNode` が `node` の子であれば、`node` の方が先に現れる。
    return -1;
  }
  var sibling = node;
  while (sibling.parentNode != parent) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};


/**
 * 等しくない兄弟ノードの組におけるノードの位置を比較するユーティリティ関数。
 * @param {Node} node1 比較するためのひとつめのノード。
 * @param {Node} node2 比較するためのふたつめのノード。
 * @return {number} -1 if node1 is before node2, +1 otherwise.
 * @private
 */
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while ((s = s.previousSibling)) {
    if (s == node1) {
      // `node1` の前に `node2` を見つけたということ。
      return -1;
    }
  }

  // 見つけられなかったので、`node1` は `node2` の前になければならない。
  return 1;
};


/**
 * 与えられたノードの最深共通祖先を探す。
 * @param {...Node} var_args 共通祖先を探するためのノード。
 * @return {Node} 与えられたノードの共通祖先。なければ `null`。`null` の場合は、
 *     少なくとも1つのノードが違う `document` に属している。
 */
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if (!count) {
    return null;
  } else if (count == 1) {
    return arguments[0];
  }

  var paths = [];
  var minLength = Infinity;
  for (i = 0; i < count; i++) {
    // リストの祖先を計算する。
    var ancestors = [];
    var node = arguments[i];
    while (node) {
      ancestors.unshift(node);
      node = node.parentNode;
    }

    // 比較のためのリストを保存しておく。
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0; i < minLength; i++) {
    var first = paths[0][i];
    for (var j = 1; j < count; j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};


/**
 * ノードを所有している `document` を返す。
 * @param {Node|Window} node `document` を取得するためのノード。
 * @return {!Document} `node` を所有している `document`。
 */
goog.dom.getOwnerDocument = function(node) {
  // TODO(arv): IE5 のコードは消そうか。
  // IE5 では `ownerDocument` ではなく `document` を使う。
  return /** @type {!Document} */ (
      node.nodeType == goog.dom.NodeType.DOCUMENT ? node :
      node.ownerDocument || node.document);
};


/**
 * frame または iframe の `document` 要素を取得するためのクロスブラウザな関数。
 * @param {Element} frame frame オブジェクト。
 * @return {!Document} `frame` の `document` 要素。
 */
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc;
};


/**
 * frame または iframe の `window` を取得するためのクロスブラウザな関数。
 * @param {Element} frame frame 要素。
 * @return {!Document} `frame` の `document` 要素。
 * @return {Window} `frame` の `window` 要素。
 */
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow ||
      goog.dom.getWindow(goog.dom.getFrameContentDocument(frame));
};


/**
 * ノードにテキストコンテントを追加する（クロスブラウザ対応）。
 * @param {Node} node テキストコンテントを追加するためのノード。
 * @param {string|number} text ノードのテキストコンテントを置き換える文字列。
 */
goog.dom.setTextContent = function(node, text) {
  goog.asserts.assert(node != null,
      'goog.dom.setTextContent expects a non-null value for node');

  if ('textContent' in node) {
    node.textContent = text;
  } else if (node.nodeType == goog.dom.NodeType.TEXT) {
    node.data = text;
  } else if (node.firstChild &&
             node.firstChild.nodeType == goog.dom.NodeType.TEXT) {
    // もし最初の子がテキストノードであれば、このデータを変更し、残りの子を除去
    // する。
    while (node.lastChild != node.firstChild) {
      node.removeChild(node.lastChild);
    }
    node.firstChild.data = text;
  } else {
    goog.dom.removeChildren(node);
    var doc = goog.dom.getOwnerDocument(node);
    node.appendChild(doc.createTextNode(String(text)));
  }
};


/**
 * ノードの `outerHtml` を返す（`innerHtml` と似ているが、ノード自身のタグを含
 * む）。
 * @param {Element} element HTML を取得するための要素。
 * @return {string} 与えられた要素の `outerHtml`。
 */
goog.dom.getOuterHtml = function(element) {
  // IE、Opera、 WebKit は `outerHTML` をサポートしている。
  if ('outerHTML' in element) {
    return element.outerHTML;
  } else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement('div');
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
};


/**
 * フィルタ関数でマッチした最初の子孫要素を返す（深さ優先探索）。この関数は、
 * 要素を探す手段のうち、最も汎用的なものである。ただ、CSS セレクタ式によって
 * 複数のマッチ条件を素早く指定できる `goog.dom.query` という手段もある。
 * この手段では、必要となるコードがさらにコンパクトになることが多い。
 * @see `goog.dom.query`
 *
 * @param {Node} root 検索範囲となるルート要素。
 * @param {function(Node) : boolean} p フィルタ関数。
 * @return {Node|undefined} 検索結果のノード。何も見つからなければ `undefined`。
 */
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined;
};


/**
 * フィルタ関数でマッチしたすべてのの子孫要素を返す（深さ優先探索）。この関数は、
 * 要素を探す手段のうち、最も汎用的なものである。ただ、CSS セレクタ式によって
 * 複数のマッチ条件を素早く指定できる `goog.dom.query` という手段もある。
 * この手段では、必要となるコードがさらにコンパクトになることが多い。
 *
 * @param {Node} root 検索範囲となるルート要素。
 * @param {function(Node) : boolean} p フィルタ関数。
 * @return {Node|undefined} 検索結果のノード。何も見つからなければ空の配列。
 */
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv;
};


/**
 * フィルタ関数にマッチする最初の要素、または全ての要素を深さ優先で検索する。
 * @param {Node} root 検索範囲となるルート要素。
 * @param {function(Node) : boolean} p フィルタ関数。
 * @param {!Array.<!Node>} rv 見つかったノードが追加される配列。
 * @param {boolean} findOne `true` であれば、要素がひとつでも見つかれば終了す
 *     る。
 * @return {boolean} 検索が完了したかどうか。ひとつでも見つかれば `true` 、それ
 *     以外は `false`。
 * @private
 */
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if (root != null) {
    var child = root.firstChild;
    while (child) {
      if (p(child)) {
        rv.push(child);
        if (findOne) {
          return true;
        }
      }
      if (goog.dom.findNodes_(child, p, rv, findOne)) {
        return true;
      }
      child = child.nextSibling;
    }
  }
  return false;
};


/**
 * 内容の文字列長が計算されないタグのマップ。
 * @type {Object}
 * @private
 */
goog.dom.TAGS_TO_IGNORE_ = {
  'SCRIPT': 1,
  'STYLE': 1,
  'HEAD': 1,
  'IFRAME': 1,
  'OBJECT': 1
};


/**
 * 空白文字などの決まった値をもつタグのマップ。
 * @type {Object}
 * @private
 */
goog.dom.PREDEFINED_TAG_VALUES_ = {'IMG': ' ', 'BR': '\n'};


/**
 * 要素がキーボードフォーカスするための有効なタブインデックス（`tabIndex` >= 0）
 * をもつかどうかを判定する。ただ、いくつかの要素はタブインデックスがなくても
 * ネイティブでキーボードフォーカスが有効になっている。
 * @param {Element} element 検索するための要素。
 * @return {boolean} 要素をキーボードフォーカスできるかどうか。
 * @see `http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-
 * tabindex-values-with-javascript/`
 */
goog.dom.isFocusableTabIndex = function(element) {
  return goog.dom.hasSpecifiedTabIndex_(element) &&
         goog.dom.isTabIndexFocusable_(element);
};


/**
 * 与えられた要素のタブインデックスによるキーボードフォーカスを有効・無効にす
 * る。この処理は `goog.dom.isFocusableTabIndex` が `true` となる要素、または
 * ネイティブでキーボードフォーカスがサポートされている要素のみに有効である。
 * `http://go/tabindex` を参照。
 * @param {Element} element タブインデックスを変更される要素。
 * @param {boolean} enable キーボードフォーカスのためのタブインデックスを設定・
 *     除去するかどうか。
 */
goog.dom.setFocusableTabIndex = function(element, enable) {
  if (enable) {
    element.tabIndex = 0;
  } else {
    // まず `tabIndex` を除去するために `-1` に設定する。これは Safari で動作
    // する（Windows 版の Safari4 で確認済）。`-1` を設定せずに属性を除去した
    // 場合、`tabIndex` をもっていないのにも関わらずキーボードフォーカスできて
    // しまう。
    element.tabIndex = -1;
    element.removeAttribute('tabIndex'); // キャメルケースじゃないとね！
  }
};


/**
 * 要素がフォーカス可能かどうかを判定する。
 * キーボードフォーカスのためのタブインデックス（`tabIndex` > 0）をもつか、
 * ネイティブでキーボードフォーカスがサポートされている要素であれば `true` を
 * 返す。
 * @param {Element} element 判定するための要素。
 * @return {boolean} この要素がキーボードフォーカスできるかどうか。
 */
goog.dom.isFocusable = function(element) {
  var focusable;
  // いくつかの要素はタブインデックスをしていされていなくてもフォーカスできる。
  if (goog.dom.nativelySupportsFocus_(element)) {
    // 要素が無効化されていないことを確認し、
    focusable = !element.disabled &&
        // さらにタブインデックスが指定されていれば、フォーカス可能である。
        (!goog.dom.hasSpecifiedTabIndex_(element) ||
         goog.dom.isTabIndexFocusable_(element));
  } else {
    focusable = goog.dom.isFocusableTabIndex(element);
  }

  // IE では要素が可視状態でないとフォーカスできない。
  return focusable && goog.userAgent.IE ?
             goog.dom.hasNonZeroBoundingRect_(element) : focusable;
};


/**
 * タブインデックスが指定されていれば `true` を返す。
 * @param {Element} element 判定するための要素。
 * @return {boolean} この要素にタブインデックスが指定されているかどうか。
 * @private
 */
goog.dom.hasSpecifiedTabIndex_ = function(element) {
  // IE は設定されていない `tabIndex` で 0 を返すため、`getAttributeNode` を
  // 使わなければならなかった。これは、指定されたプロパティをきちんと返す。
  // これで他のブラウザでも動作する。
  var attrNode = element.getAttributeNode('tabindex'); // 小文字じゃないとね！
  return goog.isDefAndNotNull(attrNode) && attrNode.specified;
};


/**
 * 要素のタブインデックスがフォーカス可能な値であれば `true` を返す。
 * @param {Element} element 判定するための要素。
 * @return {boolean} 要素のタブインデックスはフォーカスできるかどうか。
 * @private
 */
goog.dom.isTabIndexFocusable_ = function(element) {
  var index = element.tabIndex;
  // IE9 の `tabIndex` は 16-bit int なので、 `-2` は `65534` となることに注意。
  return goog.isNumber(index) && index >= 0 && index < 32768;
};


/**
 * 要素が `tabIndex` をもたなくてもフォーカス可能であれば、`true` を返す。
 * @param {Element} element 判定するための要素。
 * @return {boolean} この要素はネイティブでフォーカスがサポートされているかどう
 *     か。
 * @private
 */
goog.dom.nativelySupportsFocus_ = function(element) {
  return element.tagName == goog.dom.TagName.A ||
         element.tagName == goog.dom.TagName.INPUT ||
         element.tagName == goog.dom.TagName.TEXTAREA ||
         element.tagName == goog.dom.TagName.SELECT ||
         element.tagName == goog.dom.TagName.BUTTON;
};


/**
 * 要素が可視領域をもつならば `true` を返す（高さと幅が `0` よりも大きい要素）。
 * @param {Element} element 判定するための要素。
 * @return {boolean} この要素が0でない可視領域をもつかどうか。
 * @private
 */
goog.dom.hasNonZeroBoundingRect_ = function(element) {
  var rect = goog.isFunction(element['getBoundingClientRect']) ?
      element.getBoundingClientRect() :
      {'height': element.offsetHeight, 'width': element.offsetWidth};
  return goog.isDefAndNotNull(rect) && rect.height > 0 && rect.width > 0;
};


/**
 * 指定されたノードの内容の文字列を返す。マークアップや不可視の記号は含まれな
 * い。改行は除去され、連続する空白文字は1文字の空白へと畳まれる。
 *
 * ブラウザが `innerText` をサポートしていれば使う。それ以外の場合はノードを巡回
 * することによって、死ミューレートする。IE でも改行は正規化される。
 *
 * @param {Node} node 内容を取得するためのノード。
 * @return {string} 内容の文字列。
 */
goog.dom.getTextContent = function(node) {
  var textContent;
  // Note(arv): IE9、Opera、Safari 3 では `innerText` がサポートされているが、
  // スクリプトタグのなかのテキストノードが含まれてしまう。なので、ユーザーエー
  // ジェントによる分岐に戻した。
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && ('innerText' in node)) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
    // 残念なことに、`.innerText()` は `&shy;` 記号も返してしまう。
    // なのでこれを取り除き、重複した空白記号も取り除く。
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join('');
  }

  // `&shy;` の実体参照を除去する。Opera における `goog.format.insertWordBreaks`
  // はこれを挿入するからだ。
  textContent = textContent.replace(/ \xAD /g, ' ').replace(/\xAD/g, '');
  // `&#8203` 参照を除去する。IE8 における `goog.format.insertWordBreaks` は
  // これを挿入するからだ。
  textContent = textContent.replace(/\u200B/g, '');

  // `innerText` が動作し、`&nbsp;` が `' '` へ、`/ +/` が `' '` へと変換される
  // 古いブラウザでは置換しない。
  if (!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, ' ');
  }
  if (textContent != ' ') {
    textContent = textContent.replace(/^\s*/, '');
  }

  return textContent;
};


/**
 * 指定されたノードの内容の文字列を返す。マークアップやは含まれない。
 *
 * このメソッドは連続する空白文字を畳まないことが `getTextContent` メソッドと
 * は異なる。
 *
 * @param {Node} node 内容を取得するためのノード。
 * @return {string} 内容の文字列。
 */
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);

  return buf.join('');
};


/**
 * 再帰的にテキストコンテントを取得する。
 *
 * @param {Node} node 内容を取得するためのノード。
 * @param {Array} buf 文字列のバッファ。
 * @param {boolean} normalizeWhitespace 空白文字列を正規化するかどうか。
 * @private
 */
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    // くつかのタグは無視する
  } else if (node.nodeType == goog.dom.NodeType.TEXT) {
    if (normalizeWhitespace) {
      buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
    } else {
      buf.push(node.nodeValue);
    }
  } else if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
    buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
  } else {
    var child = node.firstChild;
    while (child) {
      goog.dom.getTextContent_(child, buf, normalizeWhitespace);
      child = child.nextSibling;
    }
  }
};


/**
 * 与えられたノードに含まれる文字列長（マークアップは含まれない）を返す。
 * この値は、ノードに含まれる文字列を全て選択したときの選択された文字列の長さと
 * 等しい。または、ノードの内容をカーソルでひとつずつ数えたものと等しいとも
 * 言い換えられる。画像、改行タグは1つの空白文字と置き換えられる。改行は無視
 * される。
 *
 * @param {Node} node 内容の文字列長を取得したいノード。
 * @return {number} `node` の内容の文字列長。
 */
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};


/**
 * 与えられたノードの任意の祖先のノードからの文字列のオフセットを取得する。
 * この文字列長は `goog.dom.getNodeTextLength` の計算ルールと同じようにで計算
 * される。
 *
 * @param {Node} node オフセットを取得するためのノード。
 * @param {Node=} opt_offsetParent オフセットの起点となるノード。省略時はノード
 *     が属する `document` の `body`。
 * @return {number} 文字列のオフセット。
 */
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while (node && node != root) {
    var cur = node;
    while ((cur = cur.previousSibling)) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  // Firefox でテキストの先頭に改行か空ノードがある場合に対処するために左トリム
  // をおこなう。
  return goog.string.trimLeft(buf.join('')).replace(/ +/g, ' ').length;
};


/**
 * 与えられたノードの親ノードからの文字列のオフセットを取得する。
 * 第三引数にオブジェクトが指定された場合は、得られたノードとオフセットの余りが
 * それぞれプロパティとして保持される。
 * @param {Node} parent 親ノード。
 * @param {number} offset 親ノードからのオフセット。
 * @param {Object=} opt_result 戻り値を保持するオブジェクト。オブジェクトが指定
 *     されていれば戻り値は `{node: Node, remainder: number}` の形式で保持
 *     される。
 * @return {Node} オフセットの上に見つかったノード。
 */
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur = null;
  while (stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
      // いくつかのタグは無視する
    } else if (cur.nodeType == goog.dom.NodeType.TEXT) {
      var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, '').replace(/ +/g, ' ');
      pos += text.length;
    } else if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
      pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
    } else {
      for (var i = cur.childNodes.length - 1; i >= 0; i--) {
        stack.push(cur.childNodes[i]);
      }
    }
  }
  if (goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur;
  }

  return cur;
};


/**
 * オブジェクトが `NodeList` かどうかを判定する。オブジェクトが `length` という
 * 数値のプロパティをもち、`item` 関数（IE では文字列型）をもてば `NodeList` と
 * 判断する。
 * @param {Object} val 判定するためのオブジェクト。
 * @return {boolean} オブジェクトが `NodeList` かどうか。
 */
goog.dom.isNodeList = function(val) {
  // TODO(attila): `goog.dom` の一部では `goog.userAgent` を使えばもっとシンプル
  // に `isNodeList` が書けるはず。
  // `NodeList` は全てのプラットフォームで `length` という数値のプロパティをも
  // つ。
  if (val && typeof val.length == 'number') {
    // `NodeList` は Safari を除いてオブジェクトである（Safari では関数型）。
    if (goog.isObject(val)) {
      // 非 IE プラットフォーム では `NodeList` は `item` 関数をもたなければ
      // ならない。IE では文字列型である。
      return typeof val.item == 'function' || typeof val.item == 'string';
    } else if (goog.isFunction(val)) {
      // Safari では、 `NodeList` 関数は `item` プロパティは関数である。
      return typeof val.item == 'function';
    }
  }

  // Not a NodeList.
  return false;
};


/**
 * DOM 階層を遡っていき、与えられたタグ名かつクラス名をもつ直近の祖先要素を
 * 返す。与えられた要素がこの条件にマッチするのであれば、この要素がそのまま
 * 返る。
 * @param {Node} element 開始点となるノード。
 * @param {?(goog.dom.TagName|string)=} opt_tag マッチさせたいタグ名（ `null`、
 *     または `undefined` が与えられるとクラス名のみのマッチになる）。
 * @param {?string=} opt_class マッチさせたいクラス名（`null` または `undefined`
 *     が与えられるとタグ名のみのマッチとなる）。
 * @return {Element} 条件を満足する最初の祖先要素。なければ `null`。
 */
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  if (!opt_tag && !opt_class) {
    return null;
  }
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return /** @type {Element} */ (goog.dom.getAncestor(element,
      function(node) {
        return (!tagName || node.nodeName == tagName) &&
               (!opt_class || goog.dom.classes.has(node, opt_class));
      }, true));
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * class name. If the passed element matches the specified criteria, the
 * element itself is returned.
 * DOM 階層を遡っていき、与えられたクラス名をもつ直近の祖先要素を返す。
 * 与えられた要素がこの条件にマッチするのであれば、この要素がそのまま返る。
 * @param {Node} element 開始点となるノード。
 * @param {string} className マッチさせたいクラス名。
 * @return {Element} 条件を満足する最初の祖先要素。なければ `null`。
 */
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className);
};


/**
 * DOM 階層を遡っていき、指定された関数でマッチした最初の疎遠要素を返す。
 * @param {Node} element 開始点となる DOM ノード。
 * @param {function(Node) : boolean} matcher 条件を満足したノードが渡されたとき
 *     `true` を返す関数。
 * @param {boolean=} opt_includeNode `true` であれば検索対象に自身を含める（
 *     この場合、最初に `startElement` が最初に `matcher` 関数に渡される）。
 * @param {number=} opt_maxSearchSteps 遡る階層の数の上限。
 * @return {Node} `matcher` でマッチした DOM ノード。なければ `null`。
 */
goog.dom.getAncestor = function(
    element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if (!opt_includeNode) {
    element = element.parentNode;
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while (element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if (matcher(element)) {
      return element;
    }
    element = element.parentNode;
    steps++;
  }
  // ルートに到達したので、DOM はマッチしなかったということ
  return null;
};


/**
 * 与えられた `document` からアクティブな要素を取得する。
 * @param {Document} doc 検索対象となる `document`。
 * @return {Element} アクティブな要素。
 */
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement;
  } catch (e) {
    // Note(nicksantos): IE で `document.activeElement` を評価しようとすると例外
    // が発生するときがある。確信があるわけではないが、`document.activeElement`
    // `activeElement` が DOM から除去されているときに起こるようだ。
    //
    //ようするに「アクティブな要素はない」という意味の例外なのではないだろうか。
  }

  return null;
};


/**
 * `devicePixelRatio` のキャッシュ版。
 * @type {number}
 * @private
 */
goog.dom.devicePixelRatio_;


/**
 * `devicePixelRatio` を返す。もしこれが与えられていないときは推定値を返す。
 *
 * この値は `window.devicePixelRatio` と同じとなる。ただし、`devicePixelRatio`
 * が未定義だが `window.matchMedia` が与えられている場合は、これから比率の計算を
 * 試みる。それ以外の場合は `1.0` が返る。
 *
 * この関数は最初の呼び出しで計算されたピクセル比率をキャッシュするため、処理は
 * 一度しか実行されない。
 *
 * @return {number} 仮想的なピクセルと実際のピクセルの比率。
 */
goog.dom.getPixelRatio = goog.functions.cacheReturnValue(function() {
  var win = goog.dom.getWindow();

  // モバイル Firefox では `devicePixelRatio` が動作しない。
  // TODO(user): このチェックによってモバイル版の Gecko で動作することが知られて
  // いる。
  // 報告されているバグ：`https://bugzilla.mozilla.org/show_bug.cgi?id=896804`
  var isFirefoxMobile = goog.userAgent.GECKO && goog.userAgent.MOBILE;

  if (goog.isDef(win.devicePixelRatio) && !isFirefoxMobile) {
    return win.devicePixelRatio;
  } else if (win.matchMedia) {
    return goog.dom.matchesPixelRatio_(.75) ||
           goog.dom.matchesPixelRatio_(1.5) ||
           goog.dom.matchesPixelRatio_(2) ||
           goog.dom.matchesPixelRatio_(3) || 1;
  }
  return 1;
});


/**
 * デバイスが実際のピクセル数と仮想のピクセル数の比率をサポートしているならば、
 * `mediaQuery` によってチェックする。
 * @param {number} pixelRatio 実際のピクセル数と仮想的なピクセル数の比率。
 * @return {number} 該当する `pixelRatio` 、なければ `0`。
 * @private
 */
goog.dom.matchesPixelRatio_ = function(pixelRatio) {
  var win = goog.dom.getWindow();
  var query = ('(-webkit-min-device-pixel-ratio: ' + pixelRatio + '),' +
               '(min--moz-device-pixel-ratio: ' + pixelRatio + '),' +
               '(min-resolution: ' + pixelRatio + 'dppx)');
  return win.matchMedia(query).matches ? pixelRatio : 0;
};



/**
 * `document` オブジェクトをもつ DOM ヘルパーのインスタンスを作成する。
 * @param {Document=} opt_document DOM ヘルパーと紐づく `Document` オブジェク
 *     ト。
 * @constructor
 */
goog.dom.DomHelper = function(opt_document) {
  /**
   * 利用する `document` オブジェクトへの参照。
   * @type {!Document}
   * @private
   */
  this.document_ = opt_document || goog.global.document || document;
};


/**
 * 与えられた要素が属する `document` の DOM ヘルパーを返す。
 * @param {Node=} opt_node 指定されればここから `DomHelper` を作成する。
 * @return {!goog.dom.DomHelper} `DomHelper`。
 */
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;


/**
 * `document` オブジェクトを設定する。
 * @param {!Document} document `Document` オブジェクト。
 */
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};


/**
 * DOM ライブラリを利用して `document` オブジェクトを返す。
 * @return {!Document} `Document` オブジェクト。
 */
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};


/**
 * `getElementById` のエイリアス。DOM ノードが引数として渡された場合はそのまま
 * 返す。
 * @param {string|Element} element 要素の ID、または DOM ノード。
 * @return {Element} 与えられた ID をもつ要素。または、引数で与えられたDOM
 *     ノード。
 */
goog.dom.DomHelper.prototype.getElement = function(element) {
  return goog.dom.getElementHelper_(this.document_, element);
};


/**
 * 与えられた ID をもつ要素を返す。要素が存在しなければ例外が発生する。
 *
 * これは、要素が存在すると期待されていて、かつ要素がその在師なかったときは例外
 * を発生させたいときに使う。
 *
 * @param {string} id 要素の ID。
 * @return {!Element} 与えられた ID をもつ要素（存在すれば）。
 */
goog.dom.DomHelper.prototype.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(this.document_, id);
};


/**
 * `getElement` のエイリアス。
 * @param {string|Element} element 要素の ID、または DOM ノード。
 * @return {Element} 与えられた ID をもつ要素。または、引数で与えられたDOM
 * @deprecated `goog.dom.DomHelper.prototype.getElement` を使うべき。
 */
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;


/**
 * 要素をタグとクラス名から検索する。
 * ブラウザのネイティブな関数（`querySelectorAll` や、`getElementsByTagName` 、
 * `getElementsByClassName`）が利用可能であれば使う。戻り値の配列は与えられた
 * コードによって `NodeList` か静的なリストのどちらかとなる。
 *
 * @see `goog.dom.query`
 *
 * @param {?string=} opt_tag 要素のタグ名、または `*`（全てのタグ）。
 * @param {?string=} opt_class クラス名（省略可能）。
 * @param {(Document|Element)=} opt_el 検索範囲となる要素（省略可能）。
 * @return { {length: number} } 得られた要素からなる配列のようなオブジェクト。
 *     `length` プロパティと数字によるインデックスが存在することは保証される。
 */
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag,
                                                                     opt_class,
                                                                     opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag,
                                                opt_class, opt_el);
};


/**
 * 与えられたクラス名を持つすべての要素を返す。
 * @see `goog.dom.query`
 * @param {string} className 検索したいクラス名。
 * @param {(Document|Element)=} opt_el 検索範囲となる要素（省略可能）。
 * @return { {length: number} } 与えられたクラス名を持つすべての要素。
 */
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc);
};


/**
 * 与えられたクラス名を持つ最初の要素を返す。
 * @see `goog.dom.query`
 * @param {string} className 検索したいクラス名。
 * @param {(Element|Document)=} opt_el 検索範囲となる要素（省略可能）。
 * @return {Element} 与えられたクラス名を持つ最初の要素。
 */
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc);
};


/**
 * 与えられたクラス名を持つ最初の要素を返す。要素が存在しなければ例外が発生
 * する。
 * @see `goog.dom.query`
 * @param {string} className 検索したいクラス名。
 * @param {(!Element|!Document)=} opt_root 検索範囲となる要素（省略可能）。
 * @return {!Element} 与えられたクラス名を持つ最初の要素。
 * @throws {goog.asserts.AssertionError} 要素が見つからなければ発生する。
 */
goog.dom.DomHelper.prototype.getRequiredElementByClass = function(className,
                                                                  opt_root) {
  var root = opt_root || this.document_;
  return goog.dom.getRequiredElementByClass(className, root);
};


/**
 * `getElementsByTagNameAndClass` のエイリアス。
 * @deprecated `getElementsByTagNameAndClass` を使うべき。
 * @see `goog.dom.query`
 *
 * @param {?string=} opt_tag 要素のタグ名。
 * @param {?string=} opt_class クラス名（省略可能）。
 * @param {Element=} opt_el 検索範囲となる要素（省略可能）。
 * @return { {length: number} } 得られた要素からなる配列のようなオブジェクト。
 *     `length` プロパティと数字によるインデックスが存在することは保証される。
 */
goog.dom.DomHelper.prototype.$$ =
    goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;


/**
 * 複数のプロパティをノードに設定する。
 * @param {Element} element DOM ノードを設定したいノード。
 * @param {Object} properties プロパティ名と値からなるハッシュ。
 */
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;


/**
 * viewport の寸法を返す。
 * @param {Window=} opt_window 調べたい `window` 要素（省略可能）。省略時はこの
 *     `window` の `DomHelper`。
 * @return {!goog.math.Size} `'width'` と `'height'` をもつオブジェクト。
 */
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  // TODO(arv): この関数は引数を取るべきだ。これは `frame`/`window`/`document`
  // を `DomHelper` として扱うルールに違反している。
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};


/**
 * この `document` の高さを計算する。
 *
 * @return {number} この `document` の高さ。
 */
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};


/**
 * `goog.dom.createDom` と `goog.dom.append` で用いる型定義。
 * @typedef {Object|string|Array|NodeList}
 */
goog.dom.Appendable;


/**
 * 与えられた属性をもつ DOM ノードを作成して返す。また、後続の可変長引数にノード
 * を与えることによって、作成されるノードの子要素を指定できる。
 *
 * たとえば、
 *
 * ```
 * createDom('div', null, createDom('p'), createDom('p'));
 * ```
 *
 * は2つのパラグラフを子要素に持つ `div` を返す。
 *
 * また、ある要素のすべての子要素を新しい要素の子要素にするときは、次のように
 * 書く：
 *
 * ```
 * createDom('div', null, oldElement.childNodes);
 * ```
 *
 * これは、元の要素から全ての子要素を取り除き、新しい `DIV` の子要素として移す。
 *
 * @param {string} tagName 作成するタグ名。
 * @param {Object|string=} opt_attributes 属性名と属性値からなるオブジェクト。
 *     文字列の場合は、`className` の値となる。
 * @param {...goog.dom.Appendable} var_args DOM ノード、テキストノード代わりの
 *     文字列。もし、`var_args` の最初の引数が配列か `NodeList` であれば、これら
 *     に含まれるすべての要素が `childNodes` に追加される。
 * @return {!Element} DOM ノードへの参照。
 */
goog.dom.DomHelper.prototype.createDom = function(tagName,
                                                  opt_attributes,
                                                  var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};


/**
 * `createDom` へのエイリアス。
 * @param {string} tagName 作成するタグ名。
 * @param {Object|string=} opt_attributes 属性名と属性値からなるオブジェクト。
 *     文字列の場合は、`className` の値となる。
 * @param {...goog.dom.Appendable} var_args DOM ノード、テキストノード代わりの
 *     文字列。もし、`var_args` の最初の引数が配列か `NodeList` であれば、これら
 *     に含まれるすべての要素が `childNodes` に追加される。
 * @return {!Element} DOM ノードへの参照。
 * @deprecated `goog.dom.DomHelper.prototype.createDom` を使うべき。
 */
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;


/**
 * 新しい要素を作成して返す。
 * @param {string} name タグ名。
 * @return {!Element} 新しい要素。
 */
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name);
};


/**
 * 新しいテキストノードを作成して返す。
 * @param {number|string} content 内容。
 * @return {!Text} 新しいテキストノード。
 */
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(String(content));
};


/**
 * 表（テーブル）を作成する。
 * @param {number} rows 表の行数（1よりも大きい必要がある）。
 * @param {number} columns 表の列数（1よりも大きい必要がある）。
 * @param {boolean=} opt_fillWithNbsp `true` であれば、セルを `nbsp` で埋める。
 * @return {!Element} 作成された表。
 */
goog.dom.DomHelper.prototype.createTable = function(rows, columns,
    opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns,
      !!opt_fillWithNbsp);
};


/**
 * HTML 文字列をノード、または `DocumentFragment` に変換する。`htmlString` が
 * ひとつのノードしか作成しなければ、ノードが返る。`htmlString` が複数のノードを
 * 作成したときは、これらのノードをもつ `DocumentFragment` が返る。
 *
 * @param {string} htmlString 変換される HTML 文字列。
 * @return {!Node} 作成されたノード。
 */
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString);
};


/**
 * ブラウザが標準的な CSS1 互換モードならば `true` を返す。それ以外は `false` を
 * 返す。
 * @return {boolean} CSS1 互換モードであれば `true`。
 */
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};


/**
 * この `document` が属している `window` を返す。
 * @return {!Window} この `document` が属している `window`。
 */
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};


/**
 * この `document` のスクロール要素を返す。
 * @return {Element} スクロール要素。
 */
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};


/**
 * この `document` のスクロール位置を座標オブジェクトで返す。
 * @return {!goog.math.Coordinate} `'x'` と `'y'` というプロパティをもつ
 *     オブジェクト。
 */
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};


/**
 * この `document` でアクティブな要素を返す。
 * @param {Document=} opt_doc 検索範囲となる `document`。
 * @return {Element} アクティブな要素。
 */
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_);
};


/**
 * ノードに子要素を追加する。
 * @param {Node} parent 親要素。
 * @param {Node} child 子要素。
 */
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;


/**
 * ノードに子要素または文字列を追加する。
 * @param {!Node} parent 追加される対象のノード。
 * @param {...goog.dom.Appendable} var_args ノードに追加されるもの。
 *     もしノードであれば、そのまま追加される。
 *     もし文字列であれば、テキストノードとして追加される。
 *     もし配列のようなオブジェクトであれば、`0` から `length - 1` までの
 *     フィールドが追加される。
 */
goog.dom.DomHelper.prototype.append = goog.dom.append;


/**
 * 与えられたノードが子をもてるかどうかを判定する。HTML 生成に使われる。
 *
 * @param {Node} node 判定したいノード。
 * @return {boolean} このノードが子を持てるかどうか。
 */
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;


/**
 * この DOM ノードからすべての子ノードを除去する。
 * @param {Node} node 子要素を除去する対象となるノード。
 */
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;


/**
 * ノードを既存のノードの参照の前（ようするに兄要素として）に挿入する。
 * もし与えられたノードの参照が親を持たなければ何もしない。
 * @param {Node} newNode 挿入されるノード。
 * @param {Node} refNode 挿入される位置の基準となるノードへの参照。
 */
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;


/**
 * Inserts a new node after an existing reference node (i.e., as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;


/**
 * Insert a child at a given index. If index is larger than the number of child
 * nodes that the parent currently has, the node is inserted as the last child
 * node.
 * @param {Element} parent The element into which to insert the child.
 * @param {Node} child The element to insert.
 * @param {number} index The index at which to insert the new child node. Must
 *     not be negative.
 */
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children, or undefined if the element was already not in the
 *     document.
 */
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;


/**
 * Returns an array containing just the element children of the given element.
 * @param {Element} element The element whose element children we want.
 * @return {!(Array|NodeList)} An array or array-like list of just the element
 *     children of the given element.
 */
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getFirstElementChild =
    goog.dom.getFirstElementChild;


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getNextElementSibling =
    goog.dom.getNextElementSibling;


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.DomHelper.prototype.getPreviousElementSibling =
    goog.dom.getPreviousElementSibling;


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;


/**
 * Whether the object looks like an Element.
 * @param {*} obj The object being tested for Element likeness.
 * @return {boolean} Whether the object looks like an Element.
 */
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;


/**
 * Returns true if the specified value is a Window object. This includes the
 * global window for HTML pages, and iframe windows.
 * @param {*} obj Variable to test.
 * @return {boolean} Whether the variable is a window.
 */
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;


/**
 * Returns an element's parent, if it's an Element.
 * @param {Element} element The DOM element.
 * @return {Element} The parent, or null if not an Element.
 */
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.DomHelper.prototype.contains = goog.dom.contains;


/**
 * Compares the document order of two nodes, returning 0 if they are the same
 * node, a negative number if node1 is before node2, and a positive number if
 * node2 is before node1.  Note that we compare the order the tags appear in the
 * document so in the tree <b><i>text</i></b> the B node is considered to be
 * before the I node.
 *
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} 0 if the nodes are the same node, a negative number if node1
 *     is before node2, and a positive number if node2 is before node1.
 */
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;


/**
 * Find the deepest common ancestor of the given nodes.
 * @param {...Node} var_args The nodes to find a common ancestor of.
 * @return {Node} The common ancestor of the nodes, or null if there is none.
 *     null will only be returned if two or more of the nodes are from different
 *     documents.
 */
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;


/**
 * Returns the owner document for a node.
 * @param {Node} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;


/**
 * Cross browser function for getting the document element of an iframe.
 * @param {Element} iframe Iframe element.
 * @return {!Document} The frame content document.
 */
goog.dom.DomHelper.prototype.getFrameContentDocument =
    goog.dom.getFrameContentDocument;


/**
 * Cross browser function for getting the window of a frame or iframe.
 * @param {Element} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.DomHelper.prototype.getFrameContentWindow =
    goog.dom.getFrameContentWindow;


/**
 * Sets the text content of a node, with cross-browser support.
 * @param {Node} node The node to change the text content of.
 * @param {string|number} text The value that should replace the node's content.
 */
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;


/**
 * Gets the outerHTML of a node, which islike innerHTML, except that it
 * actually contains the HTML of the node itself.
 * @param {Element} element The element to get the HTML of.
 * @return {string} The outerHTML of the given element.
 */
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;


/**
 * Finds the first descendant node that matches the filter function. This does
 * a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Node|undefined} The found node or undefined if none is found.
 */
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;


/**
 * Finds all the descendant nodes that matches the filter function. This does a
 * depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Array.<Node>} The found nodes or an empty array if none are found.
 */
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;


/**
 * Returns true if the element has a tab index that allows it to receive
 * keyboard focus (tabIndex >= 0), false otherwise.  Note that some elements
 * natively support keyboard focus, even if they have no tab index.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index that allows keyboard
 *     focus.
 */
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;


/**
 * Enables or disables keyboard focus support on the element via its tab index.
 * Only elements for which {@link goog.dom.isFocusableTabIndex} returns true
 * (or elements that natively support keyboard focus, like form elements) can
 * receive keyboard focus.  See http://go/tabindex for more info.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to set or remove a tab index on the element
 *     that supports keyboard focus.
 */
goog.dom.DomHelper.prototype.setFocusableTabIndex =
    goog.dom.setFocusableTabIndex;


/**
 * Returns true if the element can be focused, i.e. it has a tab index that
 * allows it to receive keyboard focus (tabIndex >= 0), or it is an element
 * that natively supports keyboard focus.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element allows keyboard focus.
 */
goog.dom.DomHelper.prototype.isFocusable = goog.dom.isFocusable;


/**
 * Returns the text contents of the current node, without markup. New lines are
 * stripped and whitespace is collapsed, such that each character would be
 * visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by
 * {@code goog.dom.getNodeTextLength}.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;


/**
 * Returns the node at a given offset in a parent node.  If an object is
 * provided for the optional third parameter, the node and the remainder of the
 * offset will stored as properties of this object.
 * @param {Node} parent The parent node.
 * @param {number} offset The offset into the parent node.
 * @param {Object=} opt_result Object to be used to store the return value. The
 *     return value will be stored in the form {node: Node, remainder: number}
 *     if this object is provided.
 * @return {Node} The node at the given offset.
 */
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;


/**
 * Returns true if the object is a {@code NodeList}.  To qualify as a NodeList,
 * the object must have a numeric length property and an item function (which
 * has type 'string' on IE for some reason).
 * @param {Object} val Object to test.
 * @return {boolean} Whether the object is a NodeList.
 */
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?(goog.dom.TagName|string)=} opt_tag The tag name to match (or
 *     null/undefined to match only based on class name).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match only based on tag name).
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if no match is found.
 */
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass =
    goog.dom.getAncestorByTagNameAndClass;


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * class name. If the passed element matches the specified criteria, the
 * element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {string} class The class name to match.
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.DomHelper.prototype.getAncestorByClass =
    goog.dom.getAncestorByClass;


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
