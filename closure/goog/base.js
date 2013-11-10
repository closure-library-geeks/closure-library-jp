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
 * @fileoverview Google の JS ライブラリ（Closure）のブートストラップ処理。
 *
 * もし、 `goog.CLOSURE_NO_DEPS` が `true` のとき、コンパイルされていない
 * base.js は依存関係ファイルを書き出す。これによって異なる環境下でそれぞれが依
 * 存関係を解決するのことができるようになる。
 *
 *
 * @provideGoog
 */


/**
 * @define {boolean} `--closure_pass` か `--mark_as_compiled` が指定された場合
 *     に、 コンパイラによって `true` に上書きされる。
 */
var COMPILED = false;


/**
 * Closure Library のトップレベル名前空間。現在のスコープで既に `goog` が定義さ
 * れている場合には、繰り返し定義されてしまうことを防ぐ。
 *
 * @const
 */
var goog = goog || {};


/**
 * グローバルコンテキストへの参照。たいていの場合は `window`。
 */
goog.global = this;


/**
 * 未コンパイルモードのときに定義値を上書きするためのフック。
 *
 * 未コンパイルモードでは `CLOSURE_DEFINES` は base.js のロード後に定義される可
 * 能性がある。もし、`CLOSURE_DEFINES` にあるキーが定義されているならば、
 * `goog.define` はこの定義値を優先的に利用する。つまり、コンパイルしないでも、
 * 定義値を上書きできるということである（通常では、この定義値はコンパイラの
 * `define` オプションによって上書きされる）。
 *
 * 例:
 * ```
 *   var CLOSURE_DEFINES = {'goog.DEBUG': false};
 * ```
 * @type {Object.<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_DEFINES;


/**
 * 名前空間パスからオブジェクト階層を構築する。名前が既に定義されていた場合は上
 * 書きしない。
 * 例：`"a.b.c"` -> `a = {}; a.b = {}; a.b.c = {};`
 * `goog.provide`、`goog.exportSymbol` で使う。
 * @param {string} name 対象となっているオブジェクトの属する名前空間の名前パス。
 * @param {*=} opt_object 名前パスの末尾で定義されているオブジェクト。省略可能。
 * @param {Object=} opt_objectToExportTo オブジェクトを追加する際のスコープ。省
 *     略時は `goog.global` 。
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer ではこのやり方で外部出力してエラーが投げられた場合は異な
  // る挙動を示す。 base_test.html 中の `testExportSymbolExceptions` の例を参
  // 照。
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // いくつかのブラウザは `for((a in b); c;);` の形式のコードを解釈できない。こ
  // のパターンは JS コンパイラによって下の文が書き換えられたときに生じる。これ
  // を防止するために for 文 を使い、下のような初期化ロジックを用意する。

  // Firefox での strict モードにおける警告を避けるために括弧を用いる。
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && opt_object !== undefined) {
      // part が最後の要素で opt_object が与えられていればそれを用いる。
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * 値を命名して定義する。
 *
 * 未コンパイルモードで `goog.global.CLOSURE_DEFINES` に該当する値が存在すれば、
 * これを使う。存在しなければ、初期値が使われる。コンパイルするときに初期値をコ
 * ンパイラのコマンドラインオプションで上書きできる。
 *
 * @param {string} name 定義する値の名前。
 * @param {string|number|boolean} defaultValue 初期値。
 */
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_DEFINES && Object.prototype.hasOwnProperty.call(
        goog.global.CLOSURE_DEFINES, name)) {
      value = goog.global.CLOSURE_DEFINES[name];
    }
  }
  goog.exportPath_(name, value);
};


/**
 * @define {boolean} `--define goog.DEBUG=false` を指定することによってデバッグ
 * コードが製品版に含まれることを簡単に防ぐことができる。例えば、多くの
 * `toString()` メソッドは (1) デバッグを目的として使われる、(2) JSコンパイラに
 * とって `toString()` が使われているかどうかを判定することが難しい、という 2
 * つの理由から `if (goog.DEBUG)` というように宣言されることが望ましい。
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE はコンパイルする際の言語を定義する。地域特有のデータ
 * を用いる場合に選択するとよい。JS コンパイラの実行時に
 * `--define goog.LOCALE=locale_name` というように指定する。
 *
 * アカウントの中では地域特有のコードは重要である。ハイフンを区切り文字とした標
 * 準的な Unicode で指定する必要がある。言語（小文字） - 国・地域（大文字）のよ
 * うに指定する。
 * 例：`'ja-JP'`、`'en'`、`'en-US'`、`'sr-Latin-BO'`、`'zh-Hans-CN'`
 *
 * 地域・言語情報の詳細は以下を参照。
 *
 * ```
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers}
 * ```
 *
 * 言語コードは ISO 639-1によって定義されている値を指定する。
 *
 * ```
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm
 * ```
 *
 * を参照。
 * 注記： ヘブライ言語については新コード(he)ではなく旧コード(iw)を使うほうがよ
 * い。`http://wiki/Main/IIISynonyms` を参照（デッドリンク）。
 */
goog.define('goog.LOCALE', 'en');  // デフォルトはen（英語）


/**
 * @define {boolean} このスクリプトが動作するサイトは信頼できるサイトであれば、
 *     `true` 。
 *
 * 信頼されていないサイトとは、いくつかのネイティブ関数を Prototype や Datejs 、
 * jQuery などが上書きしているサイトのこと。このフラグを `false` にすれば、
 * Closure Library は自身で実装した関数を用いる（可能であれば）。
 *
 * もし、あなたのスクリプトが第三者のサイトに読み込まれる場合や、非標準なネイ
 * ティブ関数実装がある場合は、`--define goog.TRUSTED_SITE=false`を設定す
 * るとよい。
 */
goog.define('goog.TRUSTED_SITE', true);


/**
 * オブジェクトスタブ（空の名前空間）を作成する。 `goog.provide()` はそのファイ
 * ルの提供する名前空間/オブジェクトを定義する。ビルドツールはこの
 * provide/require 文から依存関係を把握し、依存関係の記述ファイル dep.js を生成
 * する。
 * @see goog.require
 * @param {string} name このファイルが提供する名前空間を
 *     `"goog.package.part"` のようにして指定する。
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // 名前空間が 2 度定義されないようにする。これは変数宣言に影響を与えることを
    // 新しい開発者に悟らせる意図がある。JS コンパイラが goog.provide を実際の変
    // 数宣言へと変換されたとき、コンパイルされた JS は元の JS と同じように動作
    // しなければならない。したがって、間違った goog.provide の使い方を含むコー
    // ドのコンパイルの結果が動作しないのと同様に、コンパイル前の JS も動作して
    // はならない。
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * このファイルがテスト目的のファイルで製品コードに含まれないようにマークする。
 *
 * ユニットテストの場合、このメッセージは名前空間（例：`goog.stringTest`）でも
 * よい。このとき、 Linter は外部からの `provide` を無視する（明示的に定義してい
 * なければ）。
 *
 * @param {string=} opt_message 除去されないまま製品コードに含まれてしまった場合
 *      のエラーメッセージに追記される文字列。省略可能。
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * 与えられた名前パスで既に `goog.provide` されているかどうかを判定する。
   * `goog.implicitNamespaces_` に与えられた名前が存在する場合に `false` が返さ
   * れる。
   * @param {string} name 判定したい名前パス。
   * @return {boolean} 与えられた名前パスで既に定義されていれば `true` 。
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * 名前空間は暗黙的に `goog.provide` によって定義される。例えば、
   * `goog.provide('goog.events.Event')` が実行された場合には暗黙的に `goog` と
   * `goog.events` が名前空間として宣言されている。
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * 外部にある完全な名前パスをもつオブジェクトを返す。コンパイルされた場合にはプ
 * ロパティがリネームされるため、プロパティ名には注意すること。
 *
 * @param {string} name 完全な名前パス。
 * @param {Object=} opt_obj オブジェクトをこの名前空間から探す。省略時は
 *     `goog.global` 。
 * @return {?} プリミティブな値かオブジェクト。見つからなかった場合は `null` 。
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * 与えられた名前空間のすべてのメンバをグローバルに追加する（`goog` や
 * `goog.lang` のように）。
 *
 * @param {Object} obj グローバルに追加するメンバを含む名前空間。
 * @param {Object=} opt_global メンバが追加される名前空間。省略可能。
 * @deprecated プロパティをグローバルスコープに追加することはできるものの、大き
 *     い名前空間のなかで実行されるべきでない。
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * このファイルに必要なファイルを依存関係に追加する。
 * @param {string} relPath この JavaScript のパス。
 * @param {Array} provides このファイルが定義するオブジェクトの名前からなる配
 *     列。
 * @param {Array} requires このファイルに必要なオブジェクトの名前からなる配列。
 */
goog.addDependency = function(relPath, provides, requires) {
  if (goog.DEPENDENCIES_ENABLED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an original way
// to do "debug-mode" development.  The dependency system can sometimes be
// confusing, as can the debug DOM loader's asynchronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the script
// will not load until some point after the current script.  If a namespace is
// needed at runtime, it needs to be defined in a previous script, or loaded via
// require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} true ならデバッグローダーを有効にする。
 *
 * これが有効にされていて、名前空間が既に登録されていれば `goog.provide` はスク
 * リプトタグを DOM に追加することで名前空間を読み込む。
 *
 * もし無効にすると `goog.provide` は名前空間を既に読込済みの状態にする。
 * つまり、他の仕組みによってスクリプトを読み込まなければならない。
 */
goog.define('goog.ENABLE_DEBUG_LOADER', true);


/**
 * 動的に依存関係を解決する関数。これはビルダー上でも動作する。
 * `--closire_pass` オプションが設定されている場合、JS コンパイラはこの関数を
 * 読み込むオブジェクトに書き換える。
 * @see goog.provide
 * @param {string} name 読み込みたい名前空間を `"goog.package.part" `のように記
 *     述した名前パス。名前空間は `goog.provide` によって定義されている必要があ
 *     る。
 */
goog.require = function(name) {

  // If the object already exists we do not need do do anything.
  // TODO(arv): If we start to support require based on file name this has to
  //            change.
  // TODO(arv): If we allow goog.foo.* this has to change.
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output.
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * ライブラリの読込の基準となる URI 。
 * @type {string}
 */
goog.basePath = '';


/**
 * コンパイラによる書き換えられる基準パス。 `goog.basePath` に置き換わる。
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * `true` ならば Closure 用の依存関係用ファイルを読み込む。 falsely ならば
 * `goog.basePath` 直下の deps.js が読み込まれる。
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * スクリプトを読み込むための関数。これは、 web workers のような Closure が HTML
 * ではない環境で動作することを想定して用意されている。この関数はグローバルスコ
 * ープで定義できるため、 base.js よりも前に読み込むことができる。この関数によっ
 * て非 HTML 環境でも deps.js による適切なインポートができる。
 *
 * この関数は相対 URI によってスクリプトをインポートできる必要がある。この関数
 * は、スクリプトが無事インポートできたら `true` を返し、それ以外の場合には
 * `false` を返すことが望ましい。
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * 零関数。コールバックの初期値などで使われる。
 * @return {void} なし。
 */
goog.nullFunction = function() {};


/**
 * 恒等関数。常に最初の引数を返す。
 *
 * @param {*=} opt_returnValue 返される唯一の値。
 * @param {...*} var_args 無視される追加の引数。戻り値に影響しない。
 * @return {?} 最初の引数。実際に実行されるまでは戻り値が何かを特定することがで
 *      きない。
 * @deprecated `goog.functions.identity` を使うべき。
 */
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * 抽象クラスやインターフェースのメソッドの初期値として使う関数。
 * サブクラスがこのメソッドのオーバーライドを忘れる・失敗するとエラーが投げられ
 * る。
 *
 * 抽象クラス `Foo` のメソッド `bar()` を定義することを考えると：
 *
 * ```
 * Foo.prototype.bar = goog.abstractMethod;
 * ```
 *
 * 脚注：
 * 引数なども含めてオーバーライドされることを考え、より抽象化するために関数名は
 * 設定されていない。
 *
 * @type {!Function}
 * @throws {Error} この関数をオーバーライドするべきであったことを警告する。
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * 常に同じインスタンスを返す静的メソッド（クラスメソッド） `getInstance` を定義
 * する。
 * @param {!Function} ctor 唯一のインスタンスを返すメソッドを加えたい静的オブ
 *     ジェクト。
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JS コンパイラは `Array#push` を最適化できない。
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * テストのためにインスタンス化されたすべてのシングルトンクラスが格納される。
 * ただし、これを直接読み込んではならない。 `goog.testing.singleton` モジュール
 * を使うべきである。これによって、コンパイラはこの変数が使われていない場合に除
 * 去することができるようになる。
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


/**
 * `goog.dependencies_` が有効ならば `true` 。
 * @const
 * @type {boolean}
 */
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;


if (goog.DEPENDENCIES_ENABLED) {
  /**
   * URL が既に追加されているかどうかを記録するためのオブジェクト。このレコード
   * は循環依存を防ぐために使われる。
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * 依存関係と読み込むスクリプトのデータを記録するためのオブジェクト。
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 以上
    nameToPath: {}, // 1 対 1
    requires: {}, // 1 以上
    // 依存しているファイルが複数回読み込まれることを防ぐ。
    visited: {},
    written: {} // 既にスクリプトに書き込み済みかどうかを記録しておく
  };


  /**
   * HTML 環境かどうかを判定する。
   * @return {boolean} HTML 環境であれば `true` 。
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument では `write` が存在しない。
  };


  /**
   * 起動時に base.js ファイルがあるファイルパスを得るための関数。
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // 現在のスクリプトの後ろから検索する（たいていの場合、base.js はここにあ
    // る）。
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * スクリプトをインポートする。インポートは既にインポートされている場合にはお
   * こなわれない。
   * 実行する際に必ず呼び出されなければならない。
   * @param {string} src スクリプトのファイルパス。
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * 関数をインポートするための標準的関数。インポートはスクリプトタグを書き込む
   * 方法でおこなわれる。
   *
   * @param {string} src インポートするファイルのパス。
   * @return {boolean} インポートに成功すれば `true` 。失敗すれば `false` 。
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;

      // ユーザーが新しいシンボルを `document` のと読み込み後に行うことは、正し
      // い使用方法ではない。このとき、`document.write` 、はページを消してしま
      // う。
      if (doc.readyState == 'complete') {
        // テストフレームワークでは、 base.js を複数回読み込む可能性があり、この
        // とき、deps.js も読み込まれる。これについはエラーを吐かずに失敗を通知
        // する。これらのフレームワークでは、base.js の読み込み中にページを一掃
        // するので、問題ない。
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * `goog.addDependency` によって追加された依存関係を解決する。
   * スクリプトは `goog.importScript_` によって正しい順番で呼び出される。
   * @private
   */
  goog.writeScripts_ = function() {
    // この関数実行時に書き込まれることが望ましい。
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // この場合はすでに読み込まれている。循環依存がある場合は `true` になる。
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // 与えられた名前が既に定義されていれば、別な手段によって読み込まれた
          // と見なす。
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * スクリプトファイルのパスを依存関係データから検索して返す。
   * @param {string} rule `"goog.namespace.Class"` または `"project.script"` の
   *     形式で記述された名前。
   * @return {?string} `rule` に関係するファイルの URL 。見つからなかった場合は
   *     `null` 。
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // 依存関係を Closure Library が管理できるようならば実行する。
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// 言語の拡張
//==============================================================================


/**
 * これは `typeof` 演算子(改)である。この `typeof` 演算子は `null` が与えられた
 * 場合は `'null'` を返し、配列が与えられた場合は `'array'` を返す。
 * @param {*} value 型を調べたいオブジェクト。
 * @return {string} 型の名前。
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // まず、可能であれば `Object.prototype.toString` が呼ばれることを避ける。
      //
      // IE では `typeof` が実行コンテキストによって不適切にまとめられている。
      // しかし、横断コンテキストでは `instanceof Object` は `false` を返す。
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: `Object` の `prototype` メソッドは任意の値で使うことができる。
      // コンパイラでは `Object` が投げられなければならないが、 ECMA の仕様によ
      // ればこの方法でもよい。
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // Firefox 3.6 では iframe の `window` オブジェクトの `length` プロパティ
      // にアクセスすると `NS_ERROR_FAILURE` というエラーが発生する。しかし、こ
      // れは特別なケースである。
      if (className == '[object Window]') {
        return 'object';
      }

      // `constructor == Array` または `instance of Array` という方法は違うフ
      // レームの配列オブジェクトに使うことができない。 IE6 では、iframe のなか
      // で配列が作られるとその配列は破壊されるうえに、`prototype` オブジェクト
      // が失われてしまう。このとき、 `val.splice` の参照が切れるので
      // `goog.isFunction` を使うとエラーが発生する。この場合、元の `typeof` 演
      // 算子を直接呼び出せば '`unknown`' が返されるために判定できる。この状況の
      // 配列は、配列みたいなオブジェクトとして振る舞うので多くの配列関数は動作
      // でき、`slice` は `false` を返す。
      // Mark Miller 氏によればこの方法は偽造不能な `Class` プロパティにアクセス
      // できる。
      //  15.2.4.2 `Object.prototype.toString ( )`
      //  `toString` メソッドが呼出されると、次のステップが取られる:
      //      1. このオブジェクトの `[[Class]]` プロパティを取得。
      //      2. 3 つの文字列 `"[object ", Result(1), "]"` を連結した文字列を算出
      //         する。
      //      3. `Result(2)` を返す。
      // この振る舞いは先の実行コンテキストによる破壊に耐えることができる。
      if ((className == '[object Array]' ||
           // IE では非値型は window をまたぐときにオブジェクトとしてラップさ
           // れる（iframe のことではない）ので、この場合はオブジェクトの検知を
           // をおこなう。
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: これでも配列の判定が失敗するときがある。
      //
      // ```
      // function ArrayImpostor() {}
      // ArrayImpostor.prototype = [];
      // var impostor = new ArrayImpostor;
      // ```
      //
      // これは `valur instanceof Array` の使用を避け、かつ
      // `value && Object.prototype.toString.vall(value) === '[object Array]'`
      // とすれば解決できるが、関数呼び出しが増えるため、Closure Libraryではこれ
      // を担保しない。

      // IEのウィンドウをまたぐ呼び出しでは関数型が正しく評価できない（オブジェ
      // クトだと判定される）ので、`typeof val == 'function'` が利用できない。
      // しかし、このオブジェクトが `call` プロパティをもつならば関数である。
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }

    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // Safari では `typeof nodeList` は `'function'` を返し、 Firefox の
    // `typeof` でも HTML（`Applet`、`Embed` 、`Object`）や `Element`、`RegExp`
    // も同様に振る舞う。ここでは、不適切な `function` オブジェクトを `call`
    // プロパティの有無で検知し、これら全てについて `object` を返すことにした。
    return 'object';
  }
  return s;
};


/**
 * 与えられた値が `undefined` でなければ `true` を返す。
 * 警告: この関数はオブジェクトのプロパティを確かめるために使ってはならない。
 * この用途では `in` 演算子をつかうべき。また、この関数はグローバルで定義された
 * `undefined` 値が書き換えられていない状況を想定している。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が定義されていれば `true` 。
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * 与えられた値が `null` であれば `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が `null` であれば `true` 。
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * 与えられた値が定義されていて、かつ `null` でないときに `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が定義されていて `null` でなければ `true` 。
 */
goog.isDefAndNotNull = function(val) {
  // undefined == null は真であることに注意
  return val != null;
};


/**
 * 与えられた値が配列であれば `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が配列であれば `true` 。
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * 与えられた値が配列のようなオブジェクトであれば `true` を返す。配列のようなオ
 * ブジェクトとは `NoodeList` や `length` プロパティが存在して、それが数値である
 * ようなオブジェクトのことである。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が配列みたいなオブジェクトであれば `true` 。
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * 'Date' のようなオブジェクトであれば 'true' を返す。`Date` みたいなオブジェク
 * トとは `getFullYear()` のようなメソッドをもつオブジェクトのことである。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が Date みたいなオブジェクトであれば `true` 。
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * 値が文字列であれば `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が文字列であれば `true` 。
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * 値が真偽値であれば `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が真偽値であれば `true` 。
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * 値が数値であれば `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が数値であれば `true` 。
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * 値が関数であれば `true` を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が関数であれば `true` 。
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * 値がオブジェクトであれば `true` を返す。この場合オブジェクトは、配列や関数を
 * 含む。
 * @param {*} val テストしたい値。
 * @return {boolean} 値がオブジェクトであれば `true` 。
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // `return Object(val) === val` でもよいが、これは値がオブジェクトでないときに
  // 遅い。
};


/**
 * 与えられたオブジェクトのユニークな値（識別子）を返す。一度 `getUid` と通した
 * オブジェクトが与えられた場合には識別子は変化しない。`getUid` を通したオブジェ
 * クトの識別子は、現在のセッションのなかで同一であることが保証される。つまり、
 * セッションをまたいだ場合には保証されない。ユニークな値が関数の `prototype` オ
 * ブジェクトに与えられた場合は動作が不安定となる。
 *
 * @param {Object} obj ユニークな値を取得したいオブジェクト。
 * @return {number} このオブジェクトのユニークな値。
 */
goog.getUid = function(obj) {
  // TODO(arv): `null` を通さないよう型を厳密にするべき。

  // Opera に `window.hasOwnProperty` は存在するが、これは常に `false` を返す
  // ため、使うことが出来ない。つまり、`BaseClass.prototype` に対してつけられた
  // 固有の識別子は `SubClass.prototype` のものと同一になってしまうことになる。
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * オブジェクトが識別子をもっているかどうかを判定する。
 *
 * このメソッドによってオブジェクトが変更されることはない。
 *
 * @param {Object} obj 判定したいオブジェクト。
 * @return {boolean} 識別子が既につけられているかどうか。
 */
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};


/**
 * オブジェクトからユニークな値を消去する。これは識別子をもつオブジェクトが変化
 * していて `goog.getUid` の値を変えたい場合に使うことができる。
 * @param {Object} obj ユニークな識別子を取り除きたいオブジェクト。
 */
goog.removeUid = function(obj) {
  // TODO(arv): `null` を通さないよう型を厳密にするべき。

  // IE では、DOM ノードは `Object` のインスタンスではないので、`delete` しよう
  // とすると例外が発生する。そこで、`removeAttribute` を使うようにしている。
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * ユニークな ID のプロパティ名。この作業によって 1 つのページで違う Closure が
 * 動作する際に衝突を回避的できる。
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' + ((Math.random() * 1e9) >>> 0);


/**
 * ユニークな ID のカウンタ。
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * ハッシュをオブジェクトに追加する。このハッシュはオブジェクト毎に固有の値で
 * ある。
 * @param {Object} obj ハッシュを作成したいオブジェクト。
 * @return {number} このオブジェクトのハッシュ値。
 * @deprecated `goog.getUid` を使うべき。
 */
goog.getHashCode = goog.getUid;


/**
 * ハッシュをオブジェクトから削除する。
 * @param {Object} obj ハッシュを取り除きたいオブジェクト。
 * @deprecated `goog.getUid` を使うべき。
 */
goog.removeHashCode = goog.removeUid;


/**
 * 与えられた値を複製する。オブジェクト・配列・基本的な型が与えられた場合には、
 * 再帰的に複製される。
 *
 * 警告：`goog.cloneObject` は循環参照を検知できない。オブジェクトが自身を参照す
 * る場合には無限に再帰処理がおこなわれてしまう。
 *
 * 警告：`goog.cloneObject` はユニークな値が複製されることを防げない。
 * `goog.getUid` によって作られたユニークな値も複製されてしまう。
 *
 * @param {*} obj 複製したいオブジェクト。
 * @return {*} 複製されたオブジェクト。
 * @deprecated `goog.cloneObject` は安全でない。`goog.object` のメソッドの方が
 *     よい。
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * ネイティブな `goog.bind` を利用する実装。
 * @param {Function} fn 部分適用したい関数。
 * @param {Object|undefined} selfObj 与えられた関数の `this` に束縛したいオブ
 *     ジェクト。
 * @param {...*} var_args 関数の部分適用で与えられる可変長引数。
 * @return {!Function} 引数の部分適用 + `this` が束縛された新しい関数。
 * @private
 * @suppress {deprecated} コンパイラは `Function.prototype.bind` を廃止すべきだ
 *     としている。これは、一部の人が純粋な JavaScript によって実装していたため
 *     である。純粋な JavaScript で実装されているのであれば、廃止すべきである。
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * ネイティブなコードを使わない、 JavaScript のみによる `goog.bind` の実装。
 * @param {Function} fn 部分適用したい関数。
 * @param {Object|undefined} selfObj 与えられた関数の `this` に束縛したいオブ
 *     ジェクト。
 * @param {...*} var_args 関数の部分適用で与えられる可変長引数。
 * @return {!Function} 引数の部分適用 + `this` が束縛された新しい関数。
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * 与えられたオブジェクトが関数の `this` オブジェクトとなるような、部分適用され
 * た新しい関数を返す。引数が指定された場合は、新しい関数の引数の前に与えられ
 * る。引数も新しい関数に与えられる（関数の部分適用 + `this` の束縛）。
 *
 * こちらも参照： `goog.partial`
 *
 * 引数の振る舞い：
 *
 * ```
 * var barMethBound = goog.bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');
 * ```
 *
 * @param {?function(this:T, ...)} fn 部分適用したい関数。
 * @param {T} selfObj 関数実行時のコンテキストとなるオブジェクト。
 * @param {...*} var_args 部分適用する際の引数。
 * @return {!Function} 関数を部分適用して実行する関数。
 * @template T
 * @suppress {deprecated} 下記参照。
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Chrome extension 環境で base.js を利用している人がい
      // て、その人は `Function.prototype.bind` に `goog.bind` を実装してしまっ
      // ている。そうすると、この関数はネイティブな `Function.prototype.bind` が
      // あると勘違いして循環参照を起こしてしまう。この場合でも巧く動くように
      // ハックしないとね。
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * `goog.bind` と似た動作をするが、関数が部分適用された関数を返す。
 *
 * 引数の振る舞い：
 *
 * ```
 * var g = goog.partial(f, arg1, arg2);
 * g(arg3, arg4);
 * ```
 *
 * @param {Function} fn 部分適用したい関数。
 * @param {...*} var_args 部分適用された関数に与えられる可変長引数。
 * @return {!Function} 引数が部分適用された新しい関数。
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // 配列を `slice()` で複製し、既存の引数にさらに引数を追加する。
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};


/**
 * 片方のオブジェクトのすべてのメンバをもう一方のオブジェクトに加える。
 * この関数は `toString` や `hasOwnProperty` のような名前のキーがある場合は動作
 * しない。この目的では `goog.object.extend` を使うべき。
 * @param {Object} target メンバが追加されるオブジェクト。
 * @param {Object} source 追加したいメンバをもつオブジェクト。
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // IE7 以前では、`for in` ループが `prototype` の列挙可能なプロパティを含ま
  // す（たとえば、`Object.prototype` の `isPrototypeOf`）、そして、文字列を拡張
  // したオブジェクトの `replace` も同様に含まれない（`Object` を継承するようで
  // あればすべて同様）。
};


/**
 * @return {number} 1970 年 1 月から今までに経過した時間をミリ秒の単位で返す。
 */
goog.now = (goog.TRUSTED_SITE && Date.now) || (function() {
  // 正の単項演算によって数値へと変換されるため、`getTime()` の実行と等価であ
  // る。
  return +new Date();
});


/**
 * グローバルスコープで JavaScript を実行する。 IE 上であれば `execScript` を使
 * い、IE 以外のブラウザでは `goog.global.eval` を使う。もし、 Safari のよ
 * うに `goog.global.eval` がグローバルスコープで実行されない場合はスクリプトタ
 * グの埋め込みよって実現する。 `execScript` か `eval` が定義されていなければ
 * エラーが発生する。
 * @param {string} script JavaScript 文字列。
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // `eval` が動作するかテストする
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // ユーザーへの注意：Safari 2で失敗するので、`t('<test>')` を
      // `.innerHTML` や `.text` で使ってはいけない。なので、テキストノードで追
      // 加している。
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * `eval` によってグローバルスコープで関すが実行できるようであれば `true` にセッ
 * トされる。値は `goog.globalEval` の初回の呼び出しのタイミングでセットされる。
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * `goog.setCssNameMapping` で設定された CSS クラス名を保存しておくためのオブ
 * ジェクト。
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * `goog.getCssName` の引数が CSS クラス名そのものなのか、 CSS クラス名の集まり
 * なのかを判断するための値。 CSS クラス名そのものであれば `'BY_WHOLE'` 、CSS
 * クラス名の断片であれば `'BY_PART'` 。 `undefined` は `'BY_PART'` だとみなされ
 * る。
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * 与えられた文字列から対応する CSS クラス名を返す。
 *
 * この関数は `goog.setCssNameMapping` と連携して動作する。
 *
 * CSS クラス名が見つからない場合は与えられた文字列がそのまま返される。
 * `opt_modifier` が指定されている場合は `-` 繋がりの文字列が返される。
 *
 * CSS クラス名マップが与えられた場合は、 `BY_PART` と`BY_WHOLE` の2つの引数の
 * 形式が利用できる。 `BY_PART` の場合、引数は `-` 繋がりの複数の文字列として扱
 * われ、ぞれぞれマップが該当する CSS クラス名に変換されて返される。`BY_WHOLE`
 * の場合は、与えられた文字列そのものに該当する CSS クラス名が返される。
 *
 * CSS クラス名マップがコンパイルされた場合、 `goog.getCssName` は以下のように書
 * き換えられる。
 * 例：
 *
 * ```
 * var x = goog.getCssName('foo');
 * var y = goog.getCssName(this.baseClass, 'active');
 * ```
 *
 * は、
 *
 * ```
 * var x= 'foo';
 * var y = this.baseClass + '-active';
 * ```
 *
 * のように書き換えられる。
 *
 * この関数は引数の数によって処理が異なる。
 * 引数が1つだけ指定された場合は、この引数が変換される。引数が2つ指定された
 * 場合は2つめの引数のみが変換される。したがって、この場合は1つめの引数をあ
 * らかじめ `goog.getCssName` によって変換しておくことが望ましい。
 *
 * @param {string} className CSS クラス名。
 * @param {string=} opt_modifier CSS クラス名に付加する CSS クラス名。
 * @return {string} 実際の CSS クラス名の文字列。
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * `goog.getCssName` で返すための CSS クラス名マップを登録する。
 *
 * ```
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // これはこのように解釈される: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * ```
 *
 * もし、文字列をキーとしてプロパティはすべての文字列であるオブジェクトリテラル
 * が与えられ、さらにコンパイラに `--closure_pass` が指定されていた場合、すべて
 * の `goog.getCssName` は文字列に置き換えられる。
 *
 * @param {!Object} mapping `goog.getCssName` の引数で指定するための文字列-文字
 *     列形式のマップ。プロパティは `goog.getCssName` で返される文字列と一
 *     致するようにする。
 * @param {string=} opt_style CSS マップの形式。 `BY_PART`、`BY_WHOLE` が指定で
 *     きる。
 * @see goog.getCssName
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * CSS クラス名変換マップを書き換えするためのグローバルオブジェクト。
 *
 * コンパイラが `goog.getCssName` と CSS クラス名の置き換えを有効にしていた場
 * 合、スクリプトのうちどれかひとつは `goog.setCssNameMapping` によって変換用
 * マップを定義していなければならない。もし、コンパイルしない状態で動作させると
 * きは、 base.js ファイルが読み込まれる前にグローバルスコープで読み込むようにし
 * ておくべきである。その場合、グローバルスコープでマップを
 * `CLOSURE_CSS_NAME_MAPPING` の名前で宣言しておくことで読み込むことができる。
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // ここでは、`goog.setCssNameMapping()` を用いない。
  // `goog.setCssNameMapping()` をオブジェクトリテラルを引数として呼び出すこと
  // が、コンパイラから要求されているからである。
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * ローカライズされたメッセージを得る `goog.getMsg` の抽象的な実装。
 *
 * この関数はコンパイラプリミティブである。コンパイラにローカライズされたメッセ
 * ージファイルと一緒に渡すと、文字列はコンパイル時に置換されたのち結合される
 * （圧縮後はただの文字列リテラルになるということ）。
 *
 * メッセージはこの形式で初期化すること：
 *
 * ```
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * ```
 *
 * @param {string} str ローカライズしたい部分を `'{$foo}'` という形式で記述した
 *     文字列。
 * @param {Object=} opt_values ローカライズ文字列のマップ。
 * @return {string} ローカライズされた文字列。
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * ローカライズされたメッセージを取得する。翻訳がなければだいたいメッセージを返
 * す。
 * この関数は、まだすべての言語で翻訳されていない新しいメッセージを追加する場合
 * に便利である。
 *
 * この関数はコンパイラプリミティブである。この形式で使用すること：
 *
 * ```
 * var x = goog.getMsgWithFallback(MSG_A, MSG_B);
 * ```
 *
 * `MSG_A` と `MSG_B` は `goog.getMsg` によって初期化される。
 *
 * @param {string} a 優先されるメッセージ。
 * @param {string} b 代替メッセージ。
 * @return {string} 翻訳されたメッセージ。なければ代替メッセージ。
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * 与えられたオブジェクトをコンパイラによるリネームから保護する。
 * ただし、オブジェクトのメンバはリネームから **保護されない** 。
 * この用途の場合は、`goog.exportProperty` を使うべきである。
 *
 * パブリックなオブジェクトを無名関数のクロージャから作成する際に役に立つ。
 *
 * 例：
 *
 * ```
 * goog.exportSymbol('public.path.Foo', Foo);
 * ```
 *
 * ```
 * goog.exportSymbol('public.path.Foo.staticFunction', Foo.staticFunction);
 * public.path.Foo.staticFunction();
 * ```
 *
 * ```
 * goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                   Foo.prototype.myMethod);
 * new public.path.Foo().myMethod();
 * ```
 *
 * @param {string} publicPath エクスポートしたいオブジェクトの名前。この名前は
 *     難読化されない。
 * @param {*} object この名前がつけられるオブジェクト。
 * @param {Object=} opt_objectToExportTo このオブジェクトの追加先となるオブジェ
 *     クト（初期値は `goog.global`）。
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * 与えられたオブジェクトのメンバをコンパイラによるリネームから保護する。
 *
 * 例：
 *
 * ```
 * goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ```
 *
 * ```
 * goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * ```
 * @param {Object} object エクスポートしたいプロパティをもつオブジェクト。この
 *     オブジェクトのプロパティ名は難読化されない。
 * @param {string} publicName エクスポートしたいプロパティの名前。
 * @param {*} symbol この名前がつけられるプロパティ。
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
/**
 * 与えられたコンストラクタの `prototype` のメソッドを別のコンストラクタに継承
 * する。
 *
 * 使い方：
 *
 * ```
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * ```
 *
 * サブクラスからスーパークラスにアクセスしたい場合は以下のようにやる。
 *
 * ```
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * ```
 *
 * @param {Function} childCtor 子クラス.
 * @param {Function} parentCtor 親クラス.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


/**
 * スーパークラスを呼び出す。
 *
 * サブクラスのコンストラクタで呼び出した場合は、 1 つ以上の引数付きで親クラ
 * スのコンストラクタを実行する。
 *
 * `prototype` のメソッドから呼び出した場合は、 2 つめの引数でこのメソッドの名前
 * を指定する必要がある。名前を指定しなかった場合はランタイムエラーが投げられ
 * る。このメソッドは 2 つ以上の引数でスーパークラスのメソッドを実行する。
 *
 * この関数は `goog.inherits` がなされたクラス上でのみ動作できる。
 *
 * この関数はコンパイラプリミティブである。コンパイルの際にはマクロ展開が行わ
 * れ、このコードによるオーバーヘッドが取り除かれる。この関数を使うときにはいく
 * つかの取り決めに従う必要がある。その取り決めに違反があればコンパイラがエラー
 * を投げる。
 *
 * @param {!Object} me たいていは `this` 。
 * @param {*=} opt_methodName スーパークラスのメソッドを呼び出すときにはそのメ
 *     ソッド名。
 * @param {...*} var_args スーパークラスの関数に与えられる可変長引数。
 * @return {*} スーパークラスのメソッドによる戻り値。
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;

  if (goog.DEBUG) {
    if (!caller) {
      throw Error('arguments.caller not defined.  goog.base() expects not ' +
                  'to be running in strict mode. See ' +
                  'http://www.ecma-international.org/ecma-262/5.1/#sec-C');
    }
  }

  if (caller.superClass_) {
    // これはコンストラクタなのでスーパークラスのコンストラクタを呼び出す。
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // もし呼び出し先がプロトタイプチェーンのなかから見つからなければ次のうちどち
  // らかの場合である。
  // 1) 呼び出し先はインスタンスメソッドである場合
  // 2) 正しい呼び出し先でなかった場合
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * スコープ関数の中でエイリアス（別名）を使えるようにする。この関数はコンパイラ
 * によってインラインに書き換えられる。コンパイルされていない場合はそのまま実行
 * される。
 * @param {function()} fn エイリアスが適用される。この関数は名前空間のエイリアス
 *     を含むことができる。（例：`var dom = goog.dom`）または（例：
 *     `var Timer = goog.Timer`）。
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


