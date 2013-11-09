翻訳にあたってのルール
======================

1. HTML+JsDoc によるマークアップを [Markdown](http://blog.2310.net/archives/6#code_blocks) 記法に修正
2. 内容を削らない+付け足さない
3. 英語と日本語の間にはスペースを挟む
4. 80文字で折り返し

HTML+JsDoc によるマークアップはMarkdownに
----------------------------------
従来のマークアップはソースコードの状態では読みづらいため、ソースコードでも読みやすい Markdown 記法を採用しています。
`@code`、`@link`、`<pre>`、`<code>`、`<a>` のかわりにバッククォート（```）で囲んでください。
また、マークアップされていないコード・式・値・リンクを示す場合にも、適宜 Markdown 記法に変換してください。

例1：JsDoc マークアップ

    Lorem {@code Ipsum}.

    Lorem `Ipsum` 。

例2：マークアップされていない値

    Lorem Ipsum returns true.

    Lorem Ipsum は `true` を返す。

例3：HTML マークアップ

    <pre>
    foo.bar();
    </pre>


    ```
    foo.bar()
    ```

例4：リンク

    See {@link http://example.com}.

    `http://example.com` を見てください。
