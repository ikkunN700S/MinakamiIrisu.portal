// ==========================================
// 設定：APIキーと各種URL
// ==========================================
const CONFIG = {
    // 1. 取得したYouTube Data APIキーをここに入力
    youtubeApiKey: "AIzaSyAn6dhEzUFUJfh3D6d3N-61cG2njf2z2ak",
    
    // 水上イリスさんのチャンネルID
    youtubeChannelId: "UCgo7fyKuK0BAW7K8U0JOs0A",
    
    // ブログのRSS
    blogRss: "https://minakamiirisu.wixsite.com/minakamiirisu/blog-feed.xml"
};

// RSS2JSONのAPI URL (ブログ用)
const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

document.addEventListener('DOMContentLoaded', () => {
    fetchYouTubeWithAPI();
    fetchBlogFeed();
});

// --------------------------------------------------
// YouTubeの取得 (YouTube Data API v3 を使用)
// --------------------------------------------------
async function fetchYouTubeWithAPI() {
    const container = document.getElementById('youtube-feed');

    if (CONFIG.youtubeApiKey.includes("ここに")) {
        container.innerHTML = '<p style="color: #ffaa00; padding: 1rem;">YouTube APIキーが設定されていません。</p>';
        return;
    }

    // YouTube APIのURL (最新の動画を5件取得する設定)
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtubeApiKey}&channelId=${CONFIG.youtubeChannelId}&part=snippet,id&order=date&maxResults=5`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // エラーチェック（APIキー間違いや制限オーバーなど）
        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.items || data.items.length === 0) {
            container.innerHTML = '<p class="loading">動画が見つかりませんでした。</p>';
            return;
        }

        container.innerHTML = ''; // ローディング消去

        data.items.forEach(item => {
            // チャンネルや再生リストではなく「動画」だけをフィルタリング
            if (item.id.kind !== "youtube#video") return;

            const videoId = item.id.videoId;
            const title = item.snippet.title;
            const link = `https://www.youtube.com/watch?v=${videoId}`;
            
            // 日付のフォーマット
            const dateObj = new Date(item.snippet.publishedAt);
            const dateString = dateObj.toLocaleDateString("ja-JP");

            // サムネイル (mediumサイズを指定)
            const thumbnailUrl = item.snippet.thumbnails.medium.url;

            // HTML生成
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

    } catch (error) {
        console.error("YouTube API取得エラー:", error);
        container.innerHTML = '<p class="loading">YouTubeの取得に失敗しました。</p>';
    }
}

// --------------------------------------------------
// ブログの取得 (rss2jsonを使用)
// --------------------------------------------------
async function fetchBlogFeed() {
    const container = document.getElementById('blog-feed');

    if (CONFIG.blogRss.includes("ここに")) return;

    try {
        const response = await fetch(RSS2JSON_URL + encodeURIComponent(CONFIG.blogRss));
        const data = await response.json();

        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            container.innerHTML = '<p class="loading">ブログ記事が見つかりませんでした。</p>';
            return;
        }

        container.innerHTML = ''; 

        data.items.forEach(item => {
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

    } catch (error) {
        console.error("ブログ取得エラー:", error);
        container.innerHTML = '<p class="loading">ブログの取得に失敗しました。</p>';
    }
}