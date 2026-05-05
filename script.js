// ==========================================
// 設定：RSSフィードのURL
// ==========================================
const CONFIG = {
    // YouTubeのチャンネルIDをここに入れる
    // 例: https://www.youtube.com/feeds/videos.xml?channel_id=UC...
    youtube: "https://www.youtube.com/feeds/videos.xml?channel_id=UCgo7fyKuK0BAW7K8U0JOs0A",
    
    // ブログのRSS
    blog: "https://minakamiirisu.wixsite.com/minakamiirisu/blog-feed.xml"
};

const PROXY_URL = 'https://api.allorigins.win/raw?url=';

document.addEventListener('DOMContentLoaded', () => {
    // 両方のフィードを取得
    fetchFeed(CONFIG.youtube, 'youtube-feed', true);
    fetchFeed(CONFIG.blog, 'blog-feed', false);
});

async function fetchFeed(url, containerId, isYouTube) {
    const container = document.getElementById(containerId);

    try {
        const response = await fetch(PROXY_URL + encodeURIComponent(url));
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // YouTube(Atom)ならentry、ブログ(RSS2.0)ならitemを取得
        const items = isYouTube ? xmlDoc.querySelectorAll("entry") : xmlDoc.querySelectorAll("item");
        
        if (items.length === 0) {
            container.innerHTML = '<p class="loading">記事が見つかりませんでした。</p>';
            return;
        }

        container.innerHTML = ''; // ローディング消去

        items.forEach(item => {
            const title = item.querySelector("title").textContent;
            
            // リンクの取得
            let link = "";
            if (isYouTube) {
                link = item.querySelector("link").getAttribute("href");
            } else {
                link = item.querySelector("link").textContent;
            }

            // 日付
            const dateTag = item.querySelector("published") || item.querySelector("pubDate") || item.querySelector("updated");
            const date = new Date(dateTag.textContent).toLocaleDateString("ja-JP");

            // サムネイルの取得 (YouTube用)
            let thumbnailUrl = "";
            if (isYouTube) {
                // media:thumbnail などのネームスペース付きタグを取得
                const mediaThumbnail = item.getElementsByTagName("media:thumbnail")[0];
                thumbnailUrl = mediaThumbnail ? mediaThumbnail.getAttribute("url") : "";
            }

            // カードHTMLの組み立て
            const card = document.createElement("div");
            card.className = "card";
            
            let htmlContent = "";
            
            // YouTubeの場合はサムネイルを表示
            if (isYouTube && thumbnailUrl) {
                htmlContent += `
                    <div class="thumbnail-wrapper">
                        <img src="${thumbnailUrl}" alt="${title}" loading="lazy">
                    </div>
                `;
            }

            htmlContent += `
                <div class="card-content">
                    <div class="card-title"><a href="${link}" target="_blank">${title}</a></div>
                    <div class="card-date">${date}</div>
                </div>
            `;

            card.innerHTML = htmlContent;
            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="loading">エラーが発生しました。</p>';
    }
}