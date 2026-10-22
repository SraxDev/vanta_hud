# HUD — 1.8.3

## Troisième passe de performance — 1.8.3

Le compteur reçoit désormais une télémétrie distincte lorsque les autres informations ne changent pas ; déplacement et vitesse de la minimap arrivent par le flux pose déjà existant. Le HUD complet n’est plus renvoyé uniquement à cause des coordonnées pendant ce flux. Les jauges, la voix et les menus évitent les rafraîchissements DOM du compteur. Les lectures des blips connus sont planifiées par échéance dans une file de priorité au lieu de deux parcours complets de leurs fiches. Suppression de deux réveils périodiques redondants et d’une vérification de focus par image. La cadence du compteur, le rendu, les assets et le lissage restent inchangés. Voir PERFORMANCE.md pour les limites et le protocole de mesure.

Installation : `refresh`, puis `restart vanta_hud`. Diagnostic sans boucle de mesure : `hudperf` dans F8, indiquant notamment si le radar natif de secours est actif. Syntaxes inspectées ; aucun test exécuté, aucune mesure native de cette version, 0,00 ms non confirmé.

## Seconde passe de performance — 1.8.2

Retour du joueur sur 1.8.1 : 0,05–0,08 ms à pied et 0,08–0,13 ms en voiture. La télémétrie véhicule garde sa cadence rapide, mais les données du personnage sont relues au plus toutes les 200 ms, le carburant/moteur toutes les 500 ms, la ceinture externe toutes les 200 ms et la connexion vocale toutes les secondes. La position, la vitesse physique et l’orientation déjà relevées pour la minimap sont réutilisées si leur âge est inférieur à 150 ms et le ped/véhicule identiques. Aucun changement du rendu, des blips ou de l’interpolation. Recharger avec `refresh`, puis `restart vanta_hud`. Gain de cette seconde passe encore non mesuré ; profil demandé pour cibler la suite. Voir PERFORMANCE.md.

## Optimisation client — 1.8.1

Scans des blips mutualisés, données statiques en cache, contrôles ESX sortis de la boucle par image, messages complets envoyés seulement après changement utile. Le calcul des repères utilise le réseau routier local dans le Web Worker à pied comme en véhicule ; les extractions natives restent réservées aux missions. Interpolation de la minimap conservée et acquisition moins fréquente à l’arrêt. Voir [PERFORMANCE.md](PERFORMANCE.md) pour les cadences et limites.

Installation : `refresh`, puis `restart vanta_hud` dans la console serveur. Syntaxes inspectées ; aucune mesure native après installation, **0,00 ms permanent non garanti**. Les notes 1.8.0 ci-dessous décrivent l’état antérieur ; la section 1.8.1 remplace leurs cadences et le chemin GPS des repères.

## Navigation simplifiée — 1.8.0

- Double-clic sur la carte ou sur une entrée de lieu : sélection et placement du repère GPS, sans bouton Guider ni confirmation supplémentaire. Le premier clic sélectionne seulement. Glisser/pivoter n’est jamais traité comme un double-clic. La corbeille efface le repère. L’encart agrandi utilise ses propres coordonnées au clic.
- Un seul panneau Lieux : recherche, filtres et points d’intérêt. Les onglets Carte/Trajet, le panneau Trajet et la carte de confirmation sont retirés. Entrée et les raccourcis manette restent disponibles ; Échap revient au menu rapide.
- Itinéraire à pied : réseau routier GTA local, calcul A* dans un Web Worker. Les routes suivent les connexions réelles des nœuds, sans liaison arbitraire à travers le lac. À pied les liens routiers sont parcourables dans les deux sens ; le calcul de secours en véhicule respecte les voies dirigées. Le tracé commence et finit sur la route la plus proche ; aucun segment direct n’est ajouté entre un repère hors route et cette route.
- Tracé natif en véhicule : échantillonnage tous les 8 m au lieu d’une limite de 96 points de plus en plus espacés. Arrêt sur rupture de plus de 28 m, retour sur un ancien point ou extrémité immobile ; aucun bouclage de fin de route. Maximum 4096 points, seize requêtes natives par reprise de coroutine, cache et annulation lors d’un changement de repère. Si le tracé natif est absent/incomplet, le réseau routier local sert de secours.
- Minimap : poses légères au maximum environ 30 fois/s quand la position/orientation change, séparées des besoins/ESX. Orientation de caméra séparée de celle du personnage, interpolation angulaire par le chemin le plus court, prédiction courte et lissage indépendants des animations décoratives. Rendu jusqu’à 60 images/s en équilibré/détaillé, 30 en économe. Aucun FPS natif garanti.
- Le GPS compact reste visible à pied ; sa distance et ses indications utilisent le tracé local lorsqu’il sert de secours. La minimap ne relie pas la position du joueur directement au prochain nœud distant.

Syntaxes JavaScript/Lua inspectées. Trois rendus navigateur hors jeu : double-clic réel, itinéraire Grapeseed/Sandy Shores contournant le lac et ligne/GPS visibles à pied. Le calcul illustré produit 243 points routiers et aucune erreur navigateur. Pas de contrôle de l’écran, de session FiveM ni de mesure resmon.

Recharger dans la console serveur : **refresh**, puis **restart vanta_hud**.7.Dessins des blips et atlas jour/nuit inchangés.

## Carte automatique et correctifs — 1.7.1

- Accès « Carte GTA » retiré de la NUI et de la liste des actions autorisées. L’action carte ouvre uniquement la carte personnalisée. Le frontend natif MP Pause est fermé/redirigé vers la carte personnalisée lorsque la ressource est prête ; Échap/P continuent d’ouvrir le quick menu.
- Carte personnalisée imposée et ambiance forcée à auto dans la validation Lua comme dans la NUI. Les anciens réglages jour/nuit manuels ne prennent plus effet. Les boutons et réglages manuels sont retirés. L’heure GTA pilote le fond de la grande carte et de la minimap.
- Minimap : chargement des images locales par HTMLImageElement, sans repli blob bloqué par la CSP. Conservation du framebuffer WebGL pour le fond mis en cache, redessin au retour, délais de chargement et nouvelles tentatives bornées. La disponibilité graphique est acquittée au lieu d’être annoncée définitivement avant la réponse du client.
- Blips : suppression du masquage par cellules à l’écran et des plafonds variables 80/250 qui faisaient changer les icônes visibles au zoom. Ordre stable par identifiant, alpha réel respecté, états masqués natifs exclus, proximité avec hystérésis (apparition sous 680 m, disparition après 760 m). La liste de lieux respecte les catégories masquées. Les dessins de blips restent inchangés.
- Un blip de zone ailleurs sur la carte ne remplace plus toute la minimap personnalisée. Les géométries exactes de zones/rayons ne sont pas reproduites, faute de getter natif public du rayon ; aucun rayon inventé n’est affiché. Le repli radar natif existe encore en cas de problème graphique ou hors couverture stock, sans ouvrir la carte GTA.
- Optimisation : plus de tri par distance à chaque image pour les icônes, cache GPU borné, seuil haute définition corrigé pour le DPI. Zoom du radar natif actualisé au maximum toutes les 500 ms et configuration de son scaleform seulement lorsqu’il est affiché ; démarrage du scaleform limité à cinq secondes.
- Sécurité de la ressource : listes d’actions et de callbacks fermées, sessions par epoch pour action/fermeture, limitation de fréquence avec petites rafales autorisées pour préserver la sauvegarde et l’éditeur, coordonnées/volumes de blips et routes bornés, manifeste et dimensions d’images contrôlés. La CSP bloque objets, frames, formulaires et changement de base. HTTPS reste autorisé pour les callbacks FiveM : les hôtes de ressources avec underscore ne sont pas des sources CSP valides ; la cible des callbacks est construite depuis le nom de ressource validé. Cette interface client ne gère aucune autorité d’argent, inventaire ou permission serveur.

Installation : **refresh**, puis **restart vanta_hud** dans la console serveur.7.
Inspection de syntaxe des trois JavaScript et des Lua modifiés. Quatre rendus navigateur hors jeu examinés, notamment retour à la minimap et palettes à 12 h/22 h : aucune erreur navigateur dans le rendu final. Aucun test FiveM, aucune prise de contrôle de l’écran, aucun FPS/resmon natif mesuré.

## Atlas dessiné jour/nuit — 1.7.0

Intégration de la direction approuvée : atlas 8192 × 8192, végétation et reliefs dessinés, désert beige, plages, réseau routier et emprises de ville. La grande carte s’ouvre sur l’île entière ; l’encart montre un agrandissement autour du joueur. Recherche et lieux réels restent accessibles. Les six cases de catégories filtrent l’affichage local sans supprimer les blips du serveur.

La minimap et la grande carte utilisent le même fond et la même transition Auto/Jour/Nuit selon l’heure GTA. Blips et GPS réutilisent les données existantes, les atlas d’icônes et les callbacks existants. Aucun nom visible Vanta ajouté. L’atlas réel remplace le fond simplifié 1.6 ; les images de maquette ne sont pas utilisées comme données géographiques.

Rendu WebGL plat : fond d’ensemble déjà chargé, détails locaux avec deux décodages simultanés, cache limité à 20 textures (10 en qualité basse). L’ancienne vue reste couverte pendant le chargement d’un détail. Les tuiles possèdent une bordure répliquée pour éviter les coutures. Le fond est conservé quand seuls des blips changent ; les surfaces cessent de dessiner au repos. Zoom ancré au curseur, borné selon la résolution pour limiter l’agrandissement au-delà de la définition réelle. Aucun service cartographique distant n’est appelé en jeu.

Chargement : console serveur, **refresh** puis **restart vanta_hud**. Les réglages existants sont conservés.6.Détails et provenance dans MAP2D.md et licenses/MAP-ATLAS-SOURCE.txt.

Inspection de syntaxe JavaScript et rendus navigateur hors jeu effectués. Aucune validation FiveM, aucun FPS/resmon natif mesuré, aucun redémarrage automatique du serveur.

## Carte vectorielle et navigation — 1.6.0

Le fond est désormais entièrement vectoriel en 2D : côtes, zones de relief, forêts, quartiers, bâtiments et routes. Aucune image de carte n’est agrandie ou chargée pendant les déplacements. Les contours restent nets à toutes les échelles prises en charge ; le fond ne repasse plus sur une petite tuile floue pendant le zoom.

Le zoom est progressif et ancré au curseur. Déplacement direct, rotation plane, vue d’ensemble, recentrage et palettes jour/nuit sont conservés. Les commandes 3D ne reviennent pas : le dessin utilise uniquement des coordonnées XY et un rendu GPU plat, sans perspective, relief en volume ou moteur Three.js. Les blips et le GPS gardent leur dessin et leur pont existants.

Le fond est conservé au repos ; changer seulement un marqueur ou son survol ne le redessine pas. Les buffers sont créés au chargement, les traits sont regroupés spatialement et le rendu ne réduit plus sa définition pendant les interactions. Une interruption du contexte graphique déclenche le radar natif et une restauration relance la carte.

Rendus et navigation vérifiés en navigateur, y compris zooms extrêmes, curseur, résolutions et restauration du contexte. Les mesures en navigateur logiciel ne prouvent pas des FPS FiveM. Chargement : `refresh`, puis `restart vanta_hud`. Voir MAP2D.md.5.
## Carte 2D personnalisée — 1.5.0

La carte 3D est remplacée par une carte 2D dessinée : quartiers clairs, relief en aplats verts, bâtiments à plat, routes blanches et axes principaux bleus. La nuit, le fond passe en bleu sombre avec des rues plus lumineuses. La minimap et la grande carte partagent la même cartographie et les blips existants.

Réglages > Minimap : **Carte personnalisée**, **Ambiance de la carte : Jour / Nuit auto**. Le cycle suit l’heure GTA avec une transition à l’aube et au crépuscule. Jour/Nuit permettent aussi de fixer une ambiance sans modifier l’heure de la session. Zoom, rotation à plat, recherche, guidage et accès à la carte GTA sont conservés ; les commandes d’inclinaison et de 3D ont été retirées.

Le rendu utilise Canvas 2D et des tuiles locales, sans Three.js, modèle 3D ou service distant en jeu. Seules les tuiles utiles à la vue sont décodées, avec un cache borné ; les routes restent vectorielles. Les préférences, noms de callbacks historiques et jetons de validation sont conservés pour éviter une migration des profils.

Chargement : `refresh`, puis `restart vanta_hud`. Rendus navigateur examinés ; confirmation en jeu et performances natives encore à vérifier. Voir MAP2D.md.4.
## Lisibilité de la carte — 1.4.0

Les routes possèdent désormais leur propre couche, issue des connexions du jeu : chaussées contrastées, carrefours raccordés et largeur estimée selon les voies. Les reliefs ne sont plus assimilés à des façades blanches. L’eau des lacs est rétablie avec des rivages masqués ; quelques noms de régions apparaissent en vue d’ensemble.

La grande carte utilise une projection parallèle inclinée, avec un relief atténué et une vue initiale plus proche, orientée au nord. Les blips, leurs atlas et leurs styles sont conservés. Le réseau de fond ne calcule aucun itinéraire ; le GPS reste natif.

Chargement : `refresh`, puis `restart vanta_hud`. Rendus navigateur examinés de jour/nuit et à plusieurs résolutions ; confirmation en jeu et performances natives encore à vérifier.3.Voir MAP3D.md pour les sources et limites.

## Carte graphique — 1.3.0

La carte utilise désormais une présentation graphique inspirée des cartes numériques : bâtiments en volumes mats, contours fins, fond sobre et espaces verts en aplats. Le jour présente une palette claire ; la nuit utilise une palette graphite/bleutée. Les blips conservent leurs icônes et leurs styles existants.

L’interface se concentre sur les icônes : recherche et filtres, thème, position, vue d’ensemble, zoom, projection et carte GTA. La fiche de destination apparaît uniquement lorsqu’un repère ou un trajet est présent. Les explications de commande se trouvent derrière le bouton d’aide.

Le rendu utilise une surface limitée au rectangle de la minimap, une résolution plafonnée/adaptative et des dessins suspendus à l’arrêt. La vue d’ensemble regroupe la géométrie en deux matériaux ; les contours sont masqués à grande distance et en qualité Économe. Les textes et contrôles restent à la résolution de l’interface. Aucun gain de FPS natif n’est affirmé à partir des captures navigateur.

Chargement : `refresh`, puis `restart vanta_hud`.2.Voir MAP3D.md.

## Carte 3D et cycle jour/nuit — 1.2.0

- Minimap en volume et grande carte depuis Échap > Carte. Bâtiments et relief de San Andreas à partir d’un modèle local simplifié ; aucun service distant pendant le jeu.
- Réglages > Minimap : Carte en 3D, ambiance Auto/Jour/Nuit et qualité Économe/Équilibré/Détaillé. Auto suit l’heure GTA, avec une transition progressive à l’aube et au crépuscule.
- Grande carte : déplacement, zoom, rotation, inclinaison, vue 2D/3D, recentrage, recherche des lieux existants et placement d’un repère GPS. Les réglages graphiques natifs restent accessibles via Menu GTA.
- Les styles Classique/Cyan/Couleurs RP viennent des atlas existants. Les points d’intérêt conservent leurs pictogrammes lisibles ; les couleurs natives des entités restent prises en compte.
- Repli sur le radar GTA pendant le chargement, en cas d’échec WebGL, hors couverture ou en présence de zones radar incompatibles. Désactiver Carte en 3D rend le radar et la carte natifs.

**Chargement :** dans la console serveur, exécuter `refresh` puis `restart vanta_hud`. Le manifeste et les nouveaux fichiers doivent être rechargés. Les préférences existantes sont conservées et les trois nouvelles préférences reçoivent leur valeur par défaut.

**Limites :** ce modèle LOD ne reproduit pas chaque bâtiment au détail de la maquette et ne suit pas les MLO, nouvelles cartes ou modifications de terrain du serveur. Cayo Perico n’est pas fourni. Les noms de lieux utilisent le type de blip et la rue, car le nom personnalisé de chaque blip n’est pas exposé par l’API employée. Les zones circulaires restent prises en charge par le radar natif. Le GPS représente uniquement les points natifs accessibles ; les portions absentes ne sont pas inventées.

Voir [MAP3D.md](MAP3D.md) pour les contrôles, les sources, les choix techniques et le retour arrière. Le rendu navigateur utilise la vraie géométrie avec des données de démonstration ; il ne prouve pas les performances ni le bon fonctionnement dans une session FiveM. Aucun test natif n’a été effectué.

## Contrôles personnalisés — 1.1.1

Les trois listes déroulantes utilisent maintenant un composant HTML/SVG assorti au HUD : situation de l’aperçu, type de véhicule et catégorie du catalogue. Fond graphite, accent de la palette active, icônes, descriptions, coche de sélection et survol distinct. Ouverture en 135 ms, fermeture en 85 ms et chevron animé ; la préférence de mouvement réduit est respectée. Le champ de recherche possède aussi son état de focus et sa sélection de texte personnalisés.

- Souris : ouvrir puis choisir ; un clic extérieur referme sans modifier la valeur.
- Clavier : Entrée/Espace ou flèches pour ouvrir, Haut/Bas pour parcourir, Début/Fin pour les extrémités, saisie des premières lettres pour rechercher, Entrée pour valider, Échap pour annuler. Tab referme puis poursuit la navigation.
- Manette : Y parcourt les actions des réglages ; sur une liste, A ouvre, Haut/Bas ou le joystick parcourt, A valide, B annule. Dans le catalogue, LB/RB conserve le changement rapide de catégorie.
- Le panneau utilise l’espace disponible au-dessus ou au-dessous du contrôle et défile sans barre native lorsque nécessaire. Échap ferme d’abord la liste ouverte. Les valeurs et événements de changement existants sont conservés ; aucune donnée de jeu ni sauvegarde n’est modifiée par un simple survol.

Installation : `refresh` puis `restart vanta_hud` pour charger le nouveau fichier `web/controls.js` déclaré dans le manifeste.1.La syntaxe et les rendus navigateur en 1920×1080 et 1280×720 ont été examinés ; confirmation en jeu et manette physique à effectuer.

## Personnalisation et navigation — 1.1.0

- **Réglages > Placer le HUD** : déplacement indépendant du groupe carte/jauges et du compteur. Glisser un cadre à la souris ; les flèches déplacent de 1 px, Maj + flèche de 10 px. L’alignement aimante la position au relâchement (pas de 8 px, origine, limites et centre de l’écran). Les guides indiquent les marges et les axes. Une indication signale le chevauchement des instruments.
- **Valider / Annuler** : les déplacements sont un brouillon local non persistant. Valider enregistre les quatre positions dans le KVP existant ; Annuler ou fermer le menu rétablit la dernière position enregistrée. Le bouton Placement d’origine remet le brouillon à zéro. Une silhouette d’emplacement est présentée si le compteur n’est pas actif. Le petit aperçu des réglages reste recentré pour la lisibilité ; le placement exact s’effectue dans l’éditeur plein écran.
- **Manette dans l’éditeur** : LB/RB choisit le groupe, croix/joystick gauche déplace, X active/désactive l’alignement, A valide et B annule. Le jeu ne récupère pas les commandes tant que le menu possède le focus.
- **Trois favoris** : Interface > Raccourci favori / Favori 2 / Favori 3. Carte, inventaire et téléphone ; les deux favoris supplémentaires peuvent être désactivés. Les affectations sont échangées pour éviter les doublons. Dans le menu Échap, 1/2/3 ouvrent directement un favori (rangée numérique AZERTY prise en charge) ; F ouvre le premier. À la manette, gauche/droite sélectionne le favori et X l’ouvre. Les ressources indisponibles restent désactivées.
- **Sons de navigation** : Accessibilité > Sons de navigation / Volume du menu. Sons synthétisés localement, volume par défaut 18 %, silence à zéro ; aucune requête audio réseau. Les sons attendent l’autorisation audio du navigateur et ne bloquent jamais une action.
- **Situations de l’aperçu** : actuelle, santé faible, réserve/moteur, radio et nuit. Les données simulées restent dans l’aperçu ; elles ne modifient jamais les données du personnage, du véhicule ou de la radio.
- **Animations** : transitions brèves entre catégories, retour de sélection et de pression. Le réglage Animations et la préférence système de mouvement réduit restent prioritaires. Les barres de défilement natives restent masquées.

Installation : `refresh` puis `restart vanta_hud` dans la console serveur. Les paramètres existants sont conservés. La mise à jour touche `config.lua`, `client/main.lua`, `web/app.js`, `web/index.html`, `web/visual.css`, le manifeste et la documentation. Les atlas de blips, le GFx, les marges internes et le masque de la minimap restent ceux de la version précédente.

0.Rétablir ces fichiers, puis `refresh` / `restart vanta_hud` pour revenir au comportement précédent ; les clés supplémentaires du KVP sont ignorées par l’ancienne version.

Syntaxe JavaScript/Lua examinée et captures navigateur sans fenêtre consultées. L’alignement du radar après déplacement, la sauvegarde KVP, le focus, le son et la manette nécessitent une confirmation dans FiveM ; aucune mesure de performances natives ni session de jeu n’est déduite du rendu navigateur.

## Direction visuelle intégrée — 1.0.0

La présentation des maquettes est maintenant construite en HTML/CSS/SVG : HUD, guidage, six profils de compteur, voix, notifications, menu Échap et réglages. Les scènes générées ne sont pas chargées en jeu. Le vrai décor reste celui de votre session.

Charger le manifeste avec refresh puis restart vanta_hud. Les préférences existantes sont conservées ; sélectionner Interface > Palette visuelle > Cyan pour retrouver la teinte cyan des maquettes si une autre palette était déjà enregistrée. Les coordonnées et le GFx de la minimap ne changent pas.

Les réglages sont regroupés par usage : Interface (aspect), Minimap (position et visibilité), Véhicule, Blips, Accessibilité. Les touches, l’annulation et les remises à zéro restent disponibles. L’altitude est présentée dans le compteur aérien ; l’endurance du vélo est intégrée dans le compteur lorsqu’une valeur contextuelle est disponible.

9.Restaurer les fichiers puis refresh/restart. Le fichier web/visual.css ajouté peut rester sur disque, l’ancien manifeste ne le charge pas.

## Mise à jour 0.9.0 — finitions et blips

Dans la console serveur : refresh puis restart vanta_hud. La mise à jour comporte un module client et deux fichiers NUI supplémentaires ; le manifeste doit être chargé à nouveau. Aucun changement de stream/minimap.gfx ni des rectangles du radar.

- Réglages > Interface : palette et raccourci favori. Accessibilité : texte, contraste, oxygène/endurance et détails voix. Véhicule : vitesse nautique. Blips : catalogue complet avec recherche.
- Le favori s’ouvre avec F au clavier ou X manette depuis le quick menu. Les ressources arrêtées restent indisponibles. Les flèches/D-pad naviguent ; Q/E ou LB/RB changent d’onglet ; B revient. Dans les réglages, Y parcourt les actions et A active ; X change le contexte d’aperçu. Dans le catalogue, D-pad/joystick défile et LB/RB filtre les catégories.
- Oxygène : secondes natives restantes. La barre utilise Config.Context.oxygenScaleSeconds comme échelle visuelle ; cette valeur n’altère pas la capacité réelle. Endurance : pourcentage natif affiché pendant l’effort puis brièvement en récupération.
- Radio : lecture des state bags radioActive/radioChannel/proximity de la version pma-voice installée. Le HUD n’invente pas un micro coupé lorsqu’il n’y a simplement pas de parole. Une ressource qui connaît cet état peut appeler exports['vanta_hud']:SetMicrophoneMuted(true/false), puis nil pour libérer son indication. L’indication est libérée si cette ressource s’arrête.
- La vitesse des bateaux peut être en KN ; altitude en mètres au-dessus du sol pour les aéronefs. Les scripts de ceinture existants restent propriétaires du gameplay.
- Le GPS est une aide estimée, pas une garantie de guidage intersection par intersection. La prochaine rue vient des points du tracé disponibles. En l’absence de données routières, le repli est explicitement à vol d’oiseau.
- La palette des pages GTA natives est adaptée au choix d’accent. Leur disposition, la police native et les paramètres réels de graphismes/audio ne sont pas remplacés.
- Diagnostic GPS : hudgps dans F8. Pour les performances, activer resmon 1 et le profiler en jeu dans des scènes comparables ; aucune mesure native n’est déduite des captures navigateur.

8.Pour revenir à 0.8.1, restaurer les fichiers de cette sauvegarde. Les nouveaux fichiers peuvent rester sur disque, car l’ancien manifeste ne les charge pas.


HUD ESX, menu Échap, réglages et catalogue natif de blips. Géométrie de la minimap conservée depuis 0.3.5.

La version 0.8.0 ajoute le guidage GPS, les avertissements véhicule, les transitions de contexte, trois préréglages d’affichage et une palette harmonisée pour le menu natif GTA. Deux nouveaux modules client nécessitent `refresh` puis `restart vanta_hud` dans la console serveur.

Réglages : Interface > Minimal / Équilibré / Détaillé ; Minimap > Guidage GPS ; Véhicule > Avertissements véhicule ; Accessibilité > Style du menu GTA. Le choix Personnalisé est conservé lors de la migration des anciennes préférences.

Le GPS utilise la route native active, avec une direction estimée et une distance restante. Il ne fournit pas une liste exacte de manœuvres : si les points de route ne sont pas accessibles, seul le suivi général est affiché. Les itinéraires ne sont jamais remplacés. Les alertes moteur/carburant se fondent sur les valeurs natives ; seuils configurables dans Config.VehicleWarnings.

Le thème natif modifie uniquement la palette pendant la pause, avec restauration à la fermeture et à l’arrêt. Il conserve les polices, la disposition et tous les vrais réglages graphiques/audio/commandes du jeu. Il est désactivable dans les réglages ou dans Config.NativeMenuTheme. Aucun résultat visuel natif n’a été vérifié dans FiveM.

La version 0.7.0 intègre les nouvelles compositions approuvées du HUD et du compteur, avec le pictogramme de ceinture validé. Pour charger cette présentation, exécuter `restart vanta_hud` dans la console serveur. Elle ne change aucun script Lua ni raccordement ESX de 0.6.0 ; aucun nouvel asset GFx ne nécessite une reconnexion.

## Mise à jour locale

Cette version ajoute le HUD adaptatif, le compteur contextuel, les notifications harmonisées, l’annulation des réglages et les aperçus à pied/en véhicule. Elle conserve le style approuvé sans marque affichée, les préférences KVP et les intégrations ESX.

Pour charger également les deux relais de notifications ESX installés avec cette version, redémarrer complètement le serveur. Cela recharge es_extended, esx_notify et le HUD dans leur ordre de démarrage habituel. Ne pas redémarrer es_extended seul sur un serveur occupé. Pour les changements propres au HUD uniquement, les commandes suivantes suffisent :

Dans la console serveur :

```text
refresh
restart vanta_hud
```

Depuis 0.4.5, les atlas, le GFx, le chargeur des blips et les calculs du radar sont inchangés : cette mise à jour d’interface ne demande pas de reconnexion pour ces assets. Si vous venez d’une version plus ancienne du catalogue, une reconnexion reste nécessaire pour recharger stream/minimap.gfx. Aucun cache à supprimer.

Le menu et les réglages utilisent un canevas indépendant du HUD natif. Les dimensions du radar et des jauges restent fournies par Lua ; aucune animation ne déplace son cadre. Les jauges utilisent des transformations, sans boucle d’animation permanente. Les apparitions du menu, les sélections et le compteur respectent le réglage Animations et la réduction des mouvements du système.

L’aperçu des réglages utilise une scène illustrative et une carte SVG, avec les données du personnage. Cette image n’est jamais affichée sur le HUD réel. La sauvegarde continue de passer par le callback settings et le KVP existant, indépendamment du chargement du style des blips.

Rendus de présentation inspectés dans un navigateur. L’exécution FiveM/CEF et le rendu du radar natif restent à confirmer en jeu après redémarrage de la ressource.

## Styles

Réglages > BLIPS > STYLE DES BLIPS : Classique, Cyan, Couleurs RP. Le style est stocké dans le KVP local existant. Les anciennes préférences classic et cyan restent compatibles ; readable migre vers Classique. Classique est la valeur par défaut. Les flèches du clavier, la manette et les contrôles existants du menu restent utilisés.

Le GFx importe l'atlas Vanta via blips_texturesheet_NG ; la texture native historique correspondante est embarquée pour préserver les symboles non redessinés. Les trois atlas PNG 1024 × 1024 sont chargés à la demande dans un TXD local et remplacés avec AddReplaceTexture. Le nombre de textures est borné à trois et les familles de points statiques sont parcourues de manière bornée. Le remplacement est retiré à l'arrêt ; après arrêt définitif, une reconnexion est nécessaire pour restaurer aussi le GFx natif.

Cette native de remplacement est classée expérimentale dans la documentation Cfx.re. Le résultat du changement de style sur la carte et la minimap reste à confirmer dans FiveM après reconnexion ; la compilation et l'aperçu PNG ne le démontrent pas.

## Sens des icônes

Police : insigne simple ; hôpital : croix ; commerce : sac ; garage : clé à molette ; banque : colonnes ; carburant : pompe ; pêche : poisson ; marchand de pêche : sac avec poisson. Huit exemples nommés dans les réglages. Les noms, coordonnées et itinéraires restent attribués par les ressources du serveur. La palette des POI suit le style choisi.

Le catalogue conserve les ID officiels 0 à 965 et ajoute 966 (pêche) et 967 (marchand). Export GetBlipSprite(kind) pour les intégrations. Huntfish utilise ces symboles quand vanta_hud est démarré, sinon une ancre pour la pêche et un commerce pour le marchand. Les blips sont actualisés au démarrage/arrêt du HUD, sans dépendance dure supplémentaire.

## Contrats existants

ESX Legacy ; besoins esx_status ; voix pma-voice ; inventaire esx_inventory/ShowInventory ; téléphone sd-phone/open ; ceinture esx_cruisecontrol. Aucun nouveau script serveur, événement réseau ou changement d'économie.

Exports existants : SetNeeds, VantaHudHidden, VantaStatusHidden et SetVisible. Les baux, le focus, le flou et les entités propres continuent à être nettoyés à l'arrêt.

## Retour arrière

Le reçu installation-vanta-hud-0.4.5.json donne la sauvegarde des fichiers remplacés. Restaurer ces copies puis redémarrer les ressources et reconnecter le client. Ne pas mélanger le GFx 0.4 et les atlas d'une version antérieure.

## Travail effectué et limites

Compilation du catalogue ActionScript et génération des trois atlas et de la planche 16-blips-styles-lisibles.png. Lecture des chemins de validation, sauvegarde et nettoyage. Aucun contrôle de l'écran et aucun test en jeu effectué pour 0.4.0. La carte plein écran, les nouveaux ID 966/967 et le remplacement d'atlas doivent être observés par le joueur.

## Retour aux styles de référence 0.4.1

Silhouettes pleines blanches avec contour noir pour Classique ; cadre fermé cyan et fond sombre pour Cyan ; police bleue, hôpital rouge, garage jaune, commerces verts, banque turquoise et carburant blanc pour Couleurs RP. Les autres familles sont déclinées avec la même signature.

La teinte native des POI par coordonnées des familles services/propriétés/activités est neutralisée à blanc pour éviter de multiplier les couleurs de l’atlas. Traitement par lots de huit familles toutes les 200 ms, limite de 64 blips par famille et restauration des couleurs à l’arrêt. Les familles de joueurs, entités mobiles, navigation, objectifs, armes et rayons sont exclues. Les couleurs de routes ne sont pas modifiées.

La géométrie du radar est inchangée. Aperçu 17-blips-styles-reference.png ; application et couleurs effectives dans FiveM à confirmer par le joueur.

## Sauvegarde 0.4.2

Le callback settings écrit et relit les préférences dans le KVP v2 avant de répondre. Le style des blips est chargé après la réponse et ne conditionne plus la persistance. La fermeture du menu et ses actions attendent la fin des modifications en cours. Si la sauvegarde échoue, le menu reste ouvert et affiche le message reçu. Une erreur de chargement de style est signalée séparément et le choix reste enregistré pour le prochain chargement.

Installer avec restart vanta_hud. Aucun changement de géométrie, de catalogue GFx ni de gameplay. Lecture des chemins de sauvegarde et de fermeture effectuée ; aucun test en jeu ni contrôle de l’écran. Persistance après redémarrage à confirmer par le joueur.

## Chargement des styles 0.4.3

Les journaux de 0.4.2 montraient un retour false pour les trois styles. Le chargeur utilisait un nom fixe de TXD à travers les redémarrages. Dans le code Cfx RuntimeAssetNatives.cpp, EnsureTxd laisse son pointeur nul si le slot existe déjà et possède un handle ; CreateTextureFromImage retourne alors nullptr. Le chargeur utilise désormais un nom distinct par démarrage.

TextureReplacementNatives.cpp utilise une bimap et insert ne remplace pas une association existante. Le lien précédent est donc retiré avant le nouvel AddReplaceTexture. Les atlas sont explicitement déclarés et leur présence/dimensions contrôlées. En cas de nouvel échec, le journal précise dictionnaire, paquet client ou décodage PNG. Aucun contrôle de l’écran ni test en jeu effectué.

Sources primaires : https://github.com/citizenfx/fivem/blob/master/code/components/extra-natives-five/src/RuntimeAssetNatives.cpp et https://github.com/citizenfx/fivem/blob/master/code/components/extra-natives-five/src/TextureReplacementNatives.cpp

## Atlas distribués 0.4.4

L’index cache/files/vanta_hud/resource.rpf.db montrait zéro atlas sous web/assets/blips/styles, mais les trois anciens chemins web/assets/blips/classic.png, cyan.png et rp.png étaient déjà inclus. Les nouveaux atlas 1024 × 1024 remplacent maintenant ces anciens fichiers et le chargeur utilise ces chemins existants. Les déclarations du manifeste sont alignées. Le générateur produit aussi directement ces chemins.

Dans la console serveur : refresh puis restart vanta_hud. refresh recharge les manifestes et évite de conserver une ancienne liste de fichiers. Les PNG existants sont remplacés sans suppression du cache. Le message précis Atlas absent disparaîtra seulement lorsque le nouveau paquet aura été monté côté client ; cela reste à confirmer par le joueur.

## Silhouettes validées 0.4.5

Les atlas Classique, Cyan et Couleurs RP de la planche 19 ont été validés puis copiés aux chemins déjà diffusés au client. 904 silhouettes natives adaptées, 2 dessins littéraux Vanta et 8 symboles approuvés. 38 repères hérités restent conservés ; leur provenance est indiquée dans design/blip-visual-provenance.json.

Les aperçus du menu utilisent les mêmes images. Aucun changement de KVP, de Lua, de GFx ou de position de carte pour cette mise à jour. Dans la console serveur : refresh puis restart vanta_hud. Si une ancienne version du GFx est encore chargée en mémoire, fermer complètement FiveM et reconnecter le client. Aucun contrôle de l’écran ni test en jeu effectué pour cette livraison.
