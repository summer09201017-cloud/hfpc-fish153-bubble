# 🐟 網滿大魚・一五三(hfpc-fish153-bubble)

「彈珠配對(泡泡龍反向化)+ tsum 皮」首發——骨架=hfpc-paul-game 的 arkmatch(系列類型⑭,
牧者已核可清單「網滿大魚 153 條」),移植成獨立站+五款圓魚 tsum 臉。

- 經文:約 21:6、21:11、21:12——**均經 cuv MCP 逐字查證(和合本)**
- 反向化:湊滿 3 條=**一起游進網裡**(歸聚,不是戳破);離群的=主也數算;
  堆太低=主親自收進網;**永不會輸**;結尾=炭火早飯(約 21:9,12)
- 與 hfpc-fishnet-tsum(連鏈)**同故事不同機制**(一題兩型,系列慣例)
- 年齡三檔:幼 3 種 3 排/童 4 種 4 排(每 9 發加壓)/青 5 種(每 6 發加壓+短瞄準線);勝利卡「再玩一次/選難度」
- 牧者已核可題材(2026-07-23);文案細節仍請過目

## 開發/部署

零相依、零美術檔、可離線(PWA)。語音重烤 `node scripts/gen-tts.mjs`;
驗證 `node scripts/verify.mjs <URL>`(⚠ 勿對空盤呼叫 `_settle`——BFS 會無界洪泛,留一組三連自然收尾)。

```bash
npx wrangler deploy --name hfpc-fish153-bubble --compatibility-date 2026-07-01 --assets .
```

改版時 `sw.js` 的 `CACHE_NAME` +1;`.assetsignore` 已擋 `.git`/`.wrangler`。
