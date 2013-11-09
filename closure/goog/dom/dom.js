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
 * @see goog.dom.query
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
 * @see {goog.dom.query}
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
 * @see {goog.dom.query}
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
 * Gets the outerHTML of a node, which islike innerHTML, except that it
 * actually contains the HTML of the node itself.
 * @param {Element} element The element to get the HTML of.
 * @return {string} The outerHTML of the given element.
 */
goog.dom.getOuterHtml = function(element) {
  // IE, Opera and WebKit all have outerHTML.
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
 * Finds the first descendant node that matches the filter function, using
 * a depth first search. This function offers the most general purpose way
 * of finding a matching element. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.
 * @see goog.dom.query
 *
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Node|undefined} The found node or undefined if none is found.
 */
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined;
};


/**
 * Finds all the descendant nodes that match the filter function, using a
 * a depth first search. This function offers the most general-purpose way
 * of finding a set of matching elements. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.

 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {!Array.<!Node>} The found nodes or an empty array if none are found.
 */
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv;
};


/**
 * Finds the first or all the descendant nodes that match the filter function,
 * using a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @param {!Array.<!Node>} rv The found nodes are added to this array.
 * @param {boolean} findOne If true we exit after the first found node.
 * @return {boolean} Whether the search is complete or not. True in case findOne
 *     is true and the node is found. False otherwise.
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
 * Map of tags whose content to ignore when calculating text length.
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
 * Map of tags which have predefined values with regard to whitespace.
 * @type {Object}
 * @private
 */
goog.dom.PREDEFINED_TAG_VALUES_ = {'IMG': ' ', 'BR': '\n'};


/**
 * Returns true if the element has a tab index that allows it to receive
 * keyboard focus (tabIndex >= 0), false otherwise.  Note that some elements
 * natively support keyboard focus, even if they have no tab index.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index that allows keyboard
 *     focus.
 * @see http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
 */
goog.dom.isFocusableTabIndex = function(element) {
  return goog.dom.hasSpecifiedTabIndex_(element) &&
         goog.dom.isTabIndexFocusable_(element);
};


/**
 * Enables or disables keyboard focus support on the element via its tab index.
 * Only elements for which {@link goog.dom.isFocusableTabIndex} returns true
 * (or elements that natively support keyboard focus, like form elements) can
 * receive keyboard focus.  See http://go/tabindex for more info.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to set or remove a tab index on the element
 *     that supports keyboard focus.
 */
goog.dom.setFocusableTabIndex = function(element, enable) {
  if (enable) {
    element.tabIndex = 0;
  } else {
    // Set tabIndex to -1 first, then remove it. This is a workaround for
    // Safari (confirmed in version 4 on Windows). When removing the attribute
    // without setting it to -1 first, the element remains keyboard focusable
    // despite not having a tabIndex attribute anymore.
    element.tabIndex = -1;
    element.removeAttribute('tabIndex'); // Must be camelCase!
  }
};


/**
 * Returns true if the element can be focused, i.e. it has a tab index that
 * allows it to receive keyboard focus (tabIndex >= 0), or it is an element
 * that natively supports keyboard focus.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element allows keyboard focus.
 */
goog.dom.isFocusable = function(element) {
  var focusable;
  // Some elements can have unspecified tab index and still receive focus.
  if (goog.dom.nativelySupportsFocus_(element)) {
    // Make sure the element is not disabled ...
    focusable = !element.disabled &&
        // ... and if a tab index is specified, it allows focus.
        (!goog.dom.hasSpecifiedTabIndex_(element) ||
         goog.dom.isTabIndexFocusable_(element));
  } else {
    focusable = goog.dom.isFocusableTabIndex(element);
  }

  // IE requires elements to be visible in order to focus them.
  return focusable && goog.userAgent.IE ?
             goog.dom.hasNonZeroBoundingRect_(element) : focusable;
};


/**
 * Returns true if the element has a specified tab index.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a specified tab index.
 * @private
 */
goog.dom.hasSpecifiedTabIndex_ = function(element) {
  // IE returns 0 for an unset tabIndex, so we must use getAttributeNode(),
  // which returns an object with a 'specified' property if tabIndex is
  // specified.  This works on other browsers, too.
  var attrNode = element.getAttributeNode('tabindex'); // Must be lowercase!
  return goog.isDefAndNotNull(attrNode) && attrNode.specified;
};


/**
 * Returns true if the element's tab index allows the element to be focused.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element's tab index allows focus.
 * @private
 */
goog.dom.isTabIndexFocusable_ = function(element) {
  var index = element.tabIndex;
  // NOTE: IE9 puts tabIndex in 16-bit int, e.g. -2 is 65534.
  return goog.isNumber(index) && index >= 0 && index < 32768;
};


/**
 * Returns true if the element is focusable even when tabIndex is not set.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element natively supports focus.
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
 * Returns true if the element has a bounding rectangle that would be visible
 * (i.e. its width and height are greater than zero).
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a non-zero bounding rectangle.
 * @private
 */
goog.dom.hasNonZeroBoundingRect_ = function(element) {
  var rect = goog.isFunction(element['getBoundingClientRect']) ?
      element.getBoundingClientRect() :
      {'height': element.offsetHeight, 'width': element.offsetWidth};
  return goog.isDefAndNotNull(rect) && rect.height > 0 && rect.width > 0;
};


/**
 * Returns the text content of the current node, without markup and invisible
 * symbols. New lines are stripped and whitespace is collapsed,
 * such that each character would be visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.getTextContent = function(node) {
  var textContent;
  // Note(arv): IE9, Opera, and Safari 3 support innerText but they include
  // text nodes in script tags. So we revert to use a user agent test here.
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && ('innerText' in node)) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
    // Unfortunately .innerText() returns text with &shy; symbols
    // We need to filter it out and then remove duplicate whitespaces
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join('');
  }

  // Strip &shy; entities. goog.format.insertWordBreaks inserts them in Opera.
  textContent = textContent.replace(/ \xAD /g, ' ').replace(/\xAD/g, '');
  // Strip &#8203; entities. goog.format.insertWordBreaks inserts them in IE8.
  textContent = textContent.replace(/\u200B/g, '');

  // Skip this replacement on old browsers with working innerText, which
  // automatically turns &nbsp; into ' ' and / +/ into ' ' when reading
  // innerText.
  if (!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, ' ');
  }
  if (textContent != ' ') {
    textContent = textContent.replace(/^\s*/, '');
  }

  return textContent;
};


/**
 * Returns the text content of the current node, without markup.
 *
 * Unlike {@code getTextContent} this method does not collapse whitespaces
 * or normalize lines breaks.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The raw text content.
 */
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);

  return buf.join('');
};


/**
 * Recursive support function for text content retrieval.
 *
 * @param {Node} node The node from which we are getting content.
 * @param {Array} buf string buffer.
 * @param {boolean} normalizeWhitespace Whether to normalize whitespace.
 * @private
 */
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    // ignore certain tags
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
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by goog.dom.getNodeTextLength.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent The node relative to which the offset will
 *     be calculated. Defaults to the node's owner document's body.
 * @return {number} The text offset.
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
  // Trim left to deal with FF cases when there might be line breaks and empty
  // nodes at the front of the text
  return goog.string.trimLeft(buf.join('')).replace(/ +/g, ' ').length;
};


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
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur = null;
  while (stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
      // ignore certain tags
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
 * Returns true if the object is a {@code NodeList}.  To qualify as a NodeList,
 * the object must have a numeric length property and an item function (which
 * has type 'string' on IE for some reason).
 * @param {Object} val Object to test.
 * @return {boolean} Whether the object is a NodeList.
 */
goog.dom.isNodeList = function(val) {
  // TODO(attila): Now the isNodeList is part of goog.dom we can use
  // goog.userAgent to make this simpler.
  // A NodeList must have a length property of type 'number' on all platforms.
  if (val && typeof val.length == 'number') {
    // A NodeList is an object everywhere except Safari, where it's a function.
    if (goog.isObject(val)) {
      // A NodeList must have an item function (on non-IE platforms) or an item
      // property of type 'string' (on IE).
      return typeof val.item == 'function' || typeof val.item == 'string';
    } else if (goog.isFunction(val)) {
      // On Safari, a NodeList is a function with an item property that is also
      // a function.
      return typeof val.item == 'function';
    }
  }

  // Not a NodeList.
  return false;
};


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
 * @param {Node} element The DOM node to start with.
 * @param {string} className The class name to match.
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className);
};


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
  // Reached the root of the DOM without a match
  return null;
};


/**
 * Determines the active element in the given document.
 * @param {Document} doc The document to look in.
 * @return {Element} The active element.
 */
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement;
  } catch (e) {
    // NOTE(nicksantos): Sometimes, evaluating document.activeElement in IE
    // throws an exception. I'm not 100% sure why, but I suspect it chokes
    // on document.activeElement if the activeElement has been recently
    // removed from the DOM by a JS operation.
    //
    // We assume that an exception here simply means
    // "there is no active element."
  }

  return null;
};


/**
 * @private {number} Cached version of the devicePixelRatio.
 */
goog.dom.devicePixelRatio_;


/**
 * Gives the devicePixelRatio, or attempts to determine if not present.
 *
 * By default, this is the same value given by window.devicePixelRatio. If
 * devicePixelRatio is not defined, the ratio is calculated with
 * window.matchMedia, if present. Otherwise, gives 1.0.
 *
 * This function is cached so that the pixel ratio is calculated only once
 * and only calculated when first requested.
 *
 * @return {number} The number of actual pixels per virtual pixel.
 */
goog.dom.getPixelRatio = goog.functions.cacheReturnValue(function() {
  var win = goog.dom.getWindow();

  // devicePixelRatio does not work on Mobile firefox.
  // TODO(user): Enable this check on a known working mobile Gecko version.
  // Filed a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=896804
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
 * Calculates a mediaQuery to check if the current device supports the
 * given actual to virtual pixel ratio.
 * @param {number} pixelRatio The ratio of actual pixels to virtual pixels.
 * @return {number} pixelRatio if applicable, otherwise 0.
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
 * Create an instance of a DOM helper with a new document object.
 * @param {Document=} opt_document Document object to associate with this
 *     DOM helper.
 * @constructor
 */
goog.dom.DomHelper = function(opt_document) {
  /**
   * Reference to the document object to use
   * @type {!Document}
   * @private
   */
  this.document_ = opt_document || goog.global.document || document;
};


/**
 * Gets the dom helper object for the document where the element resides.
 * @param {Node=} opt_node If present, gets the DomHelper for this node.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;


/**
 * Sets the document object.
 * @param {!Document} document Document object.
 */
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};


/**
 * Alias for {@code getElementById}. If a DOM node is passed in then we just
 * return that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.DomHelper.prototype.getElement = function(element) {
  return goog.dom.getElementHelper_(this.document_, element);
};


/**
 * Gets an element by id, asserting that the element is found.
 *
 * This is used when an element is expected to exist, and should fail with
 * an assertion error if it does not (if assertions are enabled).
 *
 * @param {string} id Element ID.
 * @return {!Element} The element with the given ID, if it exists.
 */
goog.dom.DomHelper.prototype.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(this.document_, id);
};


/**
 * Alias for {@code getElement}.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.getElement} instead.
 */
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. The returned array is a live
 * NodeList or a static list depending on the code path taken.
 *
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name or * for all tags.
 * @param {?string=} opt_class Optional class name.
 * @param {(Document|Element)=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag,
                                                                     opt_class,
                                                                     opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag,
                                                opt_class, opt_el);
};


/**
 * Returns an array of all the elements with the provided className.
 * @see {goog.dom.query}
 * @param {string} className the name of the class to look for.
 * @param {Element|Document=} opt_el Optional element to look in.
 * @return { {length: number} } The items found with the class name provided.
 */
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc);
};


/**
 * Returns the first element we find matching the provided class name.
 * @see {goog.dom.query}
 * @param {string} className the name of the class to look for.
 * @param {(Element|Document)=} opt_el Optional element to look in.
 * @return {Element} The first item found with the class name provided.
 */
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc);
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @deprecated Use DomHelper getElementsByTagNameAndClass.
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.$$ =
    goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;


/**
 * Sets a number of properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;


/**
 * Gets the dimensions of the viewport.
 * @param {Window=} opt_window Optional window element to test. Defaults to
 *     the window of the Dom Helper.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  // TODO(arv): This should not take an argument. That breaks the rule of a
  // a DomHelper representing a single frame/window/document.
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the document.
 */
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};


/**
 * Typedef for use with goog.dom.createDom and goog.dom.append.
 * @typedef {Object|string|Array|NodeList}
 */
goog.dom.Appendable;


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * An easy way to move all child nodes of an existing element to a new parent
 * element is:
 * <code>createDom('div', null, oldElement.childNodes);</code>
 * which will remove all child nodes from the old element and add them as
 * child nodes of the new DIV.
 *
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...goog.dom.Appendable} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or
 *     NodeList, its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.DomHelper.prototype.createDom = function(tagName,
                                                  opt_attributes,
                                                  var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};


/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {(Object|string)=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...goog.dom.Appendable} var_args Further DOM nodes or strings for
 *     text nodes.  If one of the var_args is an array, its children will be
 *     added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.createDom} instead.
 */
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name);
};


/**
 * Creates a new text node.
 * @param {number|string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(String(content));
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.DomHelper.prototype.createTable = function(rows, columns,
    opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns,
      !!opt_fillWithNbsp);
};


/**
 * Converts an HTML string into a node or a document fragment.  A single Node
 * is used if the {@code htmlString} only generates a single node.  If the
 * {@code htmlString} generates multiple nodes then these are put inside a
 * {@code DocumentFragment}.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting node.
 */
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString);
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};


/**
 * Gets the window object associated with the document.
 * @return {!Window} The window associated with the given document.
 */
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};


/**
 * Gets the document scroll distance as a coordinate object.
 * @return {!goog.math.Coordinate} Object with properties 'x' and 'y'.
 */
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};


/**
 * Determines the active element in the given document.
 * @param {Document=} opt_doc The document to look in.
 * @return {Element} The active element.
 */
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_);
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;


/**
 * Appends a node with text or other nodes.
 * @param {!Node} parent The node to append nodes to.
 * @param {...goog.dom.Appendable} var_args The things to append to the node.
 *     If this is a Node it is appended as is.
 *     If this is a string then a text node is appended.
 *     If this is an array like object then fields 0 to length - 1 are appended.
 */
goog.dom.DomHelper.prototype.append = goog.dom.append;


/**
 * Determines if the given node can contain children, intended to be used for
 * HTML generation.
 *
 * @param {Node} node The node to check.
 * @return {boolean} Whether the node can contain children.
 */
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;


/**
 * Inserts a new node before an existing reference node (i.e., as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
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
