const fs = require('fs');

const USER_ID = "134003161";
// ユーザーIDで絞り込み、投稿日時順に10件取得
const API_URL = `https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search?q=&targets=title&fields=contentId,title,startTime,thumbnailUrl&filters[userId][0]=${USER_ID}&_sort=-startTime&_limit=10`;

async function fetchNico() {
    try {
        console.log('Fetching Niconico data...');
        const response = await fetch(API_URL, {
            headers: { 'User-Agent': 'Niconico-Portal-Bot/1.0' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.data) {
            // niconico.json というファイルに保存
            fs.writeFileSync('niconico.json', JSON.stringify(data.data, null, 2));
            console.log('niconico.json generated successfully.');
        } else {
            console.error('データが正しく取得できませんでした:', data);
            process.exit(1);
        }
    } catch (error) {
        console.error('取得エラー:', error);
        process.exit(1);
    }
}

fetchNico();