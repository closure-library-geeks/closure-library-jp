翻訳にあたってのルール
======================

 * `@code`、`@link`、`<pre>`、`<code>` のかわりバッククォート（[Markdown記法](http://blog.2310.net/archives/6#code_blocks)）を使う

    従来のマークアップは非常に読みづらいため、リンク/コードのどちらも **Markdown記法にのっとった記法に統一してください**。
    また、元コードではリンクやコードをマークアップするための記法が統一されていません。
    コード・式・値を示す場合には、適宜 Markdown 記法に変換してください。

    例1：

        Lorem {@code Ipsum}.

        Lorem `Ipsum` 。

    例2：

        Lorem Ipsum returns true.

        Lorem Ipsum は `true` を返す。


    例3：

        <pre>
        foo.bar();
        </pre>


        ```
        foo.bar()
        ```
