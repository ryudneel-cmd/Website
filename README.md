# TSBET // LOAD

Panneau de charge navigateur + relais Edge Vercel pour tsbet.leokhol.com.

## Deploiement
1. `git init && git add . && git commit -m init`
2. Depot **prive** sur GitHub, push.
3. Vercel -> Add New -> Project -> importe le depot -> Framework: **Other** -> Deploy.
4. Ouvre l URL de prod. Ajoute ton cookie `cf_clearance` dans la section Avance.

## Modes
- **Auto** : teste le CORS, bascule en proxy si bloque.
- **Proxy** : tout passe par `/api/proxy` (necessaire derriere Cloudflare).
- **Direct (no-cors)** : aveugle, tres rapide, pas de code HTTP lisible.

## Notes
- Chaque requete proxifiee = 1 invocation Edge Vercel. Le plan Hobby en inclut environ 1M/mois.
- "Forcer l origine" tape 141.95.127.213 en HTTP direct, hors Cloudflare.
- Plusieurs onglets en parallele multiplient la charge.