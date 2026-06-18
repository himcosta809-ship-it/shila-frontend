# Shila Handicraft

Handmade crochet, knitwear & beaded jewellery store for shilahandicraft.com.np.

## Files
- `index.html` — storefront (structure only)
- `style.css` — all styles
- `script.js` — all functionality + product data
- `admin.html` — standalone admin panel
- `assets/` — product photos and videos

## Run locally
Just open `index.html` in any browser. No server needed.

## Admin panel
Open `admin.html`. Login:
- Username: `admin`
- Password: `shila2024`

Edit/add/delete products there — changes save to the browser and show up
on the storefront automatically (both use the same browser storage).

> Note: cart, wishlist, products and messages are stored in the browser
> (localStorage), so they live on each visitor's device. For a shared,
> server-backed store you'd add a small backend later.

## Deploy to Netlify
1. Push this folder to a GitHub repo.
2. In Netlify: New site → import the repo → Publish directory = root (`/`).
3. Or drag-and-drop the whole folder onto app.netlify.com/drop.

## Change the admin password
In `admin.html`, find `p==="shila2024"` and replace with your own password.
