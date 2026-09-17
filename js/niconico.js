// ==========================================
// ニコニコ動画専用の設定
// ==========================================
const NICO_CONFIG = {
    // ユーザーIDを指定
    userId: "134003161",
    
    // キャッシュの有効期限（1時間）
    cacheDuration: 60 * 60 * 1000 
};

// CORS回避のためのプロキシURL（API v2へのリクエスト用）
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

// HTMLの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', () => {
    fetchNiconicoFeed();
});

// --------------------------------------------------
// ニコニコ動画の取得処理 (スナップショット検索API v2)
// --------------------------------------------------
async function fetchNiconicoFeed() {
    const container = document.getElementById('niconico-feed');

    if (!NICO_CONFIG.userId || NICO_CONFIG.userId.includes("ここに")) {
        container.innerHTML = '<p style="color: #ffaa00; padding: 1rem;">niconico.js でユーザーIDを設定してください。</p>';
        return;
    }

    // キャッシュの確認
    const cacheKey = 'niconico_data_cache';
    const cacheTimeKey = 'niconico_data_time';
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = new Date().getTime();

    if (cachedData && cachedTime && (now - parseInt(cachedTime)) < NICO_CONFIG.cacheDuration) {
        console.log("Niconico: キャッシュからデータを読み込みました");
        renderNiconicoCards(JSON.parse(cachedData), container);
        return;
    }

    try {
        console.log("Niconico: 新しいデータを取得しています...");
        
        // API v2のURLを構築（ユーザーIDで絞り込み、投稿日時順に10件取得）
        const apiUrl = `https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search?q=&targets=title&fields=contentId,title,startTime,thumbnailUrl&filters[userId][0]=${NICO_CONFIG.userId}&_sort=-startTime&_limit=10`;

        const PROXY_URL = 'https://corsproxy.io/?';
        
        // プロキシ経由で取得（URLをエンコードして繋げる）
        const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl));
        const data = await response.json();

        // APIレスポンスの形式に合わせたチェック（API v2は data.data の中に配列が入る）
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = '<p class="loading">ニコニコ動画の投稿が見つかりませんでした。</p>';
            return;
        }

        // データの保存
        localStorage.setItem(cacheKey, JSON.stringify(data.data));
        localStorage.setItem(cacheTimeKey, now.toString());

        // 描画
        renderNiconicoCards(data.data, container);

    } catch (error) {
        console.error("ニコニコ動画取得エラー:", error);
        if (cachedData) {
            renderNiconicoCards(JSON.parse(cachedData), container);
        } else {
            container.innerHTML = '<p class="loading">ニコニコ動画の取得に失敗しました。</p>';
        }
    }
}

// --------------------------------------------------
// HTML（カード）の生成処理
// --------------------------------------------------
function renderNiconicoCards(items, container) {
    container.innerHTML = ''; 

    items.forEach(item => {
        const title = item.title;
        
        // API v2の contentIdを使って動画リンクを生成
        const link = `https://www.nicovideo.jp/watch/${item.contentId}`;
        
        // API v2の startTime (ISO 8601形式) をDateオブジェクトに変換
        const dateObj = new Date(item.startTime);
        const dateString = dateObj.toLocaleDateString("ja-JP");

        // API v2の thumbnailUrl を使用
        const originalThumbnailUrl = item.thumbnailUrl || "";
        
        // 高画質版のURLを作成（末尾に .L を付け足す）
        const highResThumbnailUrl = originalThumbnailUrl ? originalThumbnailUrl + ".L" : "";

        const card = document.createElement("a");
        card.className = "card";
        card.href = link;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        
        let htmlContent = "";
        
        if (highResThumbnailUrl) {
            // onerror属性によるフォールバック
            htmlContent += `
                <div class="thumbnail-wrapper">
                    <img src="${highResThumbnailUrl}" 
                         alt="${title}" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${originalThumbnailUrl}';">
                </div>
            `;
        }

        htmlContent += `
            <div class="card-content">
                <div class="card-title">${title}</div>
                <div class="card-date">${dateString}</div>
            </div>
        `;

        card.innerHTML = htmlContent;
        container.appendChild(card);
    });
}