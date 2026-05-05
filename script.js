// ==========================================
// 設定：APIキーと各種URL、キャッシュ時間
// ==========================================
const CONFIG = {
    // YouTube Data APIキー
    youtubeApiKey: "AIzaSyAn6dhEzUFUJfh3D6d3N-61cG2njf2z2ak",
    
    youtubeChannelId: "UCgo7fyKuK0BAW7K8U0JOs0A",

    targetPlaylistId: "PLA_WYr2yKMahzDw7253eRa4HxqFdJKfIw",
    
    blogRss: "https://minakamiirisu.wixsite.com/minakamiirisu/blog-feed.xml",

    // キャッシュの有効期限（ミリ秒）: 現在は1時間（60分 × 60秒 × 1000）
    cacheDuration: 60 * 60 * 1000 
};

const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

document.addEventListener('DOMContentLoaded', () => {
    fetchYouTubeWithAPI();
    fetchSpecificPlaylist();
    fetchBlogFeed();
});

// --------------------------------------------------
// YouTubeの取得 (プレイリスト取得 ＆ キャッシュ機能)
// --------------------------------------------------
async function fetchYouTubeWithAPI() {
    const container = document.getElementById('youtube-feed');

    if (CONFIG.youtubeApiKey.includes("ここに")) {
        container.innerHTML = '<p style="color: #ffaa00; padding: 1rem;">YouTube APIキーが設定されていません。</p>';
        return;
    }

    // キャッシュの確認
    const cacheKey = 'youtube_data_cache';
    const cacheTimeKey = 'youtube_data_time';
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = new Date().getTime();

    // キャッシュが存在し、かつ有効期限内であればキャッシュを利用
    if (cachedData && cachedTime && (now - parseInt(cachedTime)) < CONFIG.cacheDuration) {
        console.log("YouTube: キャッシュからデータを読み込みました");
        renderYouTubeCards(JSON.parse(cachedData), container);
        return;
    }

    // チャンネルIDの 'UC' を 'UU' に置換して「アップロード済み動画リスト」のIDを生成
    const uploadPlaylistId = CONFIG.youtubeChannelId.replace(/^UC/, 'UU');
    
    // playlistItems エンドポイントを使用 (1回1ポイント消費)
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${CONFIG.youtubeApiKey}&playlistId=${uploadPlaylistId}&part=snippet&maxResults=5`;

    try {
        console.log("YouTube: 新しいデータをAPIから取得しています...");
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        if (!data.items || data.items.length === 0) {
            container.innerHTML = '<p class="loading">動画が見つかりませんでした。</p>';
            return;
        }

        // データの保存（次回以降の読み込みを高速化）
        localStorage.setItem(cacheKey, JSON.stringify(data.items));
        localStorage.setItem(cacheTimeKey, now.toString());

        // 描画
        renderYouTubeCards(data.items, container);

    } catch (error) {
        console.error("YouTube API取得エラー:", error);
        // エラー時でも、もし古いキャッシュが残っていればそれを表示するフォールバック
        if (cachedData) {
            console.log("YouTube: エラーが発生したため、古いキャッシュを表示します");
            renderYouTubeCards(JSON.parse(cachedData), container);
        } else {
            container.innerHTML = '<p class="loading">YouTubeの取得に失敗しました。</p>';
        }
    }
}

// --------------------------------------------------
// 指定プレイリストの取得 ＆ キャッシュ機能
// --------------------------------------------------
async function fetchSpecificPlaylist() {
    const container = document.getElementById('playlist-feed');

    if (CONFIG.targetPlaylistId.includes("ここに")) return; // 設定されていない場合は何もしない

    // キャッシュの確認（最新動画とは別の名前で保存します）
    const cacheKey = 'specific_playlist_cache';
    const cacheTimeKey = 'specific_playlist_time';
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = new Date().getTime();

    if (cachedData && cachedTime && (now - parseInt(cachedTime)) < CONFIG.cacheDuration) {
        console.log("Playlist: キャッシュからデータを読み込みました");
        renderYouTubeCards(JSON.parse(cachedData), container);
        return;
    }

    // プレイリストIDをそのまま使用 (1回1ポイント消費)
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${CONFIG.youtubeApiKey}&playlistId=${CONFIG.targetPlaylistId}&part=snippet&maxResults=5`;

    try {
        console.log("Playlist: 新しいデータをAPIから取得しています...");
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        if (!data.items || data.items.length === 0) {
            container.innerHTML = '<p class="loading">プレイリストの動画が見つかりませんでした。</p>';
            return;
        }

        // データの保存
        localStorage.setItem(cacheKey, JSON.stringify(data.items));
        localStorage.setItem(cacheTimeKey, now.toString());

        // 描画 (既存のYouTubeカード生成関数をそのまま使い回します！)
        renderYouTubeCards(data.items, container);

    } catch (error) {
        console.error("プレイリスト取得エラー:", error);
        if (cachedData) {
            renderYouTubeCards(JSON.parse(cachedData), container);
        } else {
            container.innerHTML = '<p class="loading">プレイリストの取得に失敗しました。</p>';
        }
    }
}

// YouTubeカードのHTML生成関数
function renderYouTubeCards(items, container) {
    container.innerHTML = ''; // ローディング消去

    items.forEach(item => {
        // playlistItems の場合、動画IDの場所が少し変わります
        const videoId = item.snippet.resourceId.videoId;
        const title = item.snippet.title;
        const link = `https://www.youtube.com/watch?v=${videoId}`;
        
        const dateObj = new Date(item.snippet.publishedAt);
        const dateString = dateObj.toLocaleDateString("ja-JP");

        // サムネイル (解像度が用意されていない場合のエラーを防ぐため medium が無ければ default を使用)
        const thumbnails = item.snippet.thumbnails;
        const thumbnailUrl = thumbnails.medium ? thumbnails.medium.url : thumbnails.default.url;

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="thumbnail-wrapper">
                <img src="${thumbnailUrl}" alt="${title}" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-title"><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></div>
                <div class="card-date">${dateString}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --------------------------------------------------
// ブログの取得 (rss2json ＆ キャッシュ機能)
// --------------------------------------------------
async function fetchBlogFeed() {
    const container = document.getElementById('blog-feed');

    if (CONFIG.blogRss.includes("ここに")) return;

    // キャッシュの確認
    const cacheKey = 'blog_data_cache';
    const cacheTimeKey = 'blog_data_time';
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = new Date().getTime();

    if (cachedData && cachedTime && (now - parseInt(cachedTime)) < CONFIG.cacheDuration) {
        console.log("Blog: キャッシュからデータを読み込みました");
        renderBlogCards(JSON.parse(cachedData), container);
        return;
    }

    try {
        console.log("Blog: 新しいデータを取得しています...");
        const response = await fetch(RSS2JSON_URL + encodeURIComponent(CONFIG.blogRss));
        const data = await response.json();

        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            container.innerHTML = '<p class="loading">ブログ記事が見つかりませんでした。</p>';
            return;
        }

        // データの保存
        localStorage.setItem(cacheKey, JSON.stringify(data.items));
        localStorage.setItem(cacheTimeKey, now.toString());

        // 描画
        renderBlogCards(data.items, container);

    } catch (error) {
        console.error("ブログ取得エラー:", error);
        if (cachedData) {
            renderBlogCards(JSON.parse(cachedData), container);
        } else {
            container.innerHTML = '<p class="loading">ブログの取得に失敗しました。</p>';
        }
    }
}

// ブログカードのHTML生成関数
function renderBlogCards(items, container) {
    container.innerHTML = ''; 

    items.forEach(item => {
        const title = item.title;
        const link = item.link;
        const dateObj = new Date(item.pubDate.replace(/ /g, 'T'));
        const dateString = dateObj.toLocaleDateString("ja-JP");
        const thumbnailUrl = item.thumbnail || "";

        const card = document.createElement("div");
        card.className = "card";
        let htmlContent = "";
        
        if (thumbnailUrl) {
            htmlContent += `
                <div class="thumbnail-wrapper">
                    <img src="${thumbnailUrl}" alt="${title}" loading="lazy">
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