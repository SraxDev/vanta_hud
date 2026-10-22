# Changelog 0.x to 1.8.3 (archive, French)

Historical entries kept in their original language. Current entries are in ../CHANGELOG.md.

# 1.8.3

- Le message interne `vehicleTelemetry` transporte uniquement le compteur lorsqu’il reste dans le même véhicule et que l’état général du HUD n’a pas changé. Entrée/sortie, classe/identifiant, jauges, GPS, voix, heure, visibilité et menus continuent de déclencher un état complet. L’interface refuse une télémétrie ne correspondant pas à son véhicule courant.
- Les coordonnées du flux pose ne déclenchent plus un deuxième envoi d’état complet. Le flux fournit également la vitesse physique, garde ses validations et met à jour l’état local de l’interface. Le déplacement vertical est pris en compte. Sans pose fraîche, le chemin complet reste utilisé. Reconnexion de la NUI : invalidation du précédent état et nouveau snapshot complet.
- Extraction du dessin du compteur en fonction dédiée : sa télémétrie ne repeint plus santé, besoins, voix et liste de réglages. Cadences de collecte et d’interpolation inchangées.
- File de priorité par échéance pour les blips connus : consultation de la tête au repos, extraction/réinsertion uniquement pour les fiches dues, au plus 48 par passage. Une entrée par handle, suppression des handles invalides et reconstruction des échéances si le timer recule. Le scanner des nouvelles familles, display/alpha et couleurs sont conservés.
- Suppression du thread de normalisation inactif quand la carte personnalisée est configurée et du thread de thème natif : ce dernier reçoit l’état pause déjà lu par le collecteur principal. Focus contrôlé dans le collecteur et revalidé au moment de l’ouverture du menu, au lieu d’une lecture à chaque image. Réactivation immédiate des contrôles à la fermeture du menu.
- Commande locale ponctuelle `hudperf` : version, readiness, repli radar natif, flux pose et nombre de fiches en file ; aucun compteur ni thread permanent ajouté pour le diagnostic.

Revue statique des contrats, caches, focus et annulations ; syntaxes inspectées. Aucun test exécuté ni profil FiveM disponible, aucun gain chiffré attribué à cette version. Aucun changement de dessin, résolution, option utilisateur, réglage serveur ou autorité réseau. Sauvegarde 1.8.2 avant installation ; redémarrage requis.

# 1.8.2

- Mesures rapportées par le joueur sur 1.8.1 : 0,05–0,08 ms à pied, 0,08–0,13 ms en voiture. Aucun pourcentage de gain déduit de scénarios potentiellement différents.
- Séparation des lectures de santé/voix/contexte (200 ms), carburant/moteur (500 ms), ceinture externe (200 ms) et connexion Mumble (1 s). Vitesse, rapport, régime et altitude conservent la cadence configurée du compteur. Cache invalidé sur changement de véhicule/ped ; ceinture intégrée toujours lue immédiatement, mort détectée à chaque tour de l’état.
- Réutilisation d’une pose déjà acquise pour la minimap lorsque le ped, le véhicule et la fraîcheur correspondent, au lieu de répéter les mêmes natives dans le rafraîchissement général. Vitesse calculée par la norme du vecteur de vitesse. Pas de réduction de la cadence du flux pose ni du rendu graphique.
- Lecture de proximité vocale partagée entre le HUD et le contexte ; lecture de mort partagée. Aucun nouveau message NUI ni événement réseau, aucun changement visuel ou de réglage enregistré.

Syntaxe et revue des caches/invalidations uniquement ; aucun test exécuté ni mesure native de 1.8.2. Profil client demandé avant d’attribuer le coût restant à une boucle précise. Sauvegarde 1.8.1 conservée avant installation, redémarrage de ressource requis.

# 1.8.1

- Retrait des appels ESX, de gestion du radar et de redirection frontend de la boucle par image ; maintien des contrôles Échap/P et de la ceinture uniquement lorsqu’ils sont nécessaires. Readiness ESX en cache 500 ms, invalidée sur le cycle de session et de ressource.
- Un seul scanner pour la carte et la normalisation des couleurs des blips. Cache des POI 2 s, données mobiles 250 ms, budgets 24 + 24 répartis par parcours tournant pour éviter qu’un grand catalogue ne bloque les derniers éléments. Tri par révision et suppression des encodages JSON intermédiaires.
- Les repères GPS utilisent le worker routier local à pied et en véhicule ; retrait de leur extraction native jusqu’à 4096 points et des calculs de distance natifs. Échantillonnage des missions conservé avec un budget de huit requêtes par reprise et un délai minimal de 2 s entre extractions. Aucun nouveau tracé droit hors route ; aucun changement du waypoint natif ni des routes de missions.
- Envoi de l’état seulement sur changement utile, horodatage exclu de la comparaison. Pose minimap à 33 ms en mouvement et 66 ms immobile, avec interpolation graphique conservée. Recherche de localisation suspendue sans déplacement de 3 m. Mise en page et intégrations espacées, réactions aux réglages conservées.
- Le worker ne recalcule plus une route valide à l’arrêt toutes les quatre secondes. Apparence du HUD, atlas et dessins des blips inchangés.

Syntaxes Lua/JavaScript inspectées et revue statique. Aucun test gameplay ni mesure resmon effectués ; aucune affirmation de gain chiffré ou de 0,00 ms. Détails et protocole de mesure dans PERFORMANCE.md. Redémarrage : `refresh`, puis `restart vanta_hud`.

# 1.8.0

- Double-clic sur la carte ou sur une entrée de lieu : sélection et placement du repère GPS, sans bouton Guider ni confirmation supplémentaire. Le premier clic sélectionne seulement. Glisser/pivoter n’est jamais traité comme un double-clic. La corbeille efface le repère. L’encart agrandi utilise ses propres coordonnées au clic.
- Un seul panneau Lieux : recherche, filtres et points d’intérêt. Les onglets Carte/Trajet, le panneau Trajet et la carte de confirmation sont retirés. Entrée et les raccourcis manette restent disponibles ; Échap revient au menu rapide.
- Itinéraire à pied : réseau routier GTA local, calcul A* dans un Web Worker. Les routes suivent les connexions réelles des nœuds, sans liaison arbitraire à travers le lac. À pied les liens routiers sont parcourables dans les deux sens ; le calcul de secours en véhicule respecte les voies dirigées. Le tracé commence et finit sur la route la plus proche ; aucun segment direct n’est ajouté entre un repère hors route et cette route.
- Tracé natif en véhicule : échantillonnage tous les 8 m au lieu d’une limite de 96 points de plus en plus espacés. Arrêt sur rupture de plus de 28 m, retour sur un ancien point ou extrémité immobile ; aucun bouclage de fin de route. Maximum 4096 points, seize requêtes natives par reprise de coroutine, cache et annulation lors d’un changement de repère. Si le tracé natif est absent/incomplet, le réseau routier local sert de secours.
- Minimap : poses légères au maximum environ 30 fois/s quand la position/orientation change, séparées des besoins/ESX. Orientation de caméra séparée de celle du personnage, interpolation angulaire par le chemin le plus court, prédiction courte et lissage indépendants des animations décoratives. Rendu jusqu’à 60 images/s en équilibré/détaillé, 30 en économe. Aucun FPS natif garanti.
- Le GPS compact reste visible à pied ; sa distance et ses indications utilisent le tracé local lorsqu’il sert de secours. La minimap ne relie pas la position du joueur directement au prochain nœud distant.

Syntaxes JavaScript/Lua inspectées. Trois rendus navigateur hors jeu : double-clic réel, itinéraire Grapeseed/Sandy Shores contournant le lac et ligne/GPS visibles à pied. Le calcul illustré produit 243 points routiers et aucune erreur navigateur. Pas de contrôle de l’écran, de session FiveM ni de mesure resmon.

Recharger dans la console serveur : **refresh**, puis **restart vanta_hud**.7.Dessins des blips et atlas jour/nuit inchangés.

# 1.7.1

- Accès « Carte GTA » retiré de la NUI et de la liste des actions autorisées. L’action carte ouvre uniquement la carte personnalisée. Le frontend natif MP Pause est fermé/redirigé vers la carte personnalisée lorsque la ressource est prête ; Échap/P continuent d’ouvrir le quick menu.
- Carte personnalisée imposée et ambiance forcée à auto dans la validation Lua comme dans la NUI. Les anciens réglages jour/nuit manuels ne prennent plus effet. Les boutons et réglages manuels sont retirés. L’heure GTA pilote le fond de la grande carte et de la minimap.
- Minimap : chargement des images locales par HTMLImageElement, sans repli blob bloqué par la CSP. Conservation du framebuffer WebGL pour le fond mis en cache, redessin au retour, délais de chargement et nouvelles tentatives bornées. La disponibilité graphique est acquittée au lieu d’être annoncée définitivement avant la réponse du client.
- Blips : suppression du masquage par cellules à l’écran et des plafonds variables 80/250 qui faisaient changer les icônes visibles au zoom. Ordre stable par identifiant, alpha réel respecté, états masqués natifs exclus, proximité avec hystérésis (apparition sous 680 m, disparition après 760 m). La liste de lieux respecte les catégories masquées. Les dessins de blips restent inchangés.
- Un blip de zone ailleurs sur la carte ne remplace plus toute la minimap personnalisée. Les géométries exactes de zones/rayons ne sont pas reproduites, faute de getter natif public du rayon ; aucun rayon inventé n’est affiché. Le repli radar natif existe encore en cas de problème graphique ou hors couverture stock, sans ouvrir la carte GTA.
- Optimisation : plus de tri par distance à chaque image pour les icônes, cache GPU borné, seuil haute définition corrigé pour le DPI. Zoom du radar natif actualisé au maximum toutes les 500 ms et configuration de son scaleform seulement lorsqu’il est affiché ; démarrage du scaleform limité à cinq secondes.
- Sécurité de la ressource : listes d’actions et de callbacks fermées, sessions par epoch pour action/fermeture, limitation de fréquence avec petites rafales autorisées pour préserver la sauvegarde et l’éditeur, coordonnées/volumes de blips et routes bornés, manifeste et dimensions d’images contrôlés. La CSP bloque objets, frames, formulaires et changement de base. HTTPS reste autorisé pour les callbacks FiveM : les hôtes de ressources avec underscore ne sont pas des sources CSP valides ; la cible des callbacks est construite depuis le nom de ressource validé. Cette interface client ne gère aucune autorité d’argent, inventaire ou permission serveur.

Installation : **refresh**, puis **restart vanta_hud** dans la console serveur.7.
Inspection de syntaxe des trois JavaScript et des Lua modifiés. Quatre rendus navigateur hors jeu examinés, notamment retour à la minimap et palettes à 12 h/22 h : aucune erreur navigateur dans le rendu final. Aucun test FiveM, aucune prise de contrôle de l’écran, aucun FPS/resmon natif mesuré.

# 1.7.0

- Fond remplacé par un atlas dessiné natif 8K, dans la direction approuvée ; géographie préservée.
- Grande carte ouverte sur l’île, encart agrandi autour du joueur, six filtres visuels de lieux.
- Palettes jour/nuit sur la carte et minimap, transition automatique conservée.
- Cache GPU borné, deux chargements simultanés, fond permanent, bordures de tuiles sans couture.
- Zoom continu limité à la définition de l’atlas ; reprise du contexte et radar de repli conservés.
- Atlas des blips, Lua, GPS et préférences existants conservés. Rendus hors jeu examinés ; validation native à effectuer.

# 1.6.0

- Fond 2D vectoriel : côtes et rivages, aplats de relief, forêts, quartiers, bâtiments et routes. Suppression du chargement des tuiles photographiques/raster pendant la navigation.
- Zoom continu ancré au curseur, borné de 280 à 18000 ; suppression des sauts de niveau de tuile et du retour à un fond d’ensemble flou.
- Rendu GPU plat, sans perspective, élévation ou moteur 3D. Buffers statiques, traits regroupés par cellules et réutilisation du fond inchangé. Définition conservée pendant les interactions.
- Contours de bâtiments limités à leur silhouette extérieure pour éviter les diagonales internes des triangles du modèle source. Noms de quartiers espacés selon l’échelle.
- Reprise après perte/restauration du contexte ; repli radar natif conservé. Blips, GPS, callbacks et préférences inchangés.
- Navigation, zooms extrêmes, curseur, résolutions, thème, reprise de contexte et fermeture vérifiés en navigateur logiciel. Aucun FPS/resmon natif affirmé.

# 1.5.0

- Carte 3D retirée du chargement NUI. Nouveau rendu Canvas 2D à tuiles locales et routes vectorielles, sans chargement de modèle ni moteur WebGL.
- Cartographie personnalisée : quartiers, bâtiments à plat, terrain vert, eau, rivages et hiérarchie routière. Petites taches bleues parasites filtrées par continuité de l’eau.
- Palettes jour/nuit communes à la minimap et à la grande carte ; transition automatique selon l’heure GTA, choix Auto/Jour/Nuit conservé.
- Zoom, rotation à plat, recherche, sélection, repères et route native conservés ; commande 3D et inclinaison supprimées de l’interface.
- Tuiles à plusieurs résolutions, chargements limités à six, cache d’images borné et dessin suspendu au repos. Cache de chemins vectoriels limité à douze vues spatiales.
- Config.CustomMap remplace Config.Map3D. Clés de préférences et callbacks historiques conservés pour les profils existants. Blips et GFx inchangés.
- Rendus navigateur examinés. Fluidité, resmon et comportement natifs à confirmer dans FiveM.

# 1.4.0

- Couche routière issue des connexions natives : simplification conservant les intersections, carrefours arrondis et deux passes de contraste pour garder les chaussées lisibles.
- Classification des bâtiments affinée : les pentes naturelles ne sont plus traitées comme des façades blanches.
- Grande carte en projection parallèle inclinée, relief atténué, inclinaison bornée et recentrage au nord à une échelle locale.
- Eau des lacs Alamo et Lago Zancudo rétablie par des masques de rivage ; noms de régions sobres en vue d’ensemble.
- Géométrie routière partagée, découpage spatial et regroupement à grande distance. Les plafonds de pixels et la suspension au repos sont conservés.
- Atlas, styles et scripts des blips inchangés. Réseau de fond statique, sans remplacement du GPS natif. Aucun nouveau callback ni changement Lua.
- Rendus navigateur examinés ; comportement et performances FiveM restent à confirmer en jeu.

# 1.3.0

- Carte graphique : volumes mats, arêtes franches, aplats et palette jour/nuit. Aucune texture photographique chargée par ce rendu.
- Interface compacte à icônes, infobulles personnalisées, recherche et filtres, aide masquée par défaut, fiche de destination contextuelle.
- Atlas, couleurs et styles de blips conservés ; aucun changement de client/blips.lua ou du GFx.
- Surface de rendu limitée au vrai cadre, supersampling local de la minimap et plafond de pixels en plein écran. Adaptation de définition au temps de dessin CPU.
- Raf suspendues au repos ; chargement initial unique, deux matériaux principaux, géométrie regroupée spatialement et contours selon la distance/qualité.
- Scan et envoi des blips suspendus lorsque les vues ne sont pas actives ; calcul du repli pour zones mis en cache.
- Repli natif, choix du thème, repères GPS, sauvegarde et chemins de fermeture conservés.
- Rendus navigateur examinés ; validation FiveM/GPU et mesures natives restent nécessaires.

# 1.2.0

- Minimap et carte plein écran en WebGL, géométrie de San Andreas embarquée, modèle simplifié et textures locales.
- Ambiance automatique à l’heure du jeu, forçage jour/nuit, transition progressive et préférence de mouvement réduit.
- Zoom, déplacement, rotation, inclinaison, projection 2D/3D, recentrage et vue d’ensemble ; commandes souris, clavier et manette.
- Lecture des blips existants, styles Classique/Cyan/Couleurs RP, recherche par type et rue ; création/effacement local d’un repère GPS depuis la carte avec validation des coordonnées et du jeton de menu.
- Tracé du GPS disponible par échantillonnage natif, sans route inventée ; guidage de la grande carte indépendant de l’affichage compact.
- Repli radar natif au chargement, en échec WebGL, hors couverture et pour les zones radar. Accès au Menu GTA conservé.
- Qualité réglable avec plafonds 20/30/45 images/s, découpage spatial de la géométrie et suspension du rendu hors affichage. Performances FiveM non mesurées.
- Dépendance Three.js embarquée, notices et provenance du modèle fournies. Aucun changement des masques/GFx ni de la géométrie du radar de secours.
- Captures navigateur du vrai modèle ; validation en jeu encore nécessaire.

# 1.1.1

- Remplacement de l’affichage des trois listes natives par des contrôles HTML/SVG : situation de l’aperçu, type de véhicule et filtre du catalogue.
- Icônes et descriptions, sélection cochée, survol distinct, ouverture/fermeture brèves, chevron animé et préférences de mouvement réduit respectées.
- Panneau positionné dans l’espace disponible, défilement sans scrollbar native, focus et sélection de texte du champ de recherche harmonisés.
- Navigation souris/clavier/manette ; Échap/B referme d’abord le choix ouvert, clic extérieur et Tab annulent sans changer la valeur. Les événements existants sont conservés.
- Nouveau module NUI local `web/controls.js`, sans appel serveur ou modification Lua. Syntaxe et rendus navigateur examinés ; validation native FiveM à effectuer.

# 1.1.0

- Éditeur de placement plein écran : carte/jauges et compteur indépendants, guides, alignement, avertissement de chevauchement, souris/clavier/manette. Brouillon non persistant jusqu’à validation, annulation et retour à l’origine.
- Positions bornées selon la résolution et la zone de sécurité, avec espace réservé au GPS, aux jauges et aux alertes. Cadre et radar utilisent les mêmes coordonnées natives ; géométrie interne, masque et GFx conservés.
- Trois favoris configurables, raccourcis 1/2/3 et F, sélection gauche/droite + X à la manette, échange des doublons et conservation des vérifications de disponibilité.
- Sons courts synthétisés dans le navigateur, activation et volume indépendants, fréquence limitée et échec audio sans effet sur la navigation.
- Aperçus isolés pour santé faible, réserve/moteur, émission radio et nuit ; aucune donnée de jeu modifiée.
- Transitions de catégories et retours de pression rapides, respect des préférences de mouvement réduit et absence de scrollbar native conservée.
- Échanges d’éditeur sérialisés et bornés ; jeton de session pour rejeter les requêtes tardives d’un menu fermé. Libération du brouillon à la fermeture/à l’arrêt ; sauvegarde KVP existante conservée.
- Syntaxe et rendus navigateur examinés. Confirmation FiveM et performances en jeu restent à effectuer.

# 1.0.0

- Correctif visuel : barres de défilement natives masquées dans les réglages et le catalogue de blips ; défilement et navigation conservés.
- Intégration de la direction visuelle approuvée : graphite, ivoire et accents, angles découpés, pictogrammes SVG et typographie homogène.
- HUD personnage : icônes pleines, jauges et valeurs plus lisibles, cadre transparent conservant les limites exactes du radar natif. Pas d’image générée utilisée comme HUD.
- GPS : pictogrammes vectoriels de direction, colonne séparée de distance de manœuvre estimée, destination, distance restante et états de calcul/indisponibilité.
- Compteurs voiture/moto/vélo/bateau/hélicoptère/avion : carrosserie visuelle commune, régime segmenté, ceinture existante conservée. Altitude intégrée au compteur aérien, endurance au compteur vélo.
- Voix/radio : microphone, micro coupé et antenne identifiables ; bandeaux contextuels assortis au HUD.
- Notifications : icônes information/confirmation/avertissement/erreur et cadres assortis ; file d’attente, priorités et durée de lecture conservées.
- Menu Échap : numérotation, pictogrammes, sélection cyan/accents, chevrons et favori illustré.
- Réglages : panneau composé, aperçu fidèle au nouveau rendu, catégories réorganisées, icônes par préférence, listes défilantes et commandes de sauvegarde/annulation conservées.
- Cyan devient la palette par défaut pour les préférences non définies. Les préférences déjà enregistrées restent prioritaires ; aucun KVP n’est effacé.
- Trois styles de blips, correction des teintes de 0.9.0, GFx, géométrie du radar, données natives, ESX et sauvegarde restent conservés.
- Aucun nouveau callback, événement réseau ou appel natif ajouté. Le changement porte sur la présentation, le manifeste, la valeur par défaut de palette et la documentation.
- Rendus navigateur sans fenêtre examinés ; confirmation du comportement GTA/FiveM et des performances à faire en jeu. Aucun test de jeu exécuté.

# 0.9.0

- Blips : normalisation des teintes sur 293 sprites de points d’intérêt. Les sprites 59 (commerce), 110 (armurerie), 119 (stand de tir) 73 (vêtements) et 72 (réparation automobile) ont des silhouettes plus lisibles. Les trois atlas et leur provenance sont synchronisés. Les entités, rayons et marqueurs de navigation gardent leurs couleurs natives.
- Catalogue intégré : 968 entrées, recherche, filtres par catégorie, styles fidèles aux atlas actifs et navigation clavier/manette.
- HUD : accent Sauge/Cyan/Ambre, taille de texte indépendante, contraste renforcé, réaction temporaire aux variations importantes et symboles d’alerte sans dépendance exclusive à la couleur.
- Contexte : oxygène en secondes sous l’eau, endurance pendant l’effort et sa récupération, état à terre. Les données sont lues sans modifier le personnage.
- Voix : proximité et émission radio séparées, canal pendant la transmission, portée temporaire après changement, état hors ligne. Export de présentation SetMicrophoneMuted pour les intégrations qui connaissent réellement cet état.
- GPS : destination, prochaine rue détectée, état de calcul puis indisponibilité, notification unique à proximité du repère. Distances routières et directions restent estimées ; distance directe explicitement nommée.
- Véhicules : altitude sol des aéronefs, option nœuds sur les bateaux, indication moteur coupé. Profils vélo, moto, bateau, hélicoptère, avion et train conservés.
- Notifications : durée adaptée au texte, priorités, regroupement aussi dans la file d’attente et plafond de six messages en attente.
- Menu : favori configurable avec F ou X manette, dernière catégorie mémorisée, piège de focus incluant les actions, restauration des couleurs natives à la fermeture.
- Sauvegarde : nouveaux réglages validés dans le KVP existant, Annuler et réinitialisations préservés. Aucun effacement automatique des préférences.
- Fréquences bornées : position/rue 500 ms, guidage 500 ms, calcul routier 2 s, scan de blips par lots. Géométrie, masque et GFx de minimap inchangés.
- Revue syntaxique et rendus navigateur sans fenêtre. Le résultat GTA/ESX/pma-voice, la manette native, les redémarrages/reconnexions et resmon restent à confirmer dans FiveM.

# 0.8.1

- Guidage : le point du joueur est lu directement, sans dépendre des indicateurs de route de blip ni de la présence de nouveaux noms de natives dans les bindings du client.
- Distance routière estimée calculée au plus une fois toutes les deux secondes. Si les nœuds routiers sont indisponibles, distance explicitement indiquée à vol d’oiseau.
- Échantillonnage GPS compatible avec les anciens alias via appel natif par hash et pointeur de sortie explicite. Aucun itinéraire ni géométrie de minimap modifié.
- Commande client F8 `hudgps` : état de l’option, présence du point et données reçues, sans coordonnées personnelles.
- Revue du flux Lua/NUI et comparaison des fichiers installés ; résultat natif à confirmer en jeu, aucun test exécuté.

# 0.8.0

- Guidage en lecture seule des routes natives : distance restante et direction estimée par échantillonnage borné des points GPS, sans créer ni remplacer les itinéraires.
- Avertissements ciblés de carburant faible et de moteur endommagé ; niveaux critiques, seuils de retour et réglage de désactivation.
- Entrée/sortie du compteur et apparition de l’armure en transitions courtes, annulables et compatibles avec la réduction des mouvements. La géométrie du radar reste fixe.
- Préréglages Minimal / Équilibré / Détaillé, validés côté Lua, sauvegardés dans le KVP existant et compatibles avec Annuler. Position, échelle, unité, animations et blips conservés.
- Harmonisation de la palette native GTA pendant la pause : accent, fonds et teintes de carte. Couleurs antérieures restaurées à la fermeture et à l’arrêt de la ressource. Aucun paramètre graphique réel n’est modifié par le thème.
- Correction d’identifiants dupliqués entre les symboles SVG et les éléments de carburant/ceinture ; la jauge et l’état attaché ciblent désormais les éléments visibles.
- Deux modules client ajoutés au manifeste ; refresh puis restart vanta_hud.
- Rendus navigateur inspectés ; comportement natif, palette GTA et direction GPS à confirmer dans FiveM. Aucun test automatisé effectué.

# 0.7.0

- Intégration des deux maquettes validées : navigation, santé et besoins réunis dans un cadre continu, localisation plus légère et compteur véhicule en panneau unique.
- Jauges affinées, libellés Faim / Soif, niveaux de voix et armure conservés.
- Nouveau pictogramme de ceinture validé : personne vue de face, sangle diagonale et boucle ; état relié à l’intégration existante.
- Compteur et aperçu des réglages utilisent la même présentation, avec régime et ceinture actualisés dans l’aperçu.
- Conservation du HUD adaptatif, des profils de véhicule, de l’annulation des réglages, des notifications et des styles de blips.
- Aucun changement des coordonnées natives de la carte, des atlas, du GFx, des scripts Lua ni des raccordements ESX.
- Copie précédente sauvegardée. Rendus navigateur inspectés ; résultat FiveM à confirmer après restart vanta_hud.

# 0.6.0

- HUD adaptatif : santé, faim et soif atténuées presque pleines, contraste renforcé sous 50 %, alertes faibles conservées. Option désactivable.
- Compteur contextuel : rapports et régime masqués sur vélos, bateaux, hélicoptères, avions et trains ; carburant masqué sur vélos et trains ; ceinture limitée aux véhicules compatibles.
- Notifications harmonisées en haut à droite, trois cartes simultanées, file bornée et regroupement des répétitions. Entrées et sorties courtes, réduction des mouvements respectée.
- Export de présentation Notify avec repli ESX si le HUD n’est pas prêt ou est arrêté ; relais pour notifications normales et avancées dans deux fichiers ESX sauvegardés.
- Aperçu Actuel / À pied / En véhicule, avec choix de la catégorie de véhicule, indépendant des données du jeu.
- Annuler les modifications restaure l’ensemble des réglages présents à l’ouverture ; réinitialisation de l’onglet courant ou globale. Les opérations attendent les sauvegardes en cours.
- Survol, sélection clavier/manette et activation distincts ; doubles activations bloquées pendant la requête.
- Ajout de la classe du véhicule et de l’échelle au message de présentation ; géométrie native, atlas et GFx conservés.
- Rendus navigateur inspectés ; pas de test automatisé ni de session FiveM effectués.

# 0.5.0

- Intégration de la direction visuelle approuvée : HUD compact, compteur, menu diagonal et réglages avec aperçu.
- Suppression des marques visibles ; conservation des noms techniques, exports et KVP pour compatibilité.
- Apparition progressive du menu, transitions de sélection et jauges fluides ; réduction des mouvements respectée.
- Comparaison des styles Classique, Cyan et Couleurs RP, branchée sur la sauvegarde existante.
- Sauvegardes sérialisées et erreurs conservées ; l’inventaire et le téléphone gardent les intégrations disponibles.
- Aucune modification des atlas, du GFx, du chargeur des blips, des valeurs ESX ou de la géométrie du radar.
- Un nouvel asset d’aperçu est déclaré dans le manifeste : refresh puis restart vanta_hud.
- Inspection visuelle sur rendus navigateur ; comportement natif en jeu non vérifié.

# 0.4.5

- Intégration des trois atlas de silhouettes reconnaissables validés par le joueur.
- 904 silhouettes issues des références natives, 2 pictogrammes littéraux Vanta et 8 symboles de la direction approuvée.
- 38 repères hérités conservés faute de référence exploitable ; entrées invisibles maintenues.
- Aperçus des huit familles dans les réglages synchronisés avec les atlas.
- Conservation du chargeur, des sauvegardes, de la géométrie du radar et du GFx de 0.4.4.
- Copie installée ; chargement et lisibilité en jeu à confirmer par le joueur.

# 0.4.4

- Index du paquet serveur examiné : aucun atlas sous blips/styles ; anciens atlas présents directement sous blips.
- Remplacement des trois atlas aux chemins déjà distribués et alignement du chargeur sur ces chemins.
- Les silhouettes, couleurs, sauvegardes et géométrie du radar restent identiques.
- Aucun cache supprimé ; application en jeu à confirmer après refresh puis restart vanta_hud.

# 0.4.3

- Nom de dictionnaire runtime unique à chaque démarrage pour éviter la réutilisation d'un dictionnaire déjà enregistré par une ancienne instance.
- Retrait de l'association de texture précédente avant le changement de cible, conformément au fonctionnement de la bimap native.
- Trois atlas déclarés explicitement dans le manifeste ; vérification de présence client et dimensions avant application.
- Journaux précisant l'étape défaillante, sans bloquer la sauvegarde des réglages.
- Pas de modification du radar, des styles dessinés ou du catalogue GFx. Résultat en jeu non observé.

# 0.4.2

- Sauvegarde locale découplée du chargement des textures de blips : une erreur graphique ne rejette plus tous les réglages.
- Préférences écrites puis relues dans le KVP existant avant accusé de réception.
- Application des styles reportée après la réponse NUI ; erreur de style signalée séparément.
- Requêtes de sauvegarde sérialisées ; les dernières modifications sont envoyées avant fermeture, retour ou action du menu.
- Erreur de sauvegarde affichée avec son message, sans fermer le menu.
- Affichage dans FiveM et persistance après reconnexion restent à confirmer par le joueur.

# 0.4.1

- Retour aux styles de référence : Classique, Cyan et Couleurs RP.
- Silhouettes pleines, cadre cyan fermé et palette RP plus vive.
- Symboles de pêche et de marchand conservés, différenciés du commerce standard.
- Teinte des POI statiques neutralisée et restaurée à l’arrêt pour respecter les couleurs dessinées.
- Aucun changement du placement de la minimap ni du GFx depuis 0.4.0. Affichage natif non observé.

# 0.4.0

- Trois styles réellement sélectionnables : Contours, Lisible, Cyan ; choix validé et sauvegardé côté client.
- Atlas natif échangeable, pictogrammes renforcés et aperçu de huit familles dans les réglages.
- Deux identifiants Vanta supplémentaires : 966 pêche et 967 marchand, en plus des 966 entrées officielles.
- Patch Huntfish séparant les usages qui partageaient abusivement le sprite natif 68 (dépanneuse). Repli natif si le HUD est arrêté.
- Aucun changement de géométrie ou de zoom de minimap depuis le correctif validé 0.3.5.
- Compilation graphique et aperçu effectués ; comportement dans FiveM après reconnexion non observé.

# 0.3.5

- Ajustement du cadre sur la seconde capture : retrait de 2 pixels supplémentaires en haut et 9 pixels en bas, à 1080p.
- Marges horizontales, zoom et radar natif inchangés. Aucun contrôle de l’écran ; résultat à confirmer par le joueur.

# 0.3.4

- Cadre NUI calculé sur la surface visible du radar plutôt que sur le composant GTA avec ses gouttières.
- Retrait des marges latérales et supérieures ; réserve basse conservée pour les blips de bord.
- Marges exprimées à 1080p et multipliées par la taille du HUD.
- Aucun changement du zoom, des textures ou de la position native. Calibrage basé sur la capture fournie, à confirmer en jeu.

# 0.3.3

- Retrait du basculement temporaire en radar agrandi pendant le placement.
- Maintien explicite du radar compact hors menu, pause et masquage cinématique.
- Zoom local conservé à 250 mètres ; catalogue de blips inchangé.
- Correctif à observer en jeu après restart vanta_hud ; aucune prise de contrôle de l’écran.

# 0.3.2

- Retrait du masque blanc qui laissait la carte déborder.
- Retour aux dimensions natives, avec mise à l'échelle uniforme.
- Maintien de la distance du radar avec la native dédiée par frame, uniquement hors carte/menu.
- Commande provisoire de diagnostic retirée.

# 0.3.1

- Masque de radar rectangulaire explicite et géométrie correspondante.
- Suppression de la compression verticale indépendante à 82 %.
- Zoom du radar normal défini explicitement à 1100, sans modifier la carte plein écran.
- Relecture différée du radar pendant 50 ms ; nettoyage du masque à l'arrêt.
- Le GFx des blips reste celui de 0.3.0 et nécessite toujours un rechargement par reconnexion.

# 0.3.0

- Intégration du HUD affiné, jauges chiffrées, pictogrammes uniformes et compteur avec régime moteur réel.
- Nouveau quick menu Échap, panneau diagonal blanc/cyan et accès aux applications existantes.
- Réglages avec descriptions, sélection claire et aperçu cartographique dédié.
- Catalogue de blips natifs dans un GFx avec atlas incorporé ; conservation des ID/couleurs, retrait du scan et des six remappages.
- Sauvegarde et retrait du GFx concurrent d'esx_hud pendant le déploiement local. Reconnexion nécessaire.

# 0.2.0 — 18 octobre 2026

- Réglages remplacés par un écran de jeu complet, inspiré de la référence fournie : onglets, lignes de choix, aperçu et aide contextuelle.
- Géométrie carte/masque/fond synchronisée, proportions plus horizontales et rafraîchissement du GFx après déplacement/redimensionnement.
- Prise en compte du viewport NUI réel ; les besoins restent visibles sans minimap à pied.
- Finitions HUD et compteur, taille indépendante du compteur, opacité, alertes et indicateurs configurables.
- Migration des préférences locales vers v2 et fermeture du menu lors d'un masquage cinématique.

# 0.1.0 — 18 octobre 2026

- Première version installable du HUD et quick menu validés en maquette.
- Intégration aux ressources ESX Legacy, inventaire, sd-phone, pma-voice et ceinture existante.
- Trois styles de six blips custom, remappage de points existants et restauration à l'arrêt.
- Réglages persistants, gestion du focus et masquage par ressource pour scènes cinématiques.


