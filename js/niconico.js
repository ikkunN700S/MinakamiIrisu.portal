document.addEventListener('DOMContentLoaded', () => {
    fetchNiconicoFeed();
});

// 自分のリポジトリに自動生成されたJSONファイルを読み込む
async function fetchNiconicoFeed() {
    const container = document.getElementById('niconico-feed');
    const DATA_URL = './niconico.json';

    try {
        const response = await fetch(DATA_URL);
        
        if (!response.ok) {
            throw new Error('データファイルの読み込みに失敗しました');
        }
        
        const items = await response.json();
        
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="loading">ニコニコ動画の投稿が見つかりませんでした。</p>';
            return;
        }

        renderNiconicoCards(items, container);

    } catch (error) {
        console.error("ニコニコ動画描画エラー:", error);
        container.innerHTML = '<p class="loading">ニコニコ動画の読み込みに失敗しました。</p>';
    }
}

// --------------------------------------------------
// HTML（カード）の生成処理 (変更なし)
// --------------------------------------------------
function renderNiconicoCards(items, container) {
    container.innerHTML = ''; 

    items.forEach(item => {
        const title = item.title;
        const link = `https://www.nicovideo.jp/watch/${item.contentId}`;
        const dateObj = new Date(item.startTime);
        const dateString = dateObj.toLocaleDateString("ja-JP");
        const originalThumbnailUrl = item.thumbnailUrl || "";
        const highResThumbnailUrl = originalThumbnailUrl ? originalThumbnailUrl + ".L" : "";

        const card = document.createElement("a");
        card.className = "card";
        card.href = link;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        
        let htmlContent = "";
        
        if (highResThumbnailUrl) {
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