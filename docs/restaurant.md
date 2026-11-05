# Restaurant

The brand on what a restaurant or café hands over: a menu, a receipt, a takeaway cup, a sealed bag, a pizza box, chopsticks and napkins. They're three.js scenes shot through a lens on a table: lying things on the surface, standing things on a sweep printed with it, so there's no horizon. `art` is the mark; one drawn in `currentColor` takes `ink`. The neon sign and the window decal are in [Screens and signs](screens-and-signs.md#in-3d).

```js
import { menuScene, receiptScene, cupScene, takeawayScene, pizzaScene, chopsticksScene, napkinScene } from '@logomarks/mockups/3d';

await menuScene(canvas, { art: mark, name: 'Gecko', color: '#e2552c', layout: 'folded', surface: 'linen' });
await receiptScene(canvas, { art: mark, name: 'Gecko', items: [{ qty: 2, name: 'Flat white', price: 3.4 }] });
await cupScene(canvas, { art: mark, name: 'Gecko', sleeve: 'kraft', lid: 'black' });
await takeawayScene(canvas, { art: mark, seal: '#e2552c', ink: '#1a1714' });
await pizzaScene(canvas, { art: mark, name: 'Gecko', ink: '#c83a22', surface: 'oak' });
await chopsticksScene(canvas, { art: mark, name: 'Gecko', layout: 'pair' });
const shot = await napkinScene(canvas, { art: mark, color: 'kraft', print: 'corner' });
const blob = await shot.toBlob();
```

| Scene | What it is | Its own options |
|---|---|---|
| `menuScene` | `layout` `'card'`: a card menu lying askew on the table. `'folded'`: a tri-fold standing open, its cover the brand's colour | `sections` (`[{ title, items: [{ name, note, price }] }]`), `print` (a file instead: the card, 230 × 330 mm, or the tri-fold's inside, 297 × 210 mm), `bleed`, `stock`, `surface` (`'oak'`) |
| `receiptScene` | A thermal receipt, curled, its ends torn: the mark, the items, the total and a barcode in thermal black | `items` (`[{ qty, name, price }]`), `currency` (`'£'`), `print` (a file instead, 80 mm wide), `length` (its mm), `surface` (`'oak'`) |
| `cupScene` | A 12 oz paper cup with a domed sip lid and a printed sleeve | `color` (the cup), `lid` (`'white'`, `'black'`, hex), `sleeve` (`'kraft'`, `'white'`, `'black'`, hex), `ink` |
| `takeawayScene` | A kraft bag, its top folded over, a round seal across the fold | `paper` (`'kraft'`, `'white'`, `'black'`, hex), `seal` (the sticker), `ink` (the mark on it) |
| `pizzaScene` | A closed pizza box (`boxScene`'s `'pizza'` kind, 340 × 340 × 45 mm), its lid printed in one ink | `ink`, `roundel` (true), and `boxScene`'s `board`, `lining`, `open` |
| `chopsticksScene` | Chopsticks in a printed paper sleeve | `paper` (`'white'`, `'kraft'`, `'black'`, hex), `ink`, `wood`, `layout` (`'single'`, `'pair'`) |
| `napkinScene` | A stack of folded paper napkins, the top one printed | `color` (`'white'`, `'kraft'`, `'black'`, `'blush'`, hex), `ink`, `print` (`'centre'`, `'corner'`), `count` (16) |

They all take `art` (required), `name` (but the bag, whose seal carries the mark alone), `surface`, `light`, `seed`, the shot (`width`, `height`, `pixelRatio`, `view`, `exposure`, `fit`) and the lens (`blur`, `samples`), and return the usual handle (`render`, `setView`, `toBlob`, `dispose`). The cup, bag, pizza box, chopsticks and napkins take `shadow` (the contact shadows, 0–3). The menu and receipt take `color`, `ink` and `paper` for their composed prints; dishes, prices and addresses on them are placeholders.
