document.addEventListener('DOMContentLoaded', () => {
    // JSONデータのパス
    const DATA_URL = './contents.json';

    // データを取得して描画を開始
    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('ネットワークエラーが発生しました');
            }
            return response.json();
        })
        .then(data => {
            renderHeader(data.meta);
            renderContents(data.contents);
        })
        .catch(error => {
            console.error('データの読み込みに失敗しました:', error);
            document.getElementById('contents-grid').innerHTML = 
                '<p style="color: red;">コンテンツの読み込みに失敗しました。</p>';
        });
});

/**
 * ヘッダー情報を描画する関数
 */
function renderHeader(meta) {
    const headerEl = document.getElementById('site-header');
    
    headerEl.innerHTML = `
        <h1 class="site-title">${meta.title}</h1>
        <h2 class="site-subtitle">${meta.subtitle}</h2>
        <p class="site-description">${meta.description}</p>
    `;
    
    // ページのtitleタグも書き換え
    document.title = `${meta.title} | ${meta.subtitle}`;
}

/**
 * コンテンツグリッドを描画する関数
 */
function renderContents(contents) {
    const gridEl = document.getElementById('contents-grid');
    gridEl.innerHTML = ''; // 初期化

    contents.forEach(item => {
        // カード要素（リンク）の作成
        const card = document.createElement('a');
        card.href = item.linkUrl;
        card.className = 'content-card';
        card.target = item.linkUrl.startsWith('http') ? '_blank' : '_self';

        // 内部HTMLの構築
        card.innerHTML = `
            <div class="card-image-wrapper">
                <span class="card-category">${item.category}</span>
                <!-- 画像がない場合の代替処理として、onerror属性も付与 -->
                <img src="${item.imageUrl}" alt="${item.title}" class="card-image" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22225%22 viewBox=%220 0 400 225%22%3E%3Crect width=%22400%22 height=%22225%22 fill=%22%23333%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23888%22 font-family=%22sans-serif%22 font-size=%2220%22%3ENO IMAGE%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="card-info">
                <div class="card-date">${item.date}</div>
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description}</p>
            </div>
        `;

        gridEl.appendChild(card);
    });
}