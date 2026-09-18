const fs = require('fs');

// 検索したい完全一致のタグ名を指定します
const TARGET_TAG = "水上イリス"; 

// URLSearchParamsを使って安全にURLを構築
const params = new URLSearchParams({
    q: TARGET_TAG,                  // 検索キーワード
    targets: "tagsExact",           // タグの完全一致で検索
    fields: "contentId,title,startTime,thumbnailUrl", // 欲しい情報
    _sort: "-startTime",            // 投稿日時の新しい順
    _limit: 10                      // 10件取得
});

// ニコニコ公式 スナップショット検索API v2
const API_URL = `https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search?${params.toString()}`;

async function fetchNico() {
    try {
        console.log(`Fetching Niconico data for tag: ${TARGET_TAG}...`);
        
        const response = await fetch(API_URL, {
            headers: {
                // 公式APIを利用するため、Bot名や連絡先をUser-Agentに入れるのがマナー
                'User-Agent': 'Niconico-Portal-Bot/1.0 (https://github.com/ikkunN700S/MinakamiIrisu.portal)' 
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data && data.data) {
            // フロントエンドの niconico.js が読み込みやすい形（配列）をそのまま保存
            fs.writeFileSync('niconico.json', JSON.stringify(data.data, null, 2));
            console.log('✅ niconico.json generated successfully using Official API.');
        } else {
            console.error('データが正しく取得できませんでした:', data);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ 取得エラー:', error.message);
        process.exit(1);
    }
}

fetchNico();