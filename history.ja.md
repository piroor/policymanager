# 更新履歴

 - master/HEAD
   * jarファイルを含めない形のパッケージングに変更
   * 細かい修正色々（詳しくは[コミットログ](https://github.com/piroor/policymanager/commits/master)を参照）
 - 2.2.2009110501
   * Minefield, Firefox 3.6対応
   * DOMストレージAPI、Geolocation APIのアクセス許可も制御できるようにした
 - 2.1.2008042101
   * ローカルファイルへのアクセス、スクリプトからのクリップボードへのアクセスの許可を設定できるようにした
   * サイトのfaviconを表示するようにした
   * Firefox 3 Beta5での動作を確認
 - 2.0.2005110601
   * ポリシー設定でJavaScriptの有効無効を切り替えてもGUIでは常に有効として表示されていたのを修正
 - 2.0.20051011
   * JavaScriptをグローバル設定で無効にしながら個別のポリシー設定で有効にできるようにした（※各ポリシーの再設定が必要）
 - 2.0.20050918
   * インターフェースを刷新し、Firefoxで正常に機能するようにした
 - 1.3.20040818
   * FirefoxでToolsメニューにポリシーマネージャの項目を表示するようにした
 - 1.3.20040523
   *  `window.top`  が変数になっている時にエラーが起こる可能性があったのを修正
 - 1.3.20040204
   * チェックボックスの処理を修正
 - 1.3.20030601
   * 日本語パックのボタン名がおかしくなっていたのを修正
   * NS7や古いMozillaではポップアップ禁止のチェックボックスを無効にするようにした
 - 1.3.20030413
   * プロファイルディレクトリのoverlays.rdfにゴミを残さないようにした（ユーザー別にインストールした後でアンインストールし管理者権限で再インストールした場合に動作しない問題の対処）
 - 1.3.20030405
   * アンインストーラのミスを修正
 - 1.3.20030317
   * コンテキストメニューの初期化でエラーを起こすことがあったのを修正
   * ポップアップの制御も一応行えるようにした（通常でポップアップを拒否するモードのみ）
 - 1.2.20021004
   * Phoenixへの対応をぼつぼつ開始
 - 1.2.20020929
   * javascript.enabledが無効な時、JavaScriptの設定用のチェックボックスを全て無効にするようにした
   *  `***.javascript.enabled` の設定を間違えていたのを修正
   * チェックボックスが機能しない問題を修正
 - 1.1.20020928
   * Arrayの `concat` でノードリストを扱わないようにした
 - 1.1.20020925
   * 自己アンインストール機能が働かない問題を修正
 - 1.1.20020918
   * 自己アンインストール機能がMozilla1.2a以降で働かない問題を修正
   * 1.1.20020830
   * 自己アンインストール機能を追加
   * 1.1.20020809
   * nsISupports(W)String関係の仕様の変更に対応
 - 1.1.20020709
   * 英語のメニュー表記をいくつか修正
   * ポリシーを「追加」「削除」から、ポリシーを「新規」「削除」に表現を改めた
 - 1.1.20020628
   * Mozilla 1.0 以降では"@mozilla.org/rdf/datasource;1?name=window-mediator"の代わりに"@mozilla.org/appshell/window-mediator;1"を使うようにした
 - 1.1.20020518
   * JavaScript の有効無効を一括して設定できるようにした
   * JavaScript のプロパティのセキュリティレベルを、 allAccess にするか sameOrigin にするか選択できるようにした
 - 1.0.20020517
   * 初期化に失敗していたのを修正
 - 1.0.20020514
   * 定義ファイルの記述ミスを修正
 - 1.0.20020511
   * JavaScript によるイベントの捕捉を制限できるようにした
 - 1.0.20020425
   * 少し修正
   * 「マネージャー」という表記を「マネージャ」に変更
   * setInterval, setTimeout をコントロールできるようにした
 - 1.0.20020424
   * 公開
