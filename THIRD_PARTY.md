# Third-party content

The code and the original icons of vanta_hud are under the MIT licence (`LICENSE`). The following is not.

## Barlow Condensed font

From [google/fonts](https://github.com/google/fonts/tree/main/ofl/barlowcondensed), SIL Open Font License 1.1. See `web/assets/fonts/OFL.txt`.

## Blip atlases

`web/assets/blips/classic.png`, `cyan.png` and `rp.png` redraw the blip silhouettes published by Cfx.re ([docs](https://docs.fivem.net/docs/game-references/blips/)), with our own framing, colours and sizes. The original GTA V designs and names belong to Rockstar Games.

Earlier versions used the sheet from [RMSCRIPTS-DEV/rm-custom-blips](https://github.com/RMSCRIPTS-DEV/rm-custom-blips); its licence is kept in `RM-CUSTOM-BLIPS-LICENSE.txt`.

## Weapon icons

`web/weapons/WEAPON_*.png` come from [ox_inventory](https://github.com/overextended/ox_inventory) (Overextended), GPL-3.0 or later. See `licenses/WEAPON-ICONS-OX_INVENTORY.txt`. The weapons themselves are GTA V content (Rockstar Games). Without these files the weapon HUD shows a generic silhouette.

## Map atlas and road network

See `MAP2D.md`, `licenses/MAP-ATLAS-SOURCE.txt` and `licenses/ROUTING-SOURCE.txt`. Both are derived from GTA V data (Rockstar Games).

## stream/minimap.gfx

Not included in this repository. It is a modified GTA V `minimap.gfx` (Rockstar Games) where the blip symbols are replaced by our atlas, edited with [JPEXS Free Flash Decompiler](https://github.com/jindrapetrik/jpexs-decompiler). The HUD works without it; only the symbols on the native radar stay vanilla.
