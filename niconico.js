// ==========================================
// ニコニコ動画専用の設定
// ==========================================
const NICO_CONFIG = {
    // 取得したいニコニコ動画のRSS URL（末尾の ?rss=2.0 が重要です）
    rssUrl: "https://www.nicovideo.jp/user/134003161/video?rss=2.0",
    
    // キャッシュの有効期限（1時間）
    cacheDuration: 60 * 60 * 1000 
};

// RSS2JSON API (ニコニコ動画もこれでCORS回避＆JSON化します)
const NICO_RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

// HTMLの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', () => {
    fetchNiconicoFeed();
});

// --------------------------------------------------
// ニコニコ動画RSSの取得処理
// --------------------------------------------------
async function fetchNiconicoFeed() {
    const container = document.getElementById('niconico-feed');

    if (NICO_CONFIG.rssUrl.includes("ここに")) {
        container.innerHTML = '<p style="color: #ffaa00; padding: 1rem;">niconico.js でRSSのURLを設定してください。</p>';
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
        // APIを叩いてニコニコのRSSをJSONで受け取る
        const response = await fetch(NICO_RSS2JSON_URL + encodeURIComponent(NICO_CONFIG.rssUrl));
        const data = await response.json();

        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            container.innerHTML = '<p class="loading">ニコニコ動画の投稿が見つかりませんでした。</p>';
            return;
        }

        // データの保存
        localStorage.setItem(cacheKey, JSON.stringify(data.items));
        localStorage.setItem(cacheTimeKey, now.toString());

        // 描画
        renderNiconicoCards(data.items, container);

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
        const link = item.link;
        
        const dateObj = new Date(item.pubDate.replace(/ /g, 'T'));
        const dateString = dateObj.toLocaleDateString("ja-JP");

        // 元の低画質なサムネイルURL
        const originalThumbnailUrl = item.thumbnail || "";
        
        // ★ 高画質版のURLを作成（末尾に .L を付け足す）
        const highResThumbnailUrl = originalThumbnailUrl ? originalThumbnailUrl + ".L" : "";

        const card = document.createElement("div");
        card.className = "card";
        
        let htmlContent = "";
        
        if (highResThumbnailUrl) {
            // ★ onerror属性を追加：高画質版(.L)の読み込みに失敗したら、自動的に元のURL(originalThumbnailUrl)を読み直す
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
                <div class="card-title"><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></div>
                <div class="card-date">${dateString}</div>
            </div>
        `;

        card.innerHTML = htmlContent;
        container.appendChild(card);
    });
}