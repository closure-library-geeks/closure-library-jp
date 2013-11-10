// Copyright 2007 The Closure Library Authors. All Rights Reserved.
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
 * @fileoverview Defines a 2-element vector class that can be used for
 * coordinate math, useful for animation systems and point manipulation.
 *
 * `Vec2` オブジェクトは `goog.math.Coordinate` を継承していて、`Coordinate` が
 * 求められる場面で使われる。 `Vec2` の関数は、必要に応じて `Vec2` 、
 * `Coordinate` オブジェクトのいずれも入力として受け入れる。
 *
 * @author brenneman@google.com (Shawn Brenneman)
 */

goog.provide('goog.math.Vec2');

goog.require('goog.math');
goog.require('goog.math.Coordinate');



/**
 * 点を操作するのに便利な関数を揃えた、2次元ベクトルのためのクラス。
 *
 * @param {number} x このベクトルのX座標。
 * @param {number} y このベクトルのY座標。
 * @constructor
 * @extends {goog.math.Coordinate}
 */
goog.math.Vec2 = function(x, y) {
  /**
   * Xの値
   * @type {number}
   */
  this.x = x;

  /**
   * Yの値
   * @type {number}
   */
  this.y = y;
};
goog.inherits(goog.math.Vec2, goog.math.Coordinate);


/**
 * @return {!goog.math.Vec2} ランダムな単位長ベクトル。
 */
goog.math.Vec2.randomUnit = function() {
  var angle = Math.random() * Math.PI * 2;
  return new goog.math.Vec2(Math.cos(angle), Math.sin(angle));
};


/**
 * @return {!goog.math.Vec2} 単位円内のランダムなベクトル。
 */
goog.math.Vec2.random = function() {
  var mag = Math.sqrt(Math.random());
  var angle = Math.random() * Math.PI * 2;

  return new goog.math.Vec2(Math.cos(angle) * mag, Math.sin(angle) * mag);
};


/**
 * 指定された座標から新しい `Vec2` オブジェクトを返す。
 * @param {!goog.math.Coordinate} 座標。
 * @return {!goog.math.Vec2} 新しいベクトルオブジェクト。
 */
goog.math.Vec2.fromCoordinate = function(a) {
  return new goog.math.Vec2(a.x, a.y);
};


/**
 * @return {!goog.math.Vec2} このベクトルと同じ座標を持つ新しいベクトル。
 * @override
 */
goog.math.Vec2.prototype.clone = function() {
  return new goog.math.Vec2(this.x, this.y);
};


/**
 * このベクトルの原点からの距離を返す。
 * @return {number} ベクトルの長さ。
 */
goog.math.Vec2.prototype.magnitude = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};


/**
 * このベクトルの、原点からの距離の2乗を返す。
 * NOTE(brenneman): 平方根を避けることは、JavaScriptにおいては大きな最適化には
 * ならない。
 * @return {number} このベクトルの長さの2乗。
 */
goog.math.Vec2.prototype.squaredMagnitude = function() {
  return this.x * this.x + this.y * this.y;
};


/**
 * @return {!goog.math.Vec2} スケール後の座標。
 * @override
 */
goog.math.Vec2.prototype.scale =
    /** @type {function(number, number=):!goog.math.Vec2} */
    (goog.math.Coordinate.prototype.scale);


/**
 * ベクトルの符号を反転する。ベクトルを-1でスケールするのと等価である。
 * @return {!goog.math.Vec2} 反転されたベクトル。
 */
goog.math.Vec2.prototype.invert = function() {
  this.x = -this.x;
  this.y = -this.y;
  return this;
};


/**
 * 現在のベクトルを、大きさが1になるように正規化する。
 * @return {!goog.math.Vec2} 正規化されたベクトル。
 */
goog.math.Vec2.prototype.normalize = function() {
  return this.scale(1 / this.magnitude());
};


/**
 * 他のベクトルを、このベクトルに直接加算する。
 * @param {!goog.math.Coordinate} b 加算するベクトル。
 * @return {!goog.math.Vec2} `b` が加算されたあとの、このベクトル。
 */
goog.math.Vec2.prototype.add = function(b) {
  this.x += b.x;
  this.y += b.y;
  return this;
};


/**
 * 他のベクトルを、このベクトルから直接減算する。
 * @param {!goog.math.Coordinate} b 減算するベクトル。
 * @return {!goog.math.Vec2} `b` で減算されたあとの、このベクトル。
 */
goog.math.Vec2.prototype.subtract = function(b) {
  this.x -= b.x;
  this.y -= b.y;
  return this;
};


/**
 * このベクトルを、ラジアンで指定された角度回転する。
 * @param {number} angle 角度、単位はラジアン。
 * @return {!goog.math.Vec2} `angle` ラジアン回転されたあとの、このベクトル。
 */
goog.math.Vec2.prototype.rotate = function(angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var newX = this.x * cos - this.y * sin;
  var newY = this.y * cos + this.x * sin;
  this.x = newX;
  this.y = newY;
  return this;
};


/**
 * このベクトルを、指定された回転の基準点に対して、ラジアンで指定された角度回転
 * する。戻り値のベクトルは新しいインスタンスとして作成され、直接変更は加えられ
 * ない。
 * @param {!goog.math.Vec2} v ベクトル。
 * @param {!goog.math.Vec2} axisPoint 回転の基準点。
 * @param {number} angle 角度、単位はラジアン。
 * @return {!goog.math.Vec2} 新たなインスタンスとして作成された、回転された
 *     ベクトル。
 */
goog.math.Vec2.rotateAroundPoint = function(v, axisPoint, angle) {
  var res = v.clone();
  return res.subtract(axisPoint).rotate(angle).add(axisPoint);
};


/**
 * このベクトルと他のベクトルの等価性を比較する。
 * @param {!goog.math.Vec2} b 他のベクトル。
 * @return {boolean} このベクトルが、指定されたベクトルと同じXとYを持つか
 *     どうか。
 */
goog.math.Vec2.prototype.equals = function(b) {
  return this == b || !!b && this.x == b.x && this.y == b.y;
};


/**
 * 2つのベクトル間の距離を返す。
 * @param {!goog.math.Coordinate} a 1つ目のベクトル。
 * @param {!goog.math.Coordinate} b 2つ目のベクトル。
 * @return {number} 距離。
 */
goog.math.Vec2.distance = goog.math.Coordinate.distance;


/**
 * 2つのベクトル間の距離の2乗を返す。
 * @param {!goog.math.Coordinate} a 1つ目のベクトル。
 * @param {!goog.math.Coordinate} b 2つ目のベクトル。
 * @return {number} 距離の2乗。
 */
goog.math.Vec2.squaredDistance = goog.math.Coordinate.squaredDistance;


/**
 * ベクトルの等価性を比較する。
 * @param {!goog.math.Coordinate} a 1つ目のベクトル。
 * @param {!goog.math.Coordinate} b 2つ目のベクトル。
 * @return {boolean} 指定したベクトルが、同じXとY座標を持つかどうか。
 */
goog.math.Vec2.equals = goog.math.Coordinate.equals;


/**
 * 2つのベクトルの和を新しい `Vec2` として返す。
 * @param {!goog.math.Coordinate} a 1つ目のベクトル。The first vector.
 * @param {!goog.math.Coordinate} b 2つ目のベクトル。The second vector.
 * @return {!goog.math.Vec2} 和のベクトル。The sum vector.
 */
goog.math.Vec2.sum = function(a, b) {
  return new goog.math.Vec2(a.x + b.x, a.y + b.y);
};


/**
 * 2つのベクトルの差を新しい `Vec2` として返す。
 * @param {!goog.math.Coordinate} a 1つ目のベクトル。
 * @param {!goog.math.Coordinate} b 2つ目のベクトル。
 * @return {!goog.math.Vec2} 差のベクトル。
 */
goog.math.Vec2.difference = function(a, b) {
  return new goog.math.Vec2(a.x - b.x, a.y - b.y);
};


/**
 * 2つのベクトルの内積を返す。
 * @param {!goog.math.Coordinate} a 1つ目のベクトル。
 * @param {!goog.math.Coordinate} b 2つ目のベクトル。
 * @return {number} 2つのベクトルの内積。
 */
goog.math.Vec2.dot = function(a, b) {
  return a.x * b.x + a.y * b.y;
};


/**
 * 2つのベクトル `a` `b` 間を、スケール値 `x` で線形補間した新しい `Vec2` を
 * 返す。
 * @param {!goog.math.Coordinate} a ベクトル `a`
 * @param {!goog.math.Coordinate} b ベクトル `b`
 * @param {number} x `a` `b` 間の割合。
 * @return {!goog.math.Vec2} 補間されたベクトル。
 */
goog.math.Vec2.lerp = function(a, b, x) {
  return new goog.math.Vec2(goog.math.lerp(a.x, b.x, x),
                            goog.math.lerp(a.y, b.y, x));
};
